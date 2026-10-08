import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coupons, vendors } from "@/db/schema";
import { calculateCoupon, normalizeCouponCode, type CouponCartItem, type CouponRule } from "@/lib/coupons";

const BUILT_IN_COUPONS: Record<string, CouponRule> = {
  SURFT10: { code: "SURFT10", type: "percent", value: 10, minOrder: 5000 },
  WELCOME500: { code: "WELCOME500", type: "flat", value: 500, minOrder: 2000 },
};

type CouponLookup = {
  rule: CouponRule;
  active: boolean;
  expiresAt: Date | null;
  usageLimit: number;
  used: number;
};

export async function findCoupon(codeInput: string): Promise<CouponLookup | null> {
  const code = normalizeCouponCode(codeInput);
  if (!code) return null;
  const [record] = await db.select({
    code: coupons.code,
    type: coupons.type,
    value: coupons.value,
    minOrder: coupons.minOrder,
    active: coupons.active,
    expiresAt: coupons.expiresAt,
    usageLimit: coupons.usageLimit,
    used: coupons.used,
    vendorName: vendors.name,
    vendorSlug: vendors.slug,
  }).from(coupons).leftJoin(vendors, eq(coupons.vendorId, vendors.id)).where(eq(coupons.code, code)).limit(1);

  if (record) {
    return {
      rule: {
        code: record.code,
        type: record.type === "flat" ? "flat" : "percent",
        value: Number(record.value ?? 0),
        minOrder: Number(record.minOrder ?? 0),
        vendorName: record.vendorName,
        vendorSlug: record.vendorSlug,
      },
      active: record.active !== false,
      expiresAt: record.expiresAt,
      usageLimit: Number(record.usageLimit ?? 0),
      used: Number(record.used ?? 0),
    };
  }

  const builtIn = BUILT_IN_COUPONS[code];
  return builtIn ? { rule: builtIn, active: true, expiresAt: null, usageLimit: 1_000_000, used: 0 } : null;
}

export async function validateCouponCode(codeInput: string, items: CouponCartItem[]) {
  const code = normalizeCouponCode(codeInput);
  if (!code) return { ok: false as const, error: "Enter a coupon code." };
  const coupon = await findCoupon(code);
  if (!coupon) return { ok: false as const, error: "Coupon code not found." };
  if (!coupon.active) return { ok: false as const, error: "This coupon is inactive." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) return { ok: false as const, error: "This coupon has expired." };
  if (coupon.usageLimit > 0 && coupon.used >= coupon.usageLimit) return { ok: false as const, error: "This coupon has reached its usage limit." };

  const calculation = calculateCoupon(coupon.rule, items);
  if (calculation.eligibleSubtotal <= 0 && coupon.rule.vendorName) {
    return { ok: false as const, error: `This coupon only applies to products sold by ${coupon.rule.vendorName}.` };
  }
  if (calculation.eligibleSubtotal < coupon.rule.minOrder) {
    return { ok: false as const, error: `Spend at least ₦${coupon.rule.minOrder.toLocaleString()} on eligible items to use this coupon.` };
  }
  if (!calculation.qualifies) return { ok: false as const, error: "This coupon does not apply to the current cart." };

  return { ok: true as const, coupon: coupon.rule, ...calculation };
}
