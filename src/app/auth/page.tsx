"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

const ROLES = [
  { id: "customer", t: "Customer", d: "Shop, track, refunds & wallet" },
  { id: "vendor", t: "Vendor", d: "Sell, payouts, promotions" },
  { id: "affiliate", t: "Affiliate", d: "Share links, earn commission" },
  { id: "rider", t: "Rider", d: "Deliver, earn per trip" },
];

function AuthInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const { login } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState(sp.get("role") ?? "customer");
  const [identity, setIdentity] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", cac: "", bank: "", vehicle: "bike" });
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && !form.name) { setMsg("Enter your name"); return; }
    if (mode === "login" && !identity.trim()) { setMsg("Enter your email or phone number"); return; }
    if (mode === "register" && !form.email && !form.phone) { setMsg("Enter email or phone"); return; }
    if (!form.password) { setMsg("Enter your password"); return; }
    setSubmitting(true);
    setMsg("");
    try {
      const loginIdentity = identity.trim();
      const payload = mode === "login"
        ? { action: "login", password: form.password, ...(loginIdentity.includes("@") ? { email: loginIdentity } : { phone: loginIdentity }) }
        : { action: "register", ...form, role };
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to sign in");

      login(data.user);
      const destination = data.user.role === "vendor" ? "/vendor"
        : data.user.role === "rider" ? "/rider"
        : data.user.role === "affiliate" ? "/affiliate"
        : data.user.role === "admin" ? "/admin"
        : "/account";
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setMsg(`❌ ${error instanceof Error ? error.message : "Unable to authenticate"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 grid md:grid-cols-[minmax(0,1fr)_360px] lg:grid-cols-[1fr_380px] gap-4">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-orange-900 text-white p-8 hidden md:flex flex-col justify-between min-h-[480px]">
        <div><p className="font-black text-2xl">One account.<br />Shop, sell, ride & earn.</p>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>✅ Guest checkout — no login to buy</li><li>🛡️ Escrow on every order</li><li>💰 Wallet + refunds + affiliate payouts</li><li>📦 Live rider tracking</li>
          </ul></div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["2M+", "shoppers"], ["18k", "vendors"], ["4.8★", "rating"]].map(([a, b]) => (
            <div key={b} className="bg-white/10 rounded-2xl p-3"><p className="font-black text-xl">{a}</p><p className="text-[11px] text-white/70">{b}</p></div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-stone-900 rounded-3xl border p-4 sm:p-6 h-fit">
        <div className="mb-4">
          <h1 className="font-black text-xl sm:text-2xl">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="text-[13px] text-slate-500">{mode === "login" ? "Sign in with the email or phone number on your account." : "Choose how you want to use Surftmarket."}</p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-stone-800 rounded-full p-1">
          {(["login", "register"] as const).map((m) => (
            <button type="button" key={m} onClick={() => { setMode(m); setStep(1); setMsg(""); }} className={`flex-1 text-sm font-bold rounded-full py-2.5 capitalize ${mode === m ? "bg-white dark:bg-stone-900 shadow" : ""}`}>{m === "login" ? "Sign in" : "Join"}</button>
          ))}
        </div>
        {mode === "register" && (<>
          <p className="mt-3 text-[12px] font-bold text-slate-500 uppercase">I am a…</p>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {ROLES.map((r) => (
              <button type="button" key={r.id} onClick={() => setRole(r.id)} className={`min-w-0 min-h-[68px] text-left border rounded-2xl p-2.5 ${role === r.id ? "border-[var(--brand)] bg-orange-50 dark:bg-orange-950/30" : ""}`}>
                <span className="block text-[13px] font-bold">{r.t}</span><span className="block text-[11px] text-slate-500">{r.d}</span>
              </button>
            ))}
          </div>
        </>)}
        {msg && <p className="mt-3 text-[13px] bg-slate-50 dark:bg-stone-800 rounded-xl p-3" role="status" aria-live="polite">{msg}</p>}
        <form onSubmit={submit} className="mt-4 space-y-2">
            {mode === "register" && (
              <div className="text-[12px] font-bold text-slate-500">Step {step} of {role === "customer" || role === "affiliate" ? 1 : 3} {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="ml-2 underline">← back</button>}</div>
            )}
            {mode === "login" && (<>
              <label className="block text-[12px] font-bold">Email or phone number
                <input value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="you@example.com or 0803…" autoComplete="username" className="mt-1 w-full border rounded-xl px-3 py-3 text-sm" />
              </label>
              <label className="block text-[12px] font-bold">Password
                <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" type="password" autoComplete="current-password" className="mt-1 w-full border rounded-xl px-3 py-3 text-sm" />
              </label>
              <p className="text-[12px] text-slate-500">Customer, vendor, rider, affiliate and admin accounts all sign in here.</p>
            </>)}
            {mode === "register" && step === 1 && (<>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name *" autoComplete="name" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" autoComplete="email" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone e.g. 0803…" autoComplete="tel" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              <input value={form.password} placeholder="Password *" type="password" autoComplete="new-password" onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm" />
            </>)}
            {mode === "register" && role === "vendor" && step === 2 && (<>
              <input value={form.cac} onChange={(e) => setForm({ ...form, cac: e.target.value })} placeholder="CAC / registration number" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              <input placeholder="Business address" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              <div className="border-dashed border-2 rounded-xl p-4 text-center text-[13px] text-slate-500">📤 Upload ID + CAC docs (JPG/PDF)</div>
            </>)}
            {mode === "register" && role === "vendor" && step === 3 && (<>
              <input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="Bank • acct no • name" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              <label className="flex gap-2 text-[13px]"><input type="checkbox" required /> I accept the vendor agreement & 12% commission</label>
            </>)}
            {mode === "register" && role === "rider" && step === 2 && (<>
              <select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm"><option value="bike">🛵 Bike</option><option value="bicycle">🚲 Bicycle</option><option value="van">🚐 Van</option><option value="car">🚗 Car</option></select>
              <input placeholder="Plate number + license" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              <input placeholder="Guarantor name + phone" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
            </>)}
            {mode === "register" && role === "rider" && step === 3 && (<>
              <input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="Bank • acct no • name" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              <label className="flex gap-2 text-[13px]"><input type="checkbox" required /> I accept the rider agreement and safety policy</label>
            </>)}
            {mode === "register" && (role === "vendor" || role === "rider") && step < 3 && (
              <button type="button" onClick={() => setStep(step + 1)} className="w-full font-bold rounded-xl py-3 text-sm bg-slate-900 text-white">Continue →</button>
            )}
            {!(mode === "register" && (role === "vendor" || role === "rider") && step < 3) && (
              <button disabled={submitting} className="w-full font-bold rounded-xl py-3 text-white text-sm disabled:opacity-60" style={{ background: "var(--brand)" }}>{submitting ? "Please wait…" : mode === "login" ? "Sign in →" : `Create ${role} account →`}</button>
            )}
            <button type="button" disabled className="w-full border font-bold rounded-xl py-2.5 text-sm opacity-60">🔵 Google sign-in — coming next</button>
            <p className="text-[12px] text-center text-slate-500">Secure password login • OTP and password reset coming next</p>
        </form>
        <p className="mt-3 text-[11px] text-slate-400 text-center">Rate-limited • Audit-logged • RBAC enforced</p>
      </div>
    </div>
  );
}
export default function AuthPage() {
  return <Suspense fallback={<p className="p-8">Loading…</p>}><AuthInner /></Suspense>;
}
