"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { STATUS_LABEL } from "@/lib/format";

const DEMO_TIMELINE = ["placed", "paid", "accepted", "preparing", "ready", "assigned", "picked", "out_for_delivery"];

export default function TrackPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [tick, setTick] = useState(0);
  const [otpInput, setOtpInput] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      try {
        const all = JSON.parse(localStorage.getItem("sf_orders") ?? "[]");
        setOrder(all.find((o: any) => o.code === code) ?? null);
      } catch {}
    }, 0);
    const t = setInterval(() => setTick((v) => v + 1), 3000);
    return () => {
      window.clearTimeout(hydrate);
      clearInterval(t);
    };
  }, [code]);

  const stage = Math.min(DEMO_TIMELINE.length - 1, 5 + Math.floor(tick / 2) % 3);
  const rider = { name: "Emeka R.", rating: 4.9, plate: "LAG-482-QA", phone: "0803-***-2211", lat: 6.5244 + tick * 0.002, lng: 3.3792 + tick * 0.0015 };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
      <h1 className="text-lg sm:text-xl font-black break-words">Track order <span className="text-[var(--brand)]">{code}</span></h1>
      <p className="text-[13px] text-slate-500">Live status • rider map • OTP handover {order ? `• ₦${Number(order.total).toLocaleString()}` : ""}</p>

      <div className="mt-3 bg-white dark:bg-stone-900 rounded-3xl border p-4 sm:p-5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {DEMO_TIMELINE.map((s, i) => (
            <div key={s} className="flex items-center shrink-0">
              <div className="flex flex-col items-center w-20">
                <span className={`w-9 h-9 rounded-full grid place-items-center font-bold text-sm ${i <= stage ? "bg-green-500 text-white" : "bg-slate-100 dark:bg-stone-800 text-slate-400"}`}>{i < stage ? "✓" : i + 1}</span>
                <span className={`text-[10px] font-bold text-center mt-1 ${i <= stage ? "" : "text-slate-400"}`}>{STATUS_LABEL[s]}</span>
                <span className="text-[10px] text-slate-400">10:{String(12 + i).padStart(2, "0")}</span>
              </div>
              {i < DEMO_TIMELINE.length - 1 && <span className={`w-6 h-0.5 -mt-8 ${i < stage ? "bg-green-500" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[13px] bg-green-50 dark:bg-green-950 border border-green-200 rounded-xl p-2">✅ Every change is timestamped & triggers email + SMS + in-app notification. Escrow: <b>held</b> until OTP confirm.</p>
      </div>

      <div className="mt-3 grid md:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-stone-900 rounded-3xl border p-5">
          <h2 className="font-extrabold text-sm">🗺 Live rider map</h2>
          <div className="mt-2 h-56 rounded-2xl relative overflow-hidden bg-gradient-to-br from-emerald-50 to-cyan-100 dark:from-stone-800 dark:to-stone-700 map-dots border">
            <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
              <path d="M20,150 C80,120 100,90 150,85 S240,60 280,30" stroke="#0f766e" strokeWidth="4" fill="none" strokeDasharray="8 6" />
              <circle cx="20" cy="150" r="8" fill="#ea580c" /><text x="34" y="154" fontSize="10" fontWeight="bold">Pickup</text>
              <circle cx="280" cy="30" r="8" fill="#16a34a" /><text x="225" y="18" fontSize="10" fontWeight="bold">You</text>
            </svg>
            <span className="absolute text-2xl transition-all" style={{ left: `${30 + (tick * 7) % 55}%`, top: `${60 - (tick * 4) % 35}%` }}>🛵</span>
            <span className="absolute bottom-2 left-2 text-[11px] font-bold bg-slate-900 text-white px-2 py-1 rounded-full">ETA {(18 - tick % 10)} mins • {Math.max(1, 4 - tick % 3)}.{tick % 9} km away</span>
            <span className="absolute top-2 right-2 text-[11px] bg-white px-2 py-1 rounded-full font-bold">● LIVE • {rider.lat.toFixed(4)}, {rider.lng.toFixed(4)}</span>
          </div>
          <div className="mt-3 flex items-center gap-3 border rounded-2xl p-3 flex-wrap">
            <span className="w-11 h-11 rounded-full bg-slate-900 text-white grid place-items-center font-black">E</span>
            <div className="flex-1"><p className="font-bold text-sm">{rider.name} ★ {rider.rating}</p><p className="text-[12px] text-slate-500">{rider.plate} • {rider.phone}</p></div>
            <a href="#" className="w-full sm:w-auto text-center text-[13px] font-bold px-3 py-2 rounded-xl bg-slate-900 text-white">🧭 Navigate</a>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border p-5">
            <h2 className="font-extrabold text-sm">🔑 Confirm delivery (OTP)</h2>
            <p className="text-[13px] text-slate-500">Give this code to the rider ONLY when you hold the parcel{order?.otp ? <> — your code is <b className="text-slate-900 dark:text-white">{order.otp}</b></> : ""}.</p>
            {!confirmed ? (
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="Enter OTP" className="flex-1 border rounded-xl px-3 py-2.5 text-center tracking-widest font-bold" maxLength={6} />
                <button onClick={() => { setConfirmed(true); fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "confirm", code }) }).catch(() => {}); }} className="font-bold text-sm px-4 py-2.5 rounded-xl text-white" style={{ background: "var(--brand)" }}>Confirm</button>
              </div>
            ) : (
              <p className="mt-2 text-sm font-bold text-green-600">✅ Delivered & completed! Funds released to vendor minus 12% commission. Affiliate commission approved.</p>
            )}
            <div className="mt-2 flex gap-2">
              <button className="flex-1 text-[13px] font-bold border rounded-xl py-2">🧾 Invoice PDF</button>
              <button className="flex-1 text-[13px] font-bold border rounded-xl py-2">↩️ Return / dispute</button>
            </div>
          </div>
          <div className="bg-white dark:bg-stone-900 rounded-3xl border p-5 text-[13px]">
            <h2 className="font-extrabold text-sm">Split orders (parent {code})</h2>
            <ul className="mt-2 space-y-1">
              <li className="flex flex-wrap justify-between gap-1 border rounded-xl px-3 py-2"><span>📦 {code}-A • TechHub Lagos</span><b>Out for delivery</b></li>
              <li className="flex flex-wrap justify-between gap-1 border rounded-xl px-3 py-2"><span>📦 {code}-B • Adire House</span><b>Preparing</b></li>
            </ul>
            <Link href="/account" className="text-[var(--brand)] font-bold">Open in my orders →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
