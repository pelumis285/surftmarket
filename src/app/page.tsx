"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORIES, VENDORS } from "@/lib/demo-data";
import { ProductCard, Countdown, SectionHead, TrustBadges } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useCatalogProducts } from "@/lib/use-catalog";

const HEROES = [
  { tag: "MEGA SALES • UP TO 60% OFF", title: "Everything you love, delivered fast.", sub: "Phones, fashion, groceries & more — protected by escrow until you confirm delivery.", cta: "Shop flash deals", link: "/search?flash=1", bg: "from-orange-600 via-red-600 to-rose-700" },
  { tag: "NEW • SAME-DAY IN LAGOS", title: "Order by 2pm, receive by 9pm.", sub: "Live rider tracking, OTP-secured handover, pay on delivery.", cta: "Try same-day", link: "/search?speed=same-day", bg: "from-teal-600 via-cyan-700 to-slate-900" },
  { tag: "AFFILIATES EARN 5–12%", title: "Share links. Earn on every delivery.", sub: "Generate a link for any product, share on WhatsApp, get paid after delivery.", cta: "Become an affiliate", link: "/affiliate", bg: "from-violet-600 via-indigo-700 to-slate-900" },
];

const FLASH_DURATION_MS = 7 * 60 * 60 * 1000 + 24 * 60 * 1000;

export default function HomePage() {
  const [hero, setHero] = useState(0);
  const { recentlyViewed } = useStore();
  const { products } = useCatalogProducts();
  useEffect(() => {
    const t = setInterval(() => setHero((h) => (h + 1) % HEROES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const h = HEROES[hero];
  const flash = products.filter((p) => p.comparePrice && (p.flash || (p.comparePrice - p.price) / p.comparePrice > 0.2)).slice(0, 10);
  const trending = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);
  const fresh = products.filter((p) => p.isNew || p.featured).slice(0, 5);
  const viewed = products.filter((p) => recentlyViewed.includes(p.slug)).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-6 sm:space-y-8 pt-3 sm:pt-4">
      {/* HERO */}
      <section className={`rounded-2xl sm:rounded-3xl bg-gradient-to-br ${h.bg} text-white p-5 sm:p-6 md:p-10 relative overflow-hidden`}>
        <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute right-20 bottom-0 w-40 h-40 rounded-full bg-black/10" />
        <span className="text-[11px] font-bold bg-white/20 rounded-full px-3 py-1">{h.tag}</span>
        <h1 className="mt-3 text-2xl sm:text-3xl md:text-5xl font-black leading-[1.05] max-w-xl">{h.title}</h1>
        <p className="mt-2 text-white/80 max-w-md text-sm md:text-base">{h.sub}</p>
        <div className="mt-5 flex gap-2 flex-wrap">
          <Link href={h.link} className="bg-white text-slate-900 font-extrabold rounded-2xl px-6 py-3 text-sm">{h.cta} →</Link>
          <Link href="/vendor" className="border border-white/40 rounded-2xl px-6 py-3 text-sm font-bold">Start selling</Link>
        </div>
        <div className="mt-6 flex gap-2">
          {HEROES.map((_, i) => (
            <button key={i} onClick={() => setHero(i)} aria-label={`slide ${i + 1}`} className={`h-2 rounded-full transition-all ${i === hero ? "w-8 bg-white" : "w-2 bg-white/40"}`} />
          ))}
        </div>
      </section>

      {/* CATEGORY TILES */}
      <section>
        <SectionHead title="Shop by category" sub="10 departments, 60,000+ products" link="/search" />
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/search?cat=${encodeURIComponent(c.name)}`} className="min-w-0 bg-white dark:bg-stone-900 rounded-xl sm:rounded-2xl border p-1.5 sm:p-2 text-center hover:border-[var(--brand)] hover:-translate-y-0.5 transition">
              <span className="text-2xl md:text-3xl">{c.icon}</span>
              <span className="block text-[10px] md:text-[11px] font-bold mt-1 leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FLASH DEALS */}
      <section className="bg-slate-950 text-white rounded-3xl p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 className="text-lg md:text-xl font-black">⚡ Flash deals <span className="text-orange-400">ends in</span></h2>
          <Countdown durationMs={FLASH_DURATION_MS} />
          <Link href="/search?flash=1" className="text-[13px] font-bold text-orange-300">See all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {flash.slice(0, 5).map((p) => <ProductCard key={p.slug} slug={p.slug} product={p} />)}
        </div>
      </section>

      <TrustBadges />

      {/* TRENDING + NEW */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionHead title="🔥 Trending now" sub="Most sold this week in Nigeria" link="/search?sort=sold" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
            {trending.map((p) => <ProductCard key={p.slug} slug={p.slug} product={p} compact />)}
          </div>
        </div>
        <div>
          <SectionHead title="✨ New arrivals" sub="Fresh from verified vendors" link="/search?sort=new" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
            {fresh.map((p) => <ProductCard key={p.slug} slug={p.slug} product={p} compact />)}
          </div>
        </div>
      </section>

      {/* TOP STORES */}
      <section>
        <SectionHead title="Top stores" sub="Follow for exclusive vouchers" link="/search" linkLabel="All stores →" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {VENDORS.map((v) => (
            <Link key={v.slug} href={`/stores/${v.slug}`} className="bg-white dark:bg-stone-900 rounded-2xl border overflow-hidden hover:-translate-y-1 transition">
              <div className={`h-16 bg-gradient-to-br ${v.banner}`} />
              <div className="p-3 -mt-6">
                <span className="w-10 h-10 rounded-xl bg-slate-900 text-white grid place-items-center font-black">{v.name[0]}</span>
                <p className="text-[13px] font-bold mt-1 flex items-center gap-1">{v.name} {v.verified && <span className="text-blue-500">✔</span>}</p>
                <p className="text-[11px] text-slate-500">★ {v.rating} • {(v.followers / 1000).toFixed(1)}k followers</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PROMO BANNERS */}
      <section className="grid md:grid-cols-3 gap-3">
        <Link href="/vendor" className="rounded-3xl p-6 bg-gradient-to-br from-emerald-600 to-teal-800 text-white">
          <p className="text-[11px] font-bold bg-white/20 inline-block px-2 py-0.5 rounded-full">VENDORS</p>
          <p className="mt-2 font-black text-xl leading-tight">Sell to 2M+ shoppers. 0 listing fees.</p>
          <p className="text-[13px] text-white/80 mt-1">Escrow payouts in 24hrs after delivery.</p>
          <span className="inline-block mt-3 bg-white text-slate-900 text-[13px] font-bold px-4 py-2 rounded-xl">Open your store →</span>
        </Link>
        <Link href="/affiliate" className="rounded-3xl p-6 bg-gradient-to-br from-fuchsia-600 to-indigo-800 text-white">
          <p className="text-[11px] font-bold bg-white/20 inline-block px-2 py-0.5 rounded-full">AFFILIATES</p>
          <p className="mt-2 font-black text-xl leading-tight">Earn up to 12% per delivery.</p>
          <p className="text-[13px] text-white/80 mt-1">30-day cookie • instant QR & WhatsApp share.</p>
          <span className="inline-block mt-3 bg-white text-slate-900 text-[13px] font-bold px-4 py-2 rounded-xl">Get your link →</span>
        </Link>
        <Link href="/rider" className="rounded-3xl p-6 bg-gradient-to-br from-slate-800 to-black text-white">
          <p className="text-[11px] font-bold bg-white/20 inline-block px-2 py-0.5 rounded-full">RIDERS</p>
          <p className="mt-2 font-black text-xl leading-tight">Deliver & earn ₦120k+/week.</p>
          <p className="text-[13px] text-white/80 mt-1">Go online anytime. Instant payouts.</p>
          <span className="inline-block mt-3 bg-orange-500 text-white text-[13px] font-bold px-4 py-2 rounded-xl">Ride with Surft →</span>
        </Link>
      </section>

      {/* RECOMMENDED */}
      <section>
        <SectionHead title="Recommended for you" sub="Based on trending in your city" link="/search" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          {products.slice(0, 10).map((p) => <ProductCard key={p.slug} slug={p.slug} product={p} />)}
        </div>
      </section>

      {viewed.length > 0 && (
        <section>
          <SectionHead title="Recently viewed" link="/wishlist" linkLabel="Wishlist →" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
            {viewed.map((p) => <ProductCard key={p.slug} slug={p.slug} product={p} compact />)}
          </div>
        </section>
      )}
    </div>
  );
}
