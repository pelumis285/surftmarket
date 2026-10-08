"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { DELIVERY_OPTIONS, orderCode, otp } from "@/lib/format";

export default function CheckoutPage() {
  const { cart, cartTotal, coupon, couponDiscount, clearCart, user } = useStore();
  const router = useRouter();
  const [step] = useState(0);
  const [contact, setContact] = useState({ name: user?.name ?? "", email: "", phone: "" });
  const [addr, setAddr] = useState({ city: "Lagos", street: "", landmark: "", pin: "6.5244, 3.3792" });
  const [speed, setSpeed] = useState("standard");
  const [pay, setPay] = useState("paystack");
  const [placing, setPlacing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [done, setDone] = useState<{ code: string; otp: string } | null>(null);

  const ship = DELIVERY_OPTIONS.find((d) => d.id === speed)?.fee ?? 1500;
  const total = Math.max(0, cartTotal - couponDiscount + (cart.length ? ship : 0));

  const place = async () => {
    if (!cart.length) return;
    if (!contact.name || (!contact.email && !contact.phone) || !addr.street) {
      alert("Please fill name, email/phone and street address.");
      return;
    }
    setPlacing(true);
    setCheckoutError("");
    const code = orderCode();
    const codeOtp = otp(6);
    try {
      const response = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create", code, items: cart, contact, address: addr,
          deliveryOption: speed, paymentMethod: pay, subtotal: cartTotal,
          couponCode: coupon?.code, deliveryOtp: codeOtp,
        }),
      });
      const data = await response.json() as { ok?: boolean; error?: string; pricing?: { total?: number; discount?: number } };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Unable to place this order.");
      const confirmedTotal = Number(data.pricing?.total ?? total);
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      try {
        const prev = JSON.parse(localStorage.getItem("sf_orders") ?? "[]");
        prev.unshift({ code, total: confirmedTotal, discount: Number(data.pricing?.discount ?? couponDiscount), couponCode: coupon?.code, status: "paid", date: new Date().toISOString(), items: cart.length, otp: codeOtp, timeline: [{ s: "placed", t: new Date().toISOString() }, { s: "paid", t: new Date().toISOString() }] });
        localStorage.setItem("sf_orders", JSON.stringify(prev));
      } catch {}
      clearCart();
      setDone({ code, otp: codeOtp });
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to place this order.");
    } finally {
      setPlacing(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-3 sm:px-4 pt-6 sm:pt-10 text-center">
        <div className="bg-white dark:bg-stone-900 rounded-3xl border p-5 sm:p-8">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-black mt-2">Payment held in escrow!</h1>
          <p className="text-sm text-slate-500 mt-1">Order <b className="text-slate-900 dark:text-white">{done.code}</b> is paid. Funds release to the vendor only after you confirm delivery with OTP <b>{done.otp}</b>.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href={`/track/${done.code}`} className="font-bold text-sm rounded-xl py-3 text-white" style={{ background: "var(--brand)" }}>Track live →</Link>
            <Link href="/products" className="font-bold text-sm rounded-xl py-3 border">Continue shopping</Link>
          </div>
          {!user && <p className="mt-3 text-[13px]">💡 <Link href="/auth" className="font-bold text-[var(--brand)]">Create an account</Link> to attach this order & sync your cart.</p>}
          <p className="mt-2 text-[12px] text-slate-500">Receipt sent by email/SMS • Invoice PDF in tracking page</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return <div className="max-w-lg mx-auto px-4 py-10 text-center"><p className="text-5xl">🛒</p><h1 className="font-black text-xl mt-2">Cart is empty</h1><Link href="/products" className="font-bold text-[var(--brand)]">Shop now →</Link></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
      <div className="space-y-3">
        <h1 className="text-xl font-black">Checkout {step === 0 && <span className="block sm:inline text-[12px] font-bold text-slate-500">• Guest welcome — no account needed</span>}</h1>
        <section className="bg-white dark:bg-stone-900 rounded-3xl border p-4 sm:p-5">
          <h2 className="font-extrabold">1 • Contact</h2>
          <div className="mt-2 grid md:grid-cols-3 gap-2">
            <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Full name *" className="border rounded-xl px-3 py-2.5 text-sm" />
            <input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="Email *" className="border rounded-xl px-3 py-2.5 text-sm" />
            <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="Phone / WhatsApp *" className="border rounded-xl px-3 py-2.5 text-sm" />
          </div>
        </section>
        <section className="bg-white dark:bg-stone-900 rounded-3xl border p-4 sm:p-5">
          <h2 className="font-extrabold">2 • Delivery address & map pin</h2>
          <div className="mt-2 grid md:grid-cols-2 gap-2">
            <select value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className="border rounded-xl px-3 py-2.5 text-sm">{["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Enugu", "Accra"].map((c) => <option key={c}>{c}</option>)}</select>
            <input value={addr.pin} onChange={(e) => setAddr({ ...addr, pin: e.target.value })} placeholder="Map pin lat,lng" className="border rounded-xl px-3 py-2.5 text-sm" aria-label="Map pin" />
            <input value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} placeholder="Street + house no *" className="border rounded-xl px-3 py-2.5 text-sm md:col-span-2" />
            <input value={addr.landmark} onChange={(e) => setAddr({ ...addr, landmark: e.target.value })} placeholder="Landmark (optional)" className="border rounded-xl px-3 py-2.5 text-sm md:col-span-2" />
          </div>
          <div className="mt-2 rounded-2xl overflow-hidden border map-dots bg-slate-50 dark:bg-stone-800 p-4">
            <p className="text-[13px] font-bold">📍 {addr.city} • pin {addr.pin}</p>
            <div className="mt-2 h-28 rounded-xl bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-stone-800 dark:to-stone-700 relative">
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl">📍</span>
              <span className="absolute left-4 top-3 text-[11px] bg-white rounded-full px-2 py-0.5 font-bold">OpenStreetMap preview</span>
              <span className="absolute right-4 bottom-3 text-[11px] bg-slate-900 text-white rounded-full px-2 py-0.5">Drag pin • Accurate to 10m</span>
            </div>
          </div>
        </section>
        <section className="bg-white dark:bg-stone-900 rounded-3xl border p-4 sm:p-5">
          <h2 className="font-extrabold">3 • Delivery speed</h2>
          <div className="mt-2 grid md:grid-cols-2 gap-2">
            {DELIVERY_OPTIONS.map((d) => (
              <button key={d.id} onClick={() => setSpeed(d.id)} className={`text-left border rounded-2xl p-3 ${speed === d.id ? "border-[var(--brand)] bg-orange-50 dark:bg-orange-950/30" : ""}`}>
                <span className="font-bold text-sm">{d.label}</span><span className="block text-[13px] text-slate-500">₦{d.fee.toLocaleString()} • ETA {d.eta}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="bg-white dark:bg-stone-900 rounded-3xl border p-4 sm:p-5">
          <h2 className="font-extrabold">4 • Payment (escrow via adapter)</h2>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
            {[{ id: "paystack", l: "💳 Paystack" }, { id: "flutterwave", l: "💸 Flutterwave" }, { id: "stripe", l: "🌍 Stripe" }, { id: "pod", l: "💵 Pay on delivery" }].map((m) => (
              <button key={m.id} onClick={() => setPay(m.id)} className={`border rounded-2xl p-3 text-sm font-bold ${pay === m.id ? "border-[var(--brand)] bg-orange-50 dark:bg-orange-950/30" : ""}`}>{m.l}</button>
            ))}
          </div>
          <p className="text-[12px] text-slate-500 mt-2">🔒 {pay === "pod" ? "Pay rider on arrival, still OTP-protected." : "Charged now, held in escrow, released after OTP delivery confirmation or auto-release in 7 days."} Refunds & partial refunds supported.</p>
        </section>
      </div>
      <aside className="bg-white dark:bg-stone-900 rounded-3xl border p-5 h-fit lg:sticky lg:top-32">
        <h2 className="font-extrabold">Order summary</h2>
        <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
          {cart.map((i) => (
            <div key={i.slug + (i.variant ?? "")} className="flex gap-2 items-center text-[13px]">
              <img src={i.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <span className="flex-1 line-clamp-1 font-medium">{i.name} × {i.qty}</span>
              <span className="font-bold">₦{(i.price * i.qty).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-sm space-y-1 border-t pt-2">
          <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">₦{cartTotal.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Discount {coupon && `(${coupon.code})`}</span><span data-testid="checkout-discount" className="text-green-600">−₦{couponDiscount.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Shipping ({speed})</span><span className="font-bold">₦{ship.toLocaleString()}</span></div>
          <div className="flex justify-between font-black text-base"><span>Total</span><span data-testid="checkout-total">₦{total.toLocaleString()}</span></div>
        </div>
        {checkoutError && <p role="alert" className="mt-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/30 px-3 py-2 text-[12px] font-bold">{checkoutError}</p>}
        <button onClick={place} disabled={placing} className="w-full mt-3 font-extrabold rounded-xl py-3.5 text-white text-sm disabled:opacity-60" style={{ background: "var(--brand)" }}>{placing ? "Processing escrow payment…" : `Pay ₦${total.toLocaleString()} securely →`}</button>
        <p className="text-[11px] text-slate-500 mt-2 text-center">Split by vendor automatically • Parent order for you, sub-orders per vendor</p>
      </aside>
    </div>
  );
}
