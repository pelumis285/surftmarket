import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons, vendors } from "@/db/schema";
import { currentUser, hasRole, recordAudit } from "@/lib/auth";
import { normalizeCouponCode, type CouponCartItem } from "@/lib/coupons";
import { validateCouponCode } from "@/lib/coupon-server";

export const dynamic = "force-dynamic";

function responseError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

function sanitizeItems(value: unknown): CouponCartItem[] | null {
  if (!Array.isArray(value) || value.length > 100) return null;
  const items: CouponCartItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const item = entry as Record<string, unknown>;
    const price = Number(item.price);
    const qty = Number(item.qty);
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(qty) || qty < 1 || qty > 100) return null;
    items.push({
      price,
      qty,
      vendor: typeof item.vendor === "string" ? item.vendor.slice(0, 140) : "",
      vendorSlug: typeof item.vendorSlug === "string" ? item.vendorSlug.slice(0, 160) : undefined,
    });
  }
  return items;
}

async function vendorForUser(userId: string, storeName?: unknown, storeSlug?: unknown) {
  const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, userId)).limit(1);
  if (!vendor) return null;
  const normalizedStoreName = typeof storeName === "string" ? storeName.trim().slice(0, 140) : "";
  const normalizedStoreSlug = typeof storeSlug === "string" ? storeSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 160) : "";
  if ((normalizedStoreName && normalizedStoreName !== vendor.name) || (normalizedStoreSlug && normalizedStoreSlug !== vendor.slug)) {
    const [updated] = await db.update(vendors).set({
      ...(normalizedStoreName ? { name: normalizedStoreName } : {}),
      ...(normalizedStoreSlug ? { slug: normalizedStoreSlug } : {}),
    }).where(eq(vendors.id, vendor.id)).returning();
    return updated;
  }
  return vendor;
}

async function listVendorCoupons(vendorId: string) {
  const rows = await db.select({
    code: coupons.code,
    type: coupons.type,
    value: coupons.value,
    minOrder: coupons.minOrder,
    used: coupons.used,
    active: coupons.active,
    expiresAt: coupons.expiresAt,
  }).from(coupons).where(eq(coupons.vendorId, vendorId));
  return rows.map((coupon) => ({ ...coupon, value: Number(coupon.value ?? 0), minOrder: Number(coupon.minOrder ?? 0), used: Number(coupon.used ?? 0) }));
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return responseError("Sign in to manage coupons.", 401);
  if (!hasRole(user, ["vendor", "admin"])) return responseError("Only vendors can manage store coupons.", 403);
  const vendor = await vendorForUser(user.id);
  if (!vendor) return responseError("Vendor profile not found.", 404);
  return NextResponse.json({ ok: true, coupons: await listVendorCoupons(vendor.id) });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return responseError("Invalid coupon request.", 400);

  if (body.action === "validate") {
    const items = sanitizeItems(body.items);
    if (!items?.length) return responseError("Add an item to your cart before applying a coupon.", 400);
    try {
      const result = await validateCouponCode(String(body.code ?? ""), items);
      return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      console.error("Coupon validation failed", error);
      return responseError("Coupon validation is temporarily unavailable.", 503);
    }
  }

  const user = await currentUser(request);
  if (!user) return responseError("Sign in to manage coupons.", 401);
  if (!hasRole(user, ["vendor", "admin"])) return responseError("Only vendors can manage store coupons.", 403);
  const vendor = await vendorForUser(user.id, body.storeName, body.storeSlug);
  if (!vendor) return responseError("Vendor profile not found.", 404);
  if (vendor.status !== "approved") return responseError("Your vendor account must be approved before creating coupons.", 403);

  if (body.action === "sync") {
    const incoming = Array.isArray(body.coupons) ? body.coupons.slice(0, 30) : [];
    for (const entry of incoming) {
      if (!entry || typeof entry !== "object") continue;
      const value = entry as Record<string, unknown>;
      const code = normalizeCouponCode(String(value.code ?? ""));
      const discount = Number(value.discount ?? value.value);
      const minOrder = Math.max(0, Number(value.minOrder ?? 0));
      if (!/^[A-Z0-9]{4,12}$/.test(code) || !Number.isFinite(discount) || discount < 1 || discount > 80 || !Number.isFinite(minOrder)) continue;
      await db.insert(coupons).values({ code, type: "percent", value: String(discount), minOrder: String(minOrder), vendorId: vendor.id, used: Math.max(0, Number(value.used ?? 0)), active: true }).onConflictDoNothing({ target: coupons.code });
    }
    return NextResponse.json({ ok: true, coupons: await listVendorCoupons(vendor.id) });
  }

  if (body.action === "delete") {
    const code = normalizeCouponCode(String(body.code ?? ""));
    const removed = await db.delete(coupons).where(and(eq(coupons.code, code), eq(coupons.vendorId, vendor.id))).returning({ code: coupons.code });
    if (!removed.length) return responseError("Coupon not found.", 404);
    await recordAudit({ actorId: user.id, actorName: user.name, action: "vendor.coupon.delete", entity: "coupon", meta: { code } });
    return NextResponse.json({ ok: true, coupons: await listVendorCoupons(vendor.id) });
  }

  if (body.action === "create") {
    const code = normalizeCouponCode(String(body.code ?? ""));
    const discount = Number(body.discount);
    const minOrder = Math.max(0, Number(body.minOrder ?? 0));
    if (!/^[A-Z0-9]{4,12}$/.test(code)) return responseError("Use a 4–12 character coupon code.", 400);
    if (!Number.isFinite(discount) || discount < 1 || discount > 80) return responseError("Discount must be between 1% and 80%.", 400);
    if (!Number.isFinite(minOrder) || minOrder > 100_000_000) return responseError("Enter a valid minimum order.", 400);
    try {
      await db.insert(coupons).values({ code, type: "percent", value: String(discount), minOrder: String(minOrder), vendorId: vendor.id, active: true });
    } catch (error) {
      if ((error as { code?: string }).code === "23505") return responseError("That coupon code already exists.", 409);
      throw error;
    }
    await recordAudit({ actorId: user.id, actorName: user.name, action: "vendor.coupon.create", entity: "coupon", meta: { code, discount, minOrder } });
    return NextResponse.json({ ok: true, coupons: await listVendorCoupons(vendor.id) }, { status: 201 });
  }

  return responseError("Unknown coupon action.", 400);
}
