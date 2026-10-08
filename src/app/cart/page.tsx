"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Empty } from "@/components/ui";
import { PRODUCTS } from "@/lib/demo-data";
import { ProductCard } from "@/components/ui";

export default function CartPage() {
  const { cart, setQty, removeFromCart, cartTotal, coupon, couponDiscount, applyCoupon, removeCoupon, clearCart } = useStore();
  const [couponInput, setCouponInput] = useState(coupon?.code ?? "");
  const [couponStatus, setCouponStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const submitCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApplyingCoupon(true);
    const result = await applyCoupon(couponInput);
    setCouponStatus({ text: result.message ?? result.error ?? "Coupon could not be applied.", error: !result.ok });
    setApplyingCoupon(false);
  };

  const grouped = cart.reduce<Record<string, typeof cart>>((a, i) => { (a[i.vendor] ??= []).push(i); return a; }, {});
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 grid lg:grid-cols-[1fr_340px] gap-4">
      <div>
        <h1 className="text-xl font-extrabold">Shopping cart ({cart.reduce((a, b) => a + b.qty, 0)})</h1>
        {cart.length === 0 ? (
          <div className="mt-3"><Empty icon="🛒" title="Your cart is empty" body="Add items and they will appear here, grouped by vendor." action={<Link href="/products" className="font-bold text-[var(--brand)]">Start shopping →</Link>} /></div>
        ) : Object.entries(grouped).map(([vendor, items]) => (
          <div key={vendor} className="mt-3 bg-white dark:bg-stone-900 rounded-3xl border p-3 sm:p-4">
            <p className="font-bold text-sm">🏪 Sold by <Link href={`/stores/${vendor.toLowerCase().replace(/\s+/g, "-")}`} className="text-[var(--brand)]">{vendor}</Link> • ✔ Verified</p>
            <div className="mt-2 space-y-2">
              {items.map((i) => (
                <div key={i.slug + (i.variant ?? "")} className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 border rounded-2xl p-2">
                  <img src={i.image} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover" />
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-[13px] font-bold line-clamp-2">{i.name}</p>
                    <p className="text-[11px] text-slate-500">{i.variant}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="flex items-center gap-2 border rounded-full px-1">
                        <button onClick={() => setQty(i.slug, i.qty - 1, i.variant)} className="w-7 h-7 font-bold">−</button>
                        <span className="font-bold text-sm w-5 text-center">{i.qty}</span>
                        <button onClick={() => setQty(i.slug, i.qty + 1, i.variant)} className="w-7 h-7 font-bold">+</button>
                      </span>
                      <span className="font-extrabold">₦{(i.price * i.qty).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto flex flex-row sm:flex-col justify-end gap-3 sm:gap-1 text-[12px]">
                    <button onClick={() => removeFromCart(i.slug, i.variant)} className="text-red-500 font-bold">Remove</button>
                    <button className="text-slate-500">Save later</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {cart.length > 0 && <button onClick={clearCart} className="mt-3 text-[13px] text-red-600 font-bold">Clear cart</button>}
        <h2 className="mt-6 font-extrabold">You may also like</h2>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">{PRODUCTS.slice(4, 8).map((p) => <ProductCard key={p.slug} slug={p.slug} compact />)}</div>
      </div>
      <aside className="bg-white dark:bg-stone-900 rounded-3xl border p-5 h-fit lg:sticky lg:top-32">
        <h2 className="font-extrabold">Order summary</h2>
        <form onSubmit={submitCoupon} className="mt-2 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2">
          <input value={couponInput} onChange={(event) => { setCouponInput(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setCouponStatus(null); }} placeholder="Coupon code" className="flex-1 border rounded-xl px-3 py-2 text-sm bg-transparent" aria-label="Coupon code" />
          <button type="submit" data-testid="apply-coupon" disabled={applyingCoupon || !couponInput.trim()} className="font-bold text-sm px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50">{applyingCoupon ? "Checking…" : "Apply"}</button>
        </form>
        <p className="text-[11px] text-slate-500 mt-1">Try SURFT10 (10% off) or WELCOME500 (₦500 off)</p>
        {couponStatus && <p role="status" data-testid="coupon-status" className={`mt-2 rounded-xl px-3 py-2 text-[12px] font-bold ${couponStatus.error ? "bg-red-50 text-red-700 dark:bg-red-950/30" : "bg-green-50 text-green-700 dark:bg-green-950/30"}`}>{couponStatus.text}</p>}
        {coupon && <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/30 px-3 py-2 text-[12px]"><span><b>{coupon.code}</b> {couponDiscount > 0 ? "is applied" : "no longer meets the cart requirements"}</span><button type="button" data-testid="remove-coupon" onClick={() => { removeCoupon(); setCouponInput(""); setCouponStatus({ text: "Coupon removed." }); }} className="font-bold text-red-600">Remove</button></div>}
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">₦{cartTotal.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Shipping estimate</span><span className="font-bold">₦1,500 – ₦5,000</span></div>
          {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon {coupon && `(${coupon.code})`}</span><span data-testid="coupon-discount">−₦{couponDiscount.toLocaleString()}</span></div>}
          <div className="flex justify-between text-base font-extrabold border-t pt-2"><span>Total</span><span data-testid="cart-total">₦{Math.max(0, cartTotal - couponDiscount).toLocaleString()}</span></div>
        </div>
        <Link href="/checkout" className="block text-center mt-3 font-extrabold rounded-xl py-3 text-white text-sm" style={{ background: "var(--brand)" }}>Proceed to checkout →</Link>
        <p className="text-[11px] text-slate-500 mt-2 text-center">🛡️ Escrow protected • Guest checkout supported</p>
      </aside>
    </div>
  );
}
