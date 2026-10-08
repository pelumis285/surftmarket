"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PRODUCTS } from "@/lib/demo-data";
import { ProductCard, Empty } from "@/components/ui";

export default function AccountPage() {
  const { user, wishlist, followed } = useStore();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [addr, setAddr] = useState([{ label: "Home", line: "12 Allen Ave, Ikeja, Lagos", phone: "0803-111-2222" }]);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      let saved: any[] = [];
      try { saved = JSON.parse(localStorage.getItem("sf_orders") ?? "[]"); } catch {}
      setOrders(saved.length > 0 ? saved : [
        { code: "SF10000001", total: 48500, status: "out_for_delivery", date: new Date().toISOString(), items: 2 },
        { code: "SF99881122", total: 18500, status: "completed", date: new Date(Date.now() - 86400000 * 6).toISOString(), items: 1 },
      ]);
    }, 0);
    return () => window.clearTimeout(hydrate);
  }, []);

  const wishItems = PRODUCTS.filter((p) => wishlist.includes(p.slug));

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 grid lg:grid-cols-[240px_minmax(0,1fr)] gap-4">
      <aside className="bg-white dark:bg-stone-900 rounded-3xl border p-4 h-fit lg:sticky lg:top-32">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-full grid place-items-center font-black text-white text-xl" style={{ background: "var(--brand)" }}>{(user?.name ?? "G")[0]}</span>
          <div><p className="font-bold text-sm">{user?.name ?? "Guest shopper"}</p><p className="text-[12px] text-slate-500">{user ? `${user.role} • verified ✓` : "Browsing as guest"}</p></div>
        </div>
        {!user && <Link href="/auth" className="block text-center mt-3 text-[13px] font-bold rounded-xl py-2 text-white" style={{ background: "var(--brand)" }}>Create account — sync orders</Link>}
        <div className="mt-3 flex lg:block gap-1 overflow-x-auto no-scrollbar lg:space-y-1">
          {[["orders", "📦 Orders"], ["wishlist", "♡ Wishlist"], ["addresses", "📍 Addresses"], ["wallet", "💰 Wallet"], ["reviews", "⭐ Reviews"], ["tickets", "🎫 Returns & disputes"], ["settings", "⚙️ Settings"]].map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} className={`block shrink-0 lg:w-full text-left text-[13px] font-bold px-3 py-2 rounded-xl ${tab === id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "hover:bg-slate-50 dark:hover:bg-stone-800"}`}>{l}</button>
          ))}
        </div>
        <div className="mt-3 bg-green-50 dark:bg-green-950 rounded-2xl p-3 text-[12px]"><b>Wallet balance: ₦12,500</b><br />Refundable • withdraw anytime</div>
      </aside>

      <div>
        {tab === "orders" && (
          <div>
            <h1 className="font-black text-xl">Order history</h1>
            <div className="mt-2 space-y-2">
              {orders.map((o) => (
                <div key={o.code} className="bg-white dark:bg-stone-900 rounded-2xl border p-4 flex items-center gap-3 flex-wrap">
                  <span className="w-11 h-11 rounded-xl bg-orange-100 grid place-items-center text-xl">📦</span>
                  <div className="flex-1 min-w-[160px]"><p className="font-bold text-sm">{o.code} • ₦{Number(o.total).toLocaleString()}</p><p className="text-[12px] text-slate-500 capitalize">{o.status.replace(/_/g, " ")} • {o.items} items • {new Date(o.date).toLocaleDateString()}</p></div>
                  <span className="text-[11px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Escrow {o.status === "completed" ? "released" : "held"}</span>
                  <Link href={`/track/${o.code}`} className="text-[13px] font-bold px-4 py-2 rounded-xl text-white" style={{ background: "var(--brand)" }}>Track →</Link>
                  <button className="text-[13px] font-bold px-3 py-2 rounded-xl border">Invoice</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "wishlist" && (
          <div><h1 className="font-black text-xl">Wishlist ({wishItems.length}) • following {followed.length} stores</h1>
            {wishItems.length === 0 ? <div className="mt-2"><Empty icon="♡" title="Empty" body="Save items to sync across devices." /></div> :
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">{wishItems.map((p) => <ProductCard key={p.slug} slug={p.slug} />)}</div>}</div>
        )}
        {tab === "addresses" && (
          <div><h1 className="font-black text-xl">Addresses</h1>
            <div className="mt-2 grid md:grid-cols-2 gap-2">{addr.map((a, i) => (
              <div key={i} className="bg-white dark:bg-stone-900 border rounded-2xl p-4 text-sm"><p className="font-bold">{a.label}</p><p className="text-slate-500">{a.line}</p><p className="text-slate-500">{a.phone}</p></div>
            ))}
              <button onClick={() => setAddr([...addr, { label: "Office", line: "Plot 5, Victoria Island, Lagos", phone: "0803-999-0000" }])} className="border-dashed border-2 rounded-2xl p-4 font-bold text-sm">+ Add address (with map pin)</button></div></div>
        )}
        {tab === "wallet" && (
          <div><h1 className="font-black text-xl">Wallet & refunds</h1>
            <div className="mt-2 grid md:grid-cols-3 gap-2">
              {[["Balance", "₦12,500"], ["Pending escrow", "₦48,500"], ["Refunded YTD", "₦8,200"]].map(([a, b]) => (
                <div key={a} className="bg-white dark:bg-stone-900 border rounded-2xl p-4"><p className="text-[12px] text-slate-500">{a}</p><p className="font-black text-xl">{b}</p></div>
              ))}
            </div>
            <div className="mt-2 bg-white dark:bg-stone-900 border rounded-2xl p-4 text-sm space-y-1">
              <p className="flex flex-wrap justify-between gap-1"><span>Refund SF99881102 — size exchange</span><b className="text-green-600">+₦6,500</b></p>
              <p className="flex flex-wrap justify-between gap-1"><span>Withdrawal to GTB ••4521</span><b>−₦20,000 • paid</b></p>
              <button className="mt-2 font-bold text-sm px-4 py-2 rounded-xl text-white" style={{ background: "var(--brand)" }}>Withdraw</button>
            </div></div>
        )}
        {tab === "reviews" && <div><h1 className="font-black text-xl">My reviews</h1><p className="text-sm text-slate-500 mt-1">You reviewed 4 products • 86% found helpful. Reply from vendors appear here.</p></div>}
        {tab === "tickets" && (
          <div><h1 className="font-black text-xl">Returns, disputes & tickets</h1>
            <div className="mt-2 bg-white dark:bg-stone-900 border rounded-2xl p-4 text-sm">
              <p className="font-bold">#T-2041 • Wrong size — Ankara dress <span className="ml-2 text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">In review</span></p>
              <p className="text-slate-500">Vendor offered exchange • Escrow frozen until resolved</p>
              <div className="mt-2 flex flex-col sm:flex-row gap-2"><input placeholder="Reply to support…" className="flex-1 border rounded-xl px-3 py-2 text-sm" /><button className="font-bold text-sm px-4 py-2 rounded-xl bg-slate-900 text-white">Send</button></div>
              <button className="mt-2 font-bold text-sm text-[var(--brand)]">+ Open new dispute / return</button>
            </div></div>
        )}
        {tab === "settings" && (
          <div><h1 className="font-black text-xl">Notifications & security</h1>
            <div className="mt-2 bg-white dark:bg-stone-900 border rounded-2xl p-4 text-sm space-y-2">
              {(["Email order updates", "SMS + WhatsApp", "Push notifications", "Price-drop alerts"]).map((s) => (
                <label key={s} className="flex justify-between border-b pb-2"><span>{s}</span><input type="checkbox" defaultChecked className="w-5 h-5" /></label>
              ))}
              <div className="flex flex-col sm:flex-row gap-2"><input placeholder="Saved card •• 4242" className="flex-1 border rounded-xl px-3 py-2 text-sm" /><button className="font-bold text-sm border rounded-xl px-3 py-2">+ Add</button></div>
            </div></div>
        )}
      </div>
    </div>
  );
}
