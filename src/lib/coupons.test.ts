import assert from "node:assert/strict";
import test from "node:test";
import { calculateCoupon, normalizeCouponCode } from "./coupons";

const items = [
  { price: 28_500, qty: 1, vendor: "TechHub Lagos", vendorSlug: "techhub-lagos" },
  { price: 18_500, qty: 2, vendor: "Adire House", vendorSlug: "adire-house" },
];

test("normalizes coupon codes", () => {
  assert.equal(normalizeCouponCode(" surft-10 "), "SURFT10");
});

test("calculates a global percentage coupon", () => {
  const result = calculateCoupon({ code: "SURFT10", type: "percent", value: 10, minOrder: 5000 }, items);
  assert.deepEqual(result, { subtotal: 65_500, eligibleSubtotal: 65_500, discount: 6_550, qualifies: true });
});

test("scopes a vendor coupon to that vendor's items", () => {
  const result = calculateCoupon({ code: "TECH15", type: "percent", value: 15, minOrder: 0, vendorSlug: "techhub-lagos" }, items);
  assert.equal(result.eligibleSubtotal, 28_500);
  assert.equal(result.discount, 4_275);
});

test("enforces minimum order and caps flat discounts", () => {
  const belowMinimum = calculateCoupon({ code: "MIN", type: "percent", value: 10, minOrder: 70_000 }, items);
  assert.equal(belowMinimum.qualifies, false);
  assert.equal(belowMinimum.discount, 0);
  const capped = calculateCoupon({ code: "FLAT", type: "flat", value: 100_000, minOrder: 0 }, [{ price: 2_000, qty: 1, vendor: "Shop" }]);
  assert.equal(capped.discount, 2_000);
});
