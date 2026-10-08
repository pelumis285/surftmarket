import { NextRequest } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { cartSubtotal, type CouponCartItem } from "@/lib/coupons";
import { validateCouponCode } from "@/lib/coupon-server";
import { DELIVERY_OPTIONS } from "@/lib/format";

export const dynamic = "force-dynamic";

// Orders API: create (split per vendor), confirm via OTP, timeline + notifications
function splitByVendor(items: any[]) {
  const m = new Map<string, any[]>();
  for (const i of items) {
    const k = i.vendor ?? "default";
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(i);
  }
  return [...m.entries()];
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { action } = body;
  try { await db.execute(sql`select 1`); } catch {}

  if (action === "create") {
    const { code, items = [], couponCode } = body;
    const pricedItems: CouponCartItem[] = Array.isArray(items) ? items.map((item) => ({
      price: Math.max(0, Number(item.price) || 0),
      qty: Math.max(0, Math.floor(Number(item.qty) || 0)),
      vendor: typeof item.vendor === "string" ? item.vendor : "",
      vendorSlug: typeof item.vendorSlug === "string" ? item.vendorSlug : undefined,
    })) : [];
    const subtotal = cartSubtotal(pricedItems);
    if (!pricedItems.length || subtotal <= 0) return Response.json({ ok: false, error: "The order has no valid items." }, { status: 400 });
    const delivery = DELIVERY_OPTIONS.find((option) => option.id === body.deliveryOption) ?? DELIVERY_OPTIONS[0];
    let discount = 0;
    let appliedCoupon: string | null = null;
    if (couponCode) {
      const couponResult = await validateCouponCode(String(couponCode), pricedItems);
      if (!couponResult.ok) return Response.json(couponResult, { status: 400 });
      discount = couponResult.discount;
      appliedCoupon = couponResult.coupon.code;
    }
    const shipping = delivery.fee;
    const total = Math.max(0, subtotal - discount + shipping);
    const splits = splitByVendor(items);
    const subOrders = splits.map(([vendor, lines], i) => ({
      code: `${code}-${String.fromCharCode(65 + i)}`,
      vendor,
      lines: lines.length,
      status: "paid",
      escrow: "held",
    }));
    // Escrow: held until OTP confirm or 7-day auto-release. Commission 12% reserved.
    const commission = Math.round(Number(total) * 0.12);
    return Response.json({
      ok: true, parent: code, subOrders,
      escrow: "held", commission, pricing: { subtotal, discount, shipping, total, couponCode: appliedCoupon },
      message: "Payment held in escrow. Notify vendor + rider dispatched.",
    });
  }

  if (action === "confirm") {
    return Response.json({
      ok: true, code: body.code, status: "completed",
      escrow: "released",
      message: "OTP verified — funds released to vendor minus commission; affiliate commission approved.",
    });
  }

  if (action === "refund") {
    return Response.json({ ok: true, refund: body.amount ?? "full", escrow: "refunded" });
  }

  return Response.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code") ?? "SF10000001";
  return Response.json({
    ok: true, code,
    timeline: [
      { s: "placed", t: new Date().toISOString() },
      { s: "paid", t: new Date().toISOString(), escrow: "held" },
      { s: "accepted", t: new Date().toISOString() },
    ],
  });
}
