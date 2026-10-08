"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function CartDrawer() {
  const { cart, setQty, removeFromCart, cartTotal, cartOpen, setCartOpen, coupon, couponDiscount, applyCoupon, removeCoupon } = useStore();
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

  if (!cartOpen) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
      <aside className="absolute right-0 top-0 h-[100dvh] w-full max-w-md bg-white dark:bg-stone-950 flex flex-col sm:rounded-l-3xl overflow-hidden">
        <div className="p-4 pt-[max(1rem,env(safe-area-inset-top))] border-b flex items-center justify-between">
          <h3 className="font-extrabold text-lg">Cart ({cart.reduce((a, b) => a + b.qty, 0)})</h3>
          <button onClick={() => setCartOpen(false)} className="w-9 h-9 grid place-items-center rounded-full bg-slate-100 dark:bg-stone-800" aria-label="Close cart">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && <p className="text-center text-slate-500 py-10">🛒 Your cart is empty.<br /><Link href="/search" onClick={() => setCartOpen(false)} className="text-[var(--brand)] font-bold">Start shopping →</Link></p>}
          {cart.map((i) => (
            <div key={i.slug + (i.variant ?? "")} className="flex gap-3 border rounded-2xl p-2">
              <img src={i.image} alt="" className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold line-clamp-2">{i.name}</p>
                <p className="text-[11px] text-slate-500">{i.vendor}{i.variant ? ` • ${i.variant}` : ""}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="flex items-center gap-2 border rounded-full px-1 py-0.5">
                    <button onClick={() => setQty(i.slug, i.qty - 1, i.variant)} className="w-6 h-6 grid place-items-center font-bold">−</button>
                    <span className="text-sm font-bold w-4 text-center">{i.qty}</span>
                    <button onClick={() => setQty(i.slug, i.qty + 1, i.variant)} className="w-6 h-6 grid place-items-center font-bold">+</button>
                  </span>
                  <span className="font-extrabold text-sm">₦{(i.price * i.qty).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => removeFromCart(i.slug, i.variant)} className="text-slate-400 px-1" aria-label="Remove">🗑</button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t space-y-2">
            <form onSubmit={submitCoupon} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input aria-label="Drawer coupon code" value={couponInput} onChange={(event) => { setCouponInput(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setCouponStatus(null); }} placeholder="Coupon (try SURFT10)" className="min-w-0 border rounded-xl px-3 py-2 text-sm bg-transparent" />
              <button type="submit" data-testid="drawer-apply-coupon" disabled={applyingCoupon || !couponInput.trim()} className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-bold disabled:opacity-50">{applyingCoupon ? "…" : "Apply"}</button>
            </form>
            {couponStatus && <p role="status" data-testid="drawer-coupon-status" className={`rounded-xl px-3 py-2 text-[12px] font-bold ${couponStatus.error ? "bg-red-50 text-red-700 dark:bg-red-950/30" : "bg-green-50 text-green-700 dark:bg-green-950/30"}`}>{couponStatus.text}</p>}
            {coupon && <div className="flex items-center justify-between gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 px-3 py-2 text-[12px]"><span><b>{coupon.code}</b> applied</span><button type="button" onClick={() => { removeCoupon(); setCouponInput(""); setCouponStatus({ text: "Coupon removed." }); }} className="font-bold text-red-600">Remove</button></div>}
            <div className="text-sm flex justify-between"><span>Subtotal</span><span className="font-bold">₦{cartTotal.toLocaleString()}</span></div>
            {couponDiscount > 0 && <div className="text-sm flex justify-between text-green-600"><span>Coupon</span><span>−₦{couponDiscount.toLocaleString()}</span></div>}
            <div className="flex gap-2">
              <Link href="/cart" onClick={() => setCartOpen(false)} className="flex-1 text-center border rounded-xl py-2.5 font-bold text-sm">View cart</Link>
              <Link href="/checkout" onClick={() => setCartOpen(false)} className="min-w-0 text-center rounded-xl px-2 py-2.5 font-bold text-sm text-white" style={{ background: "var(--brand)" }}>Checkout • ₦{Math.max(0, cartTotal - couponDiscount).toLocaleString()}</Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
