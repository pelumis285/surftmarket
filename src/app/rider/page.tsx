"use client";
import { useState } from "react";

export default function RiderPage() {
  const [online, setOnline] = useState(true);
  const [jobs, setJobs] = useState([
    { id: "D-8812", pickup: "TechHub, Computer Village", drop: "12 Allen Ave, Ikeja (3.2km)", fee: 1800, earn: 1450, status: "offer" },
    { id: "D-8813", pickup: "Adire House, Yaba", drop: "Plot 5, VI (8.1km)", fee: 3400, earn: 2700, status: "offer" },
    { id: "D-8809", pickup: "FreshMart, Mile 12", drop: "Gbagada Phase 2", fee: 2200, earn: 1760, status: "active" },
  ]);
  const [delivered, setDelivered] = useState(0);

  const decide = (id: string, accept: boolean) =>
    setJobs((j) => accept ? j.map((x) => (x.id === id ? { ...x, status: "active" } : x)) : j.filter((x) => x.id !== id));

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-stone-900 border rounded-3xl p-4">
        <span className="w-12 h-12 rounded-full bg-slate-900 text-white grid place-items-center font-black">E</span>
        <div className="flex-1 min-w-[190px]"><h1 className="font-black">Emeka R. • 🛵 Bike LAG-482-QA</h1><p className="text-[12px] text-slate-500">★ 4.9 • 1,240 trips • {online ? "🟢 Online — sharing live location" : "⚪ Offline"}</p></div>
        <button onClick={() => setOnline(!online)} className={`w-full sm:w-auto font-bold text-sm px-5 py-2.5 rounded-xl ${online ? "bg-green-600 text-white" : "bg-slate-200"}`}>{online ? "Go offline" : "Go online"}</button>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[["Today", `₦${(12400 + delivered * 1500).toLocaleString()}`], ["COD held", "₦8,500"], ["Rating", "4.9★"]].map(([a, b]) => (
          <div key={a} className="bg-white dark:bg-stone-900 border rounded-2xl p-4 text-center"><p className="text-[12px] text-slate-500">{a}</p><p className="font-black text-xl">{b}</p></div>
        ))}
      </div>

      <h2 className="mt-4 font-extrabold">📥 Job offers {online ? "" : "(paused — you're offline)"}</h2>
      <div className="mt-2 space-y-2">
        {online && jobs.filter((j) => j.status === "offer").map((j) => (
          <div key={j.id} className="bg-white dark:bg-stone-900 border-2 border-[var(--brand)] rounded-3xl p-4">
            <p className="font-black text-sm">{j.id} • earn <span className="text-green-600">₦{j.earn.toLocaleString()}</span> <span className="text-slate-400 font-normal">(fee ₦{j.fee.toLocaleString()})</span></p>
            <p className="text-[13px] mt-1">📦 {j.pickup}<br />📍 {j.drop}</p>
            <div className="mt-2 flex gap-2 flex-wrap">
              <button onClick={() => decide(j.id, true)} className="flex-1 min-w-[120px] font-bold text-sm rounded-xl py-2.5 bg-green-600 text-white">Accept (15s)</button>
              <button onClick={() => decide(j.id, false)} className="font-bold text-sm rounded-xl py-2.5 px-5 border">Decline</button>
              <button className="font-bold text-sm rounded-xl py-2.5 px-4 border">🧭 Preview</button>
            </div>
          </div>
        ))}
        {jobs.filter((j) => j.status === "offer").length === 0 && <p className="text-sm text-slate-500 bg-white dark:bg-stone-900 border rounded-2xl p-4">No offers right now — nearest-first auto-assign is watching. Timeout 15s, then next rider.</p>}
      </div>

      <h2 className="mt-4 font-extrabold">🚚 Active delivery</h2>
      {jobs.filter((j) => j.status === "active").map((j) => (
        <ActiveJob key={j.id} job={j} onDone={() => { setJobs((x) => x.filter((y) => y.id !== j.id)); setDelivered((d) => d + 1); }} />
      ))}

      <div className="mt-4 bg-white dark:bg-stone-900 border rounded-3xl p-4 text-sm">
        <h2 className="font-extrabold">Wallet & performance</h2>
        <p className="mt-1">This week ₦68,400 • on-time 97% • acceptance 88% • COD reconciled ✓</p>
        <div className="mt-2 flex gap-2 flex-wrap"><button className="font-bold text-sm px-4 py-2 rounded-xl text-white" style={{ background: "var(--brand)" }}>Withdraw earnings</button><button className="font-bold text-sm px-4 py-2 rounded-xl border">📦 Third-party courier adapter</button></div>
      </div>
    </div>
  );
}

function ActiveJob({ job, onDone }: { job: any; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [otp, setOtp] = useState("");
  return (
    <div className="mt-2 bg-slate-950 text-white rounded-3xl p-4">
      <p className="font-bold text-sm">{job.id} • {["Confirm pickup (code 4419)", "Navigate to customer", "Confirm delivery with OTP + photo"][step]}</p>
      <div className="mt-2 h-32 rounded-2xl bg-white/10 relative overflow-hidden map-dots">
        <span className="absolute text-2xl" style={{ left: `${20 + step * 25}%`, top: "40%" }}>🛵</span>
        <span className="absolute bottom-2 left-2 text-[11px] bg-white text-slate-900 px-2 py-1 rounded-full font-bold">● Sharing live GPS • ETA {12 - step * 4} min</span>
      </div>
      {step === 0 && <button onClick={() => setStep(1)} className="mt-2 w-full font-bold text-sm rounded-xl py-2.5 bg-white text-slate-900">Confirm pickup — code 4419 ✓</button>}
      {step === 1 && <div className="mt-2 grid sm:grid-cols-2 gap-2"><button className="font-bold text-sm rounded-xl py-2.5 bg-white text-slate-900">🧭 Open navigation</button><button onClick={() => setStep(2)} className="font-bold text-sm rounded-xl py-2.5 bg-orange-500">Arrived →</button></div>}
      {step === 2 && (
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Customer OTP" className="flex-1 rounded-xl px-3 py-2.5 text-sm text-slate-900" maxLength={6} />
          <button className="font-bold text-sm border border-dashed rounded-xl px-3 py-2.5">📸 Photo</button>
          <button onClick={onDone} className="font-bold text-sm rounded-xl px-4 py-2.5 bg-green-500">Deliver ✓</button>
        </div>
      )}
    </div>
  );
}
