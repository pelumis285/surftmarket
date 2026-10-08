"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/lib/store";
import { PRODUCTS, type DemoProduct } from "@/lib/demo-data";

export function Price({ ngn, compare, currency, big }: { ngn: number; compare?: number; currency?: string; big?: boolean }) {
  const { currency: cur } = useStore();
  const c = currency ?? cur;
  return (
    <span className="flex items-baseline gap-2 flex-wrap">
      <span className={`${big ? "text-2xl sm:text-3xl" : "text-base sm:text-lg"} font-extrabold text-slate-900 dark:text-white break-words`}>{formatMoney(ngn, c)}</span>
      {compare && compare > ngn && (
        <span className="text-xs sm:text-sm text-slate-400 line-through">{formatMoney(compare, c)}</span>
      )}
      {compare && compare > ngn && (
        <span className="hidden sm:inline-flex text-xs font-bold text-white bg-[var(--brand)] rounded-full px-2 py-0.5">-{Math.round(((compare - ngn) / compare) * 100)}%</span>
      )}
    </span>
  );
}

export function Stars({ value, size = "text-sm" }: { value: number; size?: string }) {
  return (
    <span className={`${size} tracking-tight`} aria-label={`${value} stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? "text-amber-400" : "text-slate-300"}>★</span>
      ))}
    </span>
  );
}

export function ProductCard({ slug, product, compact }: { slug: string; product?: DemoProduct; compact?: boolean }) {
  const p = product ?? PRODUCTS.find((x) => x.slug === slug);
  const { addToCart, toggleWish, wishlist, currency, setCartOpen } = useStore();
  if (!p) return null;
  const wished = wishlist.includes(p.slug);
  return (
    <div className="group min-w-0 bg-white dark:bg-stone-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-stone-800 overflow-hidden card-shadow hover:-translate-y-1 transition-all">
      <Link href={`/products/${encodeURIComponent(p.slug)}?ref=card`} className="block relative">
        <img src={p.image} alt={p.name} loading="lazy" className="h-36 sm:h-44 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {p.comparePrice && <span className="absolute top-2 left-2 text-[11px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">-{Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)}%</span>}
        {p.flash && <span className="absolute bottom-2 left-2 text-[11px] font-bold bg-black/70 text-amber-300 px-2 py-0.5 rounded-full">⚡ Flash</span>}
      </Link>
      <div className="p-2.5 sm:p-3">
        <Link href={`/products/${encodeURIComponent(p.slug)}`} className="line-clamp-2 text-[12px] sm:text-[13px] font-medium leading-snug min-h-[36px] hover:text-[var(--brand)]">{p.name}</Link>
        <div className="mt-1 flex items-center gap-1"><Stars value={p.rating} /><span className="text-[11px] text-slate-500">({p.reviews.toLocaleString()})</span></div>
        <div className="mt-1"><Price ngn={p.price} compare={p.comparePrice} /></div>
        {!compact && <p className="text-[11px] text-slate-500 mt-0.5">📍 {p.location} • {p.sold.toLocaleString()} sold</p>}
        <div className="mt-2 flex gap-2">
          <button onClick={() => { addToCart({ slug: p.slug, name: p.name, price: p.price, image: p.image, qty: 1, vendor: p.vendor, vendorSlug: p.vendorSlug }); setCartOpen(true); }}
            className="flex-1 min-w-0 text-[12px] sm:text-[13px] font-bold bg-[var(--brand)] hover:brightness-110 text-white rounded-xl px-1 py-2 min-h-10 transition">Add to cart</button>
          <button onClick={() => toggleWish(p.slug)} aria-label="wishlist"
            className={`w-10 min-h-10 grid place-items-center rounded-xl border ${wished ? "bg-red-50 border-red-200 text-red-600" : "border-slate-200 dark:border-stone-700"}`}>{wished ? "♥" : "♡"}</button>
        </div>
      </div>
    </div>
  );
}

export function Countdown({ durationMs }: { durationMs: number }) {
  const [diff, setDiff] = useState(durationMs);
  useEffect(() => {
    const t = setInterval(() => setDiff((value) => Math.max(0, value - 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  return (
    <span className="inline-flex items-center gap-1 text-sm font-bold">
      {[h, m, s].map((v, i) => (
        <React.Fragment key={i}>
          <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg px-2 py-1 tabular-nums">{v}</span>
          {i < 2 && <span>:</span>}
        </React.Fragment>
      ))}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">{Array.from({ length: n }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>;
}

export function Empty({ icon = "📦", title, body, action }: { icon?: string; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-14 px-6 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-slate-200 dark:border-stone-700">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-3 font-bold text-lg">{title}</h3>
      {body && <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionHead({ title, sub, link, linkLabel }: { title: string; sub?: string; link?: string; linkLabel?: string }) {
  return (
    <div className="flex items-start sm:items-end justify-between gap-3 mb-3">
      <div className="min-w-0">
        <h2 className="text-lg md:text-xl font-extrabold tracking-tight">{title}</h2>
        {sub && <p className="text-[13px] text-slate-500">{sub}</p>}
      </div>
      {link && <Link href={link} className="text-[13px] font-bold text-[var(--brand)] hover:underline shrink-0">{linkLabel ?? "See all →"}</Link>}
    </div>
  );
}

export function TrustBadges() {
  const items = [
    { i: "🔒", t: "Secure payment", s: "Paystack • Flutterwave • Stripe" },
    { i: "🛡️", t: "Escrow protection", s: "Money released after delivery" },
    { i: "🚚", t: "Fast delivery", s: "Same-day in Lagos & Abuja" },
    { i: "↩️", t: "Easy returns", s: "7-day free returns" },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {items.map((x) => (
        <div key={x.t} className="flex gap-3 items-center bg-white dark:bg-stone-900 rounded-2xl p-3 border border-slate-100 dark:border-stone-800">
          <span className="text-2xl">{x.i}</span>
          <span><span className="block text-[13px] font-bold">{x.t}</span><span className="block text-[11px] text-slate-500">{x.s}</span></span>
        </div>
      ))}
    </div>
  );
}

export function ShareButtons({ title }: { title: string }) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const encoded = encodeURIComponent(`${title} ${url}`);
  return (
    <div className="flex gap-2">
      {[
        { l: "WhatsApp", h: `https://wa.me/?text=${encoded}`, c: "bg-green-500" },
        { l: "X", h: `https://twitter.com/intent/tweet?text=${encoded}`, c: "bg-black" },
        { l: "Facebook", h: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, c: "bg-blue-600" },
      ].map((b) => (
        <a key={b.l} href={b.h} target="_blank" rel="noreferrer" className={`${b.c} text-white text-[12px] font-bold px-3 py-1.5 rounded-full`}>{b.l}</a>
      ))}
    </div>
  );
}
