"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { CATEGORIES, type DemoProduct } from "@/lib/demo-data";
import { CURRENCIES, LANGUAGES } from "@/lib/format";

export default function Header() {
  const { cartCount, wishlist, user, logout, currency, setCurrency, lang, setLang, dark, setDark, setCartOpen } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [suggest, setSuggest] = useState<DemoProduct[]>([]);
  const [mega, setMega] = useState(false);
  const [loc, setLoc] = useState("Lagos");
  const [locOpen, setLocOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (!q.trim()) {
      return () => controller.abort();
    }
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ type: "suggest", q: q.trim() });
      if (cat !== "All") params.set("cat", cat);
      fetch(`/api/catalog?${params}`, { cache: "no-store", signal: controller.signal })
        .then(async (response) => {
          const data = await response.json() as { ok?: boolean; items?: DemoProduct[] };
          if (response.ok && data.ok && data.items) setSuggest(data.items);
        })
        .catch((error) => {
          if ((error as Error).name !== "AbortError") setSuggest([]);
        });
    }, 150);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [q, cat]);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setSuggest([]); };
    document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (!mobileMenu) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileMenu(false); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenu]);

  const go = (e?: React.FormEvent) => {
    e?.preventDefault();
    router.push(`/search?q=${encodeURIComponent(q)}&cat=${encodeURIComponent(cat)}`);
    setSuggest([]);
  };

  const accountHref = !user ? "/auth"
    : user.role === "admin" ? "/admin"
    : user.role === "vendor" ? "/vendor"
    : user.role === "rider" ? "/rider"
    : user.role === "affiliate" ? "/affiliate"
    : "/account";

  return (
    <>
      <div className="bg-slate-900 text-white text-[12px]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2">
          <p className="truncate">🎉 Free delivery on orders over ₦25,000 • Pay on delivery available</p>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/affiliate" className="hover:underline">Sell with us</Link>
            <Link href="/vendor" className="hover:underline">Become a vendor</Link>
            <Link href="/rider" className="hover:underline">Ride & earn</Link>
            <Link href="/docs" className="hover:underline">Help</Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-950/95 backdrop-blur border-b border-slate-100 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap lg:flex-nowrap items-center gap-x-2 sm:gap-x-3 gap-y-2">
          <Link href="/" className="order-1 lg:order-none flex items-center gap-2 shrink-0" aria-label="Surftmarket home">
            <span className="w-9 h-9 rounded-xl grid place-items-center text-white font-black text-xl" style={{ background: "linear-gradient(135deg,var(--brand),#7c2d12)" }}>S</span>
            <span className="hidden sm:block leading-none">
              <span className="block font-black text-lg tracking-tight">surft<span style={{ color: "var(--brand)" }}>market</span></span>
              <span className="block text-[10px] text-slate-500 tracking-widest uppercase">Shop • Sell • Deliver</span>
            </span>
          </Link>

          <button onClick={() => setLocOpen(!locOpen)} className="hidden lg:flex items-center gap-1 text-[12px] border rounded-xl px-2 py-2 hover:border-[var(--brand)] shrink-0">
            <span>📍</span><span className="text-left leading-tight"><span className="block text-slate-400 text-[10px]">Deliver to</span><span className="font-bold">{loc}</span></span>
          </button>

          <div ref={boxRef} className="order-3 lg:order-none w-full lg:w-auto lg:flex-1 min-w-0 relative">
            <form onSubmit={go} className="flex rounded-2xl overflow-hidden border-2 border-slate-900 dark:border-stone-700 focus-within:border-[var(--brand)]">
              <select value={cat} onChange={(e) => setCat(e.target.value)} className="hidden md:block text-[13px] px-3 bg-slate-50 dark:bg-stone-900 border-r max-w-[150px]" aria-label="Category">
                <option>All</option>{CATEGORIES.map((c) => <option key={c.slug}>{c.name}</option>)}
              </select>
              <input value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value.trim()) setSuggest([]); }} placeholder="Search phones, fashion, groceries…" className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 text-sm bg-transparent outline-none" aria-label="Search" />
              <button className="px-4 sm:px-5 text-white font-bold min-h-11" style={{ background: "var(--brand)" }} aria-label="Search">⌕</button>
            </form>
            {suggest.length > 0 && (
              <div className="absolute inset-x-0 top-full mt-1 bg-white dark:bg-stone-900 rounded-2xl card-shadow-lg border overflow-hidden z-50">
                {suggest.map((p) => (
                  <Link key={p.slug} href={`/products/${encodeURIComponent(p.slug)}`} onClick={() => setSuggest([])} className="flex items-center gap-3 px-3 py-2 hover:bg-orange-50 dark:hover:bg-stone-800">
                    <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="text-[13px] font-medium line-clamp-1">{p.name}</span>
                    <span className="ml-auto text-[13px] font-bold">₦{p.price.toLocaleString()}</span>
                  </Link>
                ))}
                <button onClick={go} className="w-full text-center text-[13px] font-bold py-2 bg-slate-50 dark:bg-stone-800">See all results for “{q}”</button>
              </div>
            )}
          </div>

          <div className="order-2 lg:order-none hidden md:flex items-center gap-1 text-[12px] ml-auto lg:ml-0">
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-transparent border rounded-lg px-1 py-1.5" aria-label="Language">
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-transparent border rounded-lg px-1 py-1.5" aria-label="Currency">
              {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => setDark(!dark)} className="border rounded-lg px-2 py-1.5" aria-label="Theme">{dark ? "☀️" : "🌙"}</button>
          </div>

          <div className="order-2 lg:order-none flex items-center gap-0 sm:gap-1 shrink-0 ml-auto lg:ml-0">
            <div className="relative group">
              <Link href={accountHref} className="flex flex-col items-center px-1.5 sm:px-2 py-1 text-[11px] font-semibold min-w-10">
                <span className="text-xl">👤</span><span className="hidden sm:block max-w-[70px] truncate">{user ? user.name.split(" ")[0] : "Account"}</span>
              </Link>
              <div className="absolute right-0 top-full hidden md:group-hover:block bg-white dark:bg-stone-900 rounded-2xl card-shadow-lg border p-2 w-48 z-50">
                {!user ? (<>
                  <Link href="/auth" className="block text-center text-sm font-bold text-white rounded-xl py-2" style={{ background: "var(--brand)" }}>Sign in / Join</Link>
                  <Link href="/account" className="block text-[13px] px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-stone-800 rounded-lg">My orders</Link>
                </>) : (<>
                  <p className="text-[13px] font-bold px-2 py-1">Hi, {user.name} ({user.role})</p>
                  <Link href="/account" className="block text-[13px] px-2 py-1.5 hover:bg-slate-50 rounded-lg">Dashboard</Link>
                  {user.role === "vendor" && <Link href="/vendor" className="block text-[13px] px-2 py-1.5 hover:bg-slate-50 rounded-lg">Vendor hub</Link>}
                  {user.role === "admin" && <Link href="/admin" className="block text-[13px] px-2 py-1.5 hover:bg-slate-50 rounded-lg">Admin panel</Link>}
                  <button onClick={logout} className="w-full text-left text-[13px] px-2 py-1.5 text-red-600">Logout</button>
                </>)}
                <Link href="/wishlist" className="block text-[13px] px-2 py-1.5 hover:bg-slate-50 rounded-lg">Wishlist</Link>
                <Link href="/track/SF10000001" className="block text-[13px] px-2 py-1.5 hover:bg-slate-50 rounded-lg">Track order</Link>
              </div>
            </div>
            <Link href="/wishlist" className="relative flex flex-col items-center px-1.5 sm:px-2 py-1 text-[11px] font-semibold min-w-10">
              <span className="text-xl">♡</span><span className="hidden sm:block">Saved</span>
              {wishlist.length > 0 && <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] grid place-items-center">{wishlist.length}</span>}
            </Link>
            <button onClick={() => setCartOpen(true)} className="relative flex flex-col items-center px-1.5 sm:px-2 py-1 text-[11px] font-semibold min-w-10" aria-label="Cart">
              <span className="text-xl">🛒</span><span className="hidden sm:block">Cart</span>
              {cartCount > 0 && <span className="absolute top-0 right-0 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] grid place-items-center" style={{ background: "var(--brand)" }}>{cartCount}</span>}
            </button>
          </div>
        </div>

        <nav className="max-w-7xl mx-auto px-3 sm:px-4 pb-2 flex items-center gap-1 text-[13px] overflow-x-auto no-scrollbar" aria-label="Product categories">
          <button onClick={() => setMega(!mega)} className="font-bold px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shrink-0">☰ All categories</button>
          {CATEGORIES.slice(0, 7).map((c) => (
            <Link key={c.slug} href={`/search?cat=${encodeURIComponent(c.name)}`} className="px-3 py-1.5 rounded-full hover:bg-orange-50 dark:hover:bg-stone-800 whitespace-nowrap font-medium">{c.name}</Link>
          ))}
          <Link href="/search?flash=1" className="px-3 py-1.5 rounded-full font-bold text-red-600 whitespace-nowrap">⚡ Flash deals</Link>
        </nav>

        {mega && (
          <div className="border-t bg-white dark:bg-stone-950">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              {CATEGORIES.map((c) => (
                <Link key={c.slug} href={`/search?cat=${encodeURIComponent(c.name)}`} onClick={() => setMega(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-orange-50 dark:hover:bg-stone-900 border border-transparent hover:border-orange-100">
                  <span className="text-2xl">{c.icon}</span>
                  <span><span className="block text-[13px] font-bold">{c.name}</span><span className="block text-[11px] text-slate-500">{c.count.toLocaleString()} items</span></span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {locOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setLocOpen(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold text-lg">Choose delivery location</h3>
            <p className="text-[13px] text-slate-500">We show stock and fees for your city.</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Enugu", "Accra", "Nairobi"].map((c) => (
                <button key={c} onClick={() => { setLoc(c); setLocOpen(false); }} className={`border rounded-xl py-2 text-sm font-bold ${loc === c ? "border-[var(--brand)] bg-orange-50" : ""}`}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mobileMenu && (
        <div className="md:hidden fixed inset-0 z-[55] bg-black/40" onClick={() => setMobileMenu(false)} role="presentation">
          <div id="mobile-more-menu" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title" className="absolute inset-x-0 bottom-0 bg-white dark:bg-stone-950 rounded-t-3xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] max-h-[80dvh] overflow-y-auto card-shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div><h2 id="mobile-more-title" className="font-extrabold">More options</h2><p className="text-[12px] text-slate-500">Account, delivery and display settings</p></div>
              <button type="button" onClick={() => setMobileMenu(false)} className="w-10 h-10 grid place-items-center rounded-full bg-slate-100 dark:bg-stone-800" aria-label="Close menu">✕</button>
            </div>
            <Link href={accountHref} onClick={() => setMobileMenu(false)} className="mt-4 w-full flex items-center justify-between rounded-2xl p-3 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900">
              <span>{user ? `👤 ${user.name}` : "👤 Sign in or create an account"}</span><span>→</span>
            </Link>
            <button type="button" onClick={() => { setMobileMenu(false); setLocOpen(true); }} className="mt-2 w-full flex items-center justify-between border rounded-2xl p-3 text-sm">
              <span>📍 Delivery location</span><b>{loc} →</b>
            </button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-[12px] font-bold">Language<select value={lang} onChange={(e) => setLang(e.target.value)} className="mt-1 w-full border rounded-xl px-2 py-2 bg-transparent" aria-label="Mobile language">{LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></label>
              <label className="text-[12px] font-bold">Currency<select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full border rounded-xl px-2 py-2 bg-transparent" aria-label="Mobile currency">{Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
            </div>
            <button type="button" onClick={() => setDark(!dark)} className="mt-2 w-full text-left border rounded-2xl p-3 text-sm font-bold">{dark ? "☀️ Use light mode" : "🌙 Use dark mode"}</button>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[13px] font-bold">
              <Link href="/wishlist" onClick={() => setMobileMenu(false)} className="border rounded-xl p-3">♡ Saved items</Link>
              <Link href="/track/SF10000001" onClick={() => setMobileMenu(false)} className="border rounded-xl p-3">📦 Track order</Link>
              <Link href="/vendor" onClick={() => setMobileMenu(false)} className="border rounded-xl p-3">🏪 Sell with us</Link>
              <Link href="/affiliate" onClick={() => setMobileMenu(false)} className="border rounded-xl p-3">🔗 Affiliate</Link>
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-stone-950/95 backdrop-blur border-t grid grid-cols-5 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] text-[10px] font-bold" aria-label="Mobile navigation">
        {[{ h: "/", i: "🏠", l: "Home" }, { h: "/search", i: "🔍", l: "Search" }, { h: "/cart", i: "🛒", l: "Cart" }, { h: accountHref, i: "👤", l: user ? "Account" : "Sign in" }].map((n) => (
          <Link key={n.l} href={n.h} className="flex flex-col items-center gap-0.5 min-w-0"><span className="text-xl">{n.i}</span>{n.l}</Link>
        ))}
        <button type="button" onClick={() => { setMega(false); setMobileMenu((open) => !open); }} aria-expanded={mobileMenu} aria-controls="mobile-more-menu" className="flex flex-col items-center justify-center gap-0.5 min-w-0 min-h-12 touch-manipulation"><span className="text-xl leading-none">•••</span>More</button>
      </nav>
    </>
  );
}
