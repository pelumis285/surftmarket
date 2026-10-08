"use client";
import { useState } from "react";
import Link from "next/link";
import { PRODUCTS } from "@/lib/demo-data";

export default function AffiliatePage() {
  const [code] = useState("AFF-ADA-7K2");
  const [target, setTarget] = useState(PRODUCTS[0].slug);
  const [link, setLink] = useState("");
  const [stats] = useState({ clicks: 1842, conv: 96, rate: "5.2%", pending: 48200, approved: 126500 });

  const gen = () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/products/${encodeURIComponent(target)}?aff=${code}`;
    setLink(url);
    fetch("/api/affiliate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "click", code, target }) }).catch(() => {});
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
      <div className="rounded-3xl bg-gradient-to-br from-violet-700 to-indigo-900 text-white p-5 sm:p-6 md:p-8">
        <p className="text-[11px] font-bold bg-white/20 inline-block px-3 py-1 rounded-full">AFFILIATE PROGRAM • 30-DAY COOKIE</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-black">Share anything. Earn 5–12% after delivery.</h1>
        <p className="text-white/80 text-sm mt-1">Commission only on completed (delivered, not refunded) orders • tiers & bonuses • fraud-shielded</p>
        <div className="mt-3 flex gap-2 flex-wrap">
          <span className="bg-white text-slate-900 font-black px-4 py-2 rounded-xl text-sm">Your code: {code}</span>
          <button onClick={gen} className="bg-orange-500 font-bold px-4 py-2 rounded-xl text-sm">Generate link ↓</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {[[`Clicks`, stats.clicks.toLocaleString()], [`Conversions`, String(stats.conv)], [`Conv. rate`, stats.rate], [`Pending`, `₦${stats.pending.toLocaleString()}`], [`Approved`, `₦${stats.approved.toLocaleString()}`]].map(([a, b]) => (
          <div key={a} className="bg-white dark:bg-stone-900 border rounded-2xl p-4"><p className="text-[12px] text-slate-500">{a}</p><p className="font-black text-xl">{b}</p></div>
        ))}
      </div>

      <div className="mt-3 grid lg:grid-cols-[1fr_360px] gap-3">
        <div className="bg-white dark:bg-stone-900 border rounded-3xl p-4 sm:p-5">
          <h2 className="font-extrabold">🔗 Link generator + QR + share</h2>
          <div className="mt-2 flex gap-2 flex-wrap">
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="border rounded-xl px-3 py-2.5 text-sm flex-1 min-w-0 w-full sm:w-auto">
              {PRODUCTS.map((p) => <option key={p.slug} value={p.slug}>{p.name.slice(0, 50)}</option>)}
            </select>
            <button onClick={gen} className="font-bold text-sm px-5 py-2.5 rounded-xl text-white" style={{ background: "var(--brand)" }}>Generate</button>
          </div>
          {link && (
            <div className="mt-3 border rounded-2xl p-3 flex gap-3 items-center flex-wrap">
              <span className="w-20 h-20 grid place-items-center bg-slate-900 text-white rounded-xl text-3xl">▦</span>
              <div className="flex-1 min-w-0 sm:min-w-[200px]"><p className="text-[13px] font-bold break-all">{link}</p>
                <div className="mt-1 flex gap-1 flex-wrap">
                  {[["WhatsApp", "bg-green-500"], ["Facebook", "bg-blue-600"], ["X", "bg-black"], ["Instagram", "bg-gradient-to-tr from-amber-500 to-pink-600"]].map(([l, c]) => (
                    <a key={l} href={`https://wa.me/?text=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer" className={`${c} text-white text-[12px] font-bold px-3 py-1 rounded-full`}>{l}</a>
                  ))}
                  <button onClick={() => navigator.clipboard?.writeText(link)} className="text-[12px] font-bold border px-3 py-1 rounded-full">Copy</button>
                </div></div>
            </div>
          )}
          <h3 className="mt-4 font-bold text-sm">Top converting products</h3>
          <div className="mt-1 space-y-1 text-sm">
            {PRODUCTS.slice(0, 4).map((p, i) => (
              <p key={p.slug} className="flex justify-between gap-2 border rounded-xl px-3 py-2"><span className="min-w-0">#{i + 1} {p.name.slice(0, 40)}…</span><b className="text-green-600 shrink-0">8.{i + 2}%</b></p>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-white dark:bg-stone-900 border rounded-3xl p-5 text-sm">
            <h2 className="font-extrabold">🏆 Leaderboard (this month)</h2>
            {[["@dealsbyada (you)", "₦126k", "gold"], ["@lagosfinds", "₦204k", "platinum"], ["@campusplug", "₦98k", "gold"]].map(([a, b, c]) => (
              <p key={a} className="flex flex-wrap justify-between gap-1 border-b py-1.5"><span>{a} <span className="text-[11px] bg-amber-100 px-1.5 py-0.5 rounded-full font-bold">{c}</span></span><b>{b}</b></p>
            ))}
            <p className="text-[12px] text-slate-500 mt-1">Bonus: +2% after 50 sales • +4% after 200</p>
          </div>
          <div className="bg-white dark:bg-stone-900 border rounded-3xl p-5 text-sm">
            <h2 className="font-extrabold">💸 Payouts</h2>
            <p className="flex justify-between py-1"><span>→ GTB ••8821 ₦60k</span><b className="text-green-600">Paid</b></p>
            <p className="flex justify-between py-1"><span>→ GTB ••8821 ₦48k</span><b className="text-amber-600">Pending</b></p>
            <button className="mt-2 w-full font-bold text-sm rounded-xl py-2.5 text-white" style={{ background: "var(--brand)" }}>Request payout</button>
            <p className="text-[11px] text-slate-500 mt-1">Self-referral & duplicate-click shield active • <Link href="/docs" className="underline">Assets: banners & captions</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
