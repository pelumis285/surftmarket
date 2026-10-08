export type CouponCartItem = {
  price: number;
  qty: number;
  vendor: string;
  vendorSlug?: string;
};

export type CouponRule = {
  code: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
  vendorName?: string | null;
  vendorSlug?: string | null;
};

export type CouponCalculation = {
  subtotal: number;
  eligibleSubtotal: number;
  discount: number;
  qualifies: boolean;
};

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 40);
}

export function cartSubtotal(items: CouponCartItem[]) {
  return items.reduce((total, item) => {
    const price = Number.isFinite(Number(item.price)) ? Math.max(0, Number(item.price)) : 0;
    const qty = Number.isFinite(Number(item.qty)) ? Math.max(0, Math.floor(Number(item.qty))) : 0;
    return total + price * qty;
  }, 0);
}

export function couponEligibleSubtotal(rule: CouponRule, items: CouponCartItem[]) {
  if (!rule.vendorName && !rule.vendorSlug) return cartSubtotal(items);
  const vendorName = rule.vendorName?.trim().toLowerCase();
  const vendorSlug = rule.vendorSlug?.trim().toLowerCase();
  return cartSubtotal(items.filter((item) => {
    const itemName = item.vendor?.trim().toLowerCase();
    const itemSlug = item.vendorSlug?.trim().toLowerCase();
    return Boolean((vendorName && itemName === vendorName) || (vendorSlug && itemSlug === vendorSlug));
  }));
}

export function calculateCoupon(rule: CouponRule | null, items: CouponCartItem[]): CouponCalculation {
  const subtotal = cartSubtotal(items);
  if (!rule) return { subtotal, eligibleSubtotal: 0, discount: 0, qualifies: false };
  const eligibleSubtotal = couponEligibleSubtotal(rule, items);
  const minimum = Math.max(0, Number(rule.minOrder) || 0);
  if (eligibleSubtotal <= 0 || eligibleSubtotal < minimum) return { subtotal, eligibleSubtotal, discount: 0, qualifies: false };
  const value = Math.max(0, Number(rule.value) || 0);
  const rawDiscount = rule.type === "percent" ? eligibleSubtotal * Math.min(value, 100) / 100 : value;
  const discount = Math.min(eligibleSubtotal, Math.max(0, Math.round(rawDiscount)));
  return { subtotal, eligibleSubtotal, discount, qualifies: discount > 0 };
}
