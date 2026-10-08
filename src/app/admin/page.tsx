"use client";
import { useState } from "react";

export default function AdminPage() {
  const [tab, setTab] = useState("dash");
  const [brand, setBrand] = useState("#ea580c");
  const [name, setName] = useState("surftmarket");
  const [approvals, setApprovals] = useState([
    { id: "V-881", kind: "Vendor", who: "Kicks NG • Lagos", doc: "CAC + ID uploaded", status: "pending" },
    { id: "R-204", kind: "Rider", who: "Ibrahim M. • bike LAG-992", doc: "License + guarantor", status: "pending" },
    { id: "P-771", kind: "Product", who: "Oraimo clone? • TechHub", doc: "3 images • needs review", status: "pending" },
    { id: "W-119", kind: "Payout ₦320k", who: "TechHub → GTB", doc: "Escrow verified", status: "pending" },
    { id: "A-042", kind: "Affiliate", who: "@dealsbyada • 12k followers", doc: "KYC ok", status: "pending" },
  ]);
  const decide = (id: string, ok: boolean) =>
    setApprovals((a) => a.map((x) => (x.id === id ? { ...x, status: ok ? "approved" : "rejected" } : x)));

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="w-11 h-11 rounded-2xl bg-slate-900 text-white grid place-items-center font-black">A</span>
        <div className="flex-1 min-w-[180px]"><h1 className="font-black text-lg sm:text-xl">Admin control center</h1><p className="text-[12px] text-slate-500">Super admin • sub-roles: support • finance • content • audit-logged</p></div>
        <span className="text-[12px] font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-full">5 pending approvals</span>
      </div>

      <div className="mt-3 flex gap-1 overflow-x-auto no-scrollbar text-[13px] font-bold">
        {[["dash", "📊 Dashboard"], ["approvals", "✅ Approvals"], ["users", "👥 Users"], ["finance", "💰 Finance & escrow"], ["content", "🎨 Content & homepage"], ["settings", "⚙️ White-label settings"], ["audit", "📜 Audit log"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-full whitespace-nowrap ${tab === id ? "bg-slate-900 text-white" : "bg-white dark:bg-stone-900 border"}`}>{l}</button>
        ))}
      </div>

      {tab === "dash" && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[["GMV (30d)", "₦86.4M", "+22%"], ["Orders", "12,408", "+18%"], ["Revenue (commission)", "₦9.1M", "10.5% take"], ["Active deliveries", "47 live", "map below"]].map(([a, b, c]) => (
              <div key={a} className="bg-white dark:bg-stone-900 border rounded-2xl p-4"><p className="text-[12px] text-slate-500">{a}</p><p className="font-black text-xl">{b}</p><p className="text-[11px] text-green-600 font-bold">{c}</p></div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-stone-900 border rounded-3xl p-5">
              <p className="font-bold text-sm">🗺 Live dispatch map (demo)</p>
              <div className="mt-2 h-52 rounded-2xl bg-slate-900 relative overflow-hidden map-dots">
                {[[20, 30], [45, 60], [65, 25], [80, 70], [35, 80]].map(([x, y], i) => (
                  <span key={i} className="absolute text-lg animate-bounce" style={{ left: `${x}%`, top: `${y}%` }}>🛵</span>
                ))}
                <span className="absolute bottom-2 left-2 text-[11px] bg-white rounded-full px-2 py-1 font-bold">47 riders online • 9 unassigned</span>
                <span className="absolute top-2 right-2 text-[11px] bg-green-500 text-white rounded-full px-2 py-1 font-bold">● LIVE</span>
              </div>
            </div>
            <div className="bg-white dark:bg-stone-900 border rounded-3xl p-5 text-sm">
              <p className="font-bold">Disputes & tickets (3 open)</p>
              <p className="mt-2 border rounded-xl p-2">#T-2041 wrong size • escrow frozen • <b className="text-[var(--brand)]">Assign to support →</b></p>
              <p className="mt-1 border rounded-xl p-2">#T-2039 late delivery • rider reassigned ✓</p>
              <p className="mt-2 font-bold">Roles</p>
              <p className="text-slate-500">support: refunds+chat • finance: payouts+ledger • content: banners+blog • super: all + settings</p>
            </div>
          </div>
        </div>
      )}

      {tab === "approvals" && (
        <div className="mt-3 space-y-2">
          {approvals.map((a) => (
            <div key={a.id} className="bg-white dark:bg-stone-900 border rounded-2xl p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[180px]"><p className="font-bold text-sm">{a.id} • {a.kind} — {a.who}</p><p className="text-[12px] text-slate-500">📄 {a.doc}</p></div>
              <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${a.status === "pending" ? "bg-amber-100 text-amber-700" : a.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{a.status}</span>
              {a.status === "pending" && (<>
                <button className="text-[11px] font-bold border rounded-lg px-2 py-1">View docs</button>
                <button onClick={() => decide(a.id, true)} className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-green-600 text-white">Approve</button>
                <button onClick={() => decide(a.id, false)} className="text-[12px] font-bold px-3 py-1.5 rounded-lg border text-red-600">Reject + reason</button>
              </>)}
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="mt-3 bg-white dark:bg-stone-900 border rounded-3xl p-4 text-sm">
          <div className="flex flex-col sm:flex-row gap-2"><input placeholder="Search customers, vendors, riders…" className="flex-1 border rounded-xl px-3 py-2 text-sm" /><button className="font-bold text-sm border rounded-xl px-3 py-2">Export CSV</button></div>
          {[["Chiamaka O.", "customer • 14 orders • ₦312k"], ["TechHub Lagos", "vendor • approved • 12%"], ["Emeka R.", "rider • online • 4.9★"], ["@dealsbyada", "affiliate • gold • 5%"]].map(([a, b]) => (
            <p key={a} className="flex flex-wrap justify-between gap-1 border-b py-2"><span><b>{a}</b> <span className="text-slate-500">— {b}</span></span><span className="font-bold text-[var(--brand)]">Manage →</span></p>
          ))}
          <p className="text-[12px] text-slate-500 mt-2">Reviews moderation • coupons • categories & attributes • static pages • blog</p>
        </div>
      )}

      {tab === "finance" && (
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="bg-white dark:bg-stone-900 border rounded-3xl p-4 text-sm">
            <p className="font-bold">Escrow ledger</p>
            {[["Held", "₦12.4M"], ["Released (7d)", "₦38.2M"], ["Refunded", "₦1.1M"], ["Disputed/frozen", "₦184k"]].map(([a, b]) => (
              <p key={a} className="flex justify-between border-b py-1.5"><span>{a}</span><b>{b}</b></p>
            ))}
            <p className="text-[12px] text-slate-500 mt-1">Commission: global 10% • electronics 8% • fashion 12% • per-vendor override • tax 7.5% VAT • CSV export</p>
          </div>
          <div className="bg-white dark:bg-stone-900 border rounded-3xl p-4 text-sm">
            <p className="font-bold">Payout queue</p>
            <p className="flex flex-wrap justify-between gap-2 border rounded-xl p-2 mt-1"><span>TechHub ₦320k</span><span><button className="font-bold text-green-600 mr-2">Approve</button><button className="font-bold text-red-500">Hold</button></span></p>
            <p className="flex flex-wrap justify-between gap-2 border rounded-xl p-2 mt-1"><span>@dealsbyada ₦48k</span><span><button className="font-bold text-green-600 mr-2">Approve</button><button className="font-bold text-red-500">Flag fraud?</button></span></p>
          </div>
        </div>
      )}

      {tab === "content" && (
        <div className="mt-3 bg-white dark:bg-stone-900 border rounded-3xl p-4 text-sm grid md:grid-cols-2 gap-2">
          <input defaultValue="MEGA SALES • up to 60% off" className="border rounded-xl px-3 py-2" aria-label="Banner" />
          <input defaultValue="Free delivery over ₦25,000" className="border rounded-xl px-3 py-2" aria-label="Banner2" />
          <button className="font-bold px-4 py-2 rounded-xl text-white" style={{ background: "var(--brand)" }}>Publish homepage sections</button>
          <button className="font-bold px-4 py-2 rounded-xl border">Manage blog + static pages</button>
        </div>
      )}

      {tab === "settings" && (
        <div className="mt-3 bg-white dark:bg-stone-900 border rounded-3xl p-5 text-sm grid md:grid-cols-2 gap-3">
          <label className="block">Brand name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="block">Accent color <span className="inline-block w-5 h-5 rounded-full align-middle ml-1" style={{ background: brand }} /><input type="color" value={brand} onChange={(e) => { setBrand(e.target.value); document.documentElement.style.setProperty("--brand", e.target.value); }} className="mt-1 w-full h-10" /></label>
          <label className="block">Default currency<select className="mt-1 w-full border rounded-xl px-3 py-2"><option>NGN ₦</option><option>USD $</option><option>GHS ₵</option><option>KES KSh</option></select></label>
          <label className="block">Attribution window<select className="mt-1 w-full border rounded-xl px-3 py-2"><option>30 days</option><option>14 days</option><option>60 days</option></select></label>
          <label className="block md:col-span-2">Gateways (adapter)<span className="mt-1 flex gap-2 flex-wrap">{["Paystack ✓", "Flutterwave ✓", "Stripe ○"].map((g) => <span key={g} className="border rounded-xl px-3 py-2 font-bold">{g}</span>)}</span></label>
          <label className="block md:col-span-2">Delivery pricing — base ₦800 + ₦220/km × speed × surge<input type="range" className="w-full" defaultValue={60} /></label>
          <p className="md:col-span-2 text-[12px] text-slate-500">Everything white-label: logo, colors, name, commission, languages, templates, SEO, feature toggles. <b>Preview as “{name}” with {brand}</b></p>
          <button className="font-bold px-4 py-2.5 rounded-xl text-white md:col-span-2" style={{ background: "var(--brand)" }}>Save & publish theme</button>
        </div>
      )}

      {tab === "audit" && (
        <div className="mt-3 bg-white dark:bg-stone-900 border rounded-3xl p-4 text-sm">
          {[["admin@surft", "approved payout W-119", "2m"], ["support.ada", "refunded SF9988 ₦6.5k", "18m"], ["finance.musa", "set commission fashion 12%", "1h"]].map(([a, b, c]) => (
            <p key={b} className="flex flex-wrap justify-between gap-1 border-b py-2"><span><b>{a}</b> — {b}</span><span className="text-slate-400">{c} ago</span></p>
          ))}
        </div>
      )}
    </div>
  );
}
