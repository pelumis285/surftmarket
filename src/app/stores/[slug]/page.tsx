"use client";
import { use } from "react";
import Link from "next/link";
import { VENDORS } from "@/lib/demo-data";
import { ProductCard, Stars } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useCatalogProducts } from "@/lib/use-catalog";

export default function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const v = VENDORS.find((x) => x.slug === slug) ?? VENDORS[0];
  const { followed, toggleFollow } = useStore();
  const { products } = useCatalogProducts();
  const items = products.filter((product) => product.vendorSlug === v.slug);
  const isFollowing = followed.includes(v.slug);
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
      <div className={`rounded-3xl bg-gradient-to-br ${v.banner} text-white p-5 sm:p-6 md:p-8 relative overflow-hidden`}>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="w-16 h-16 rounded-2xl bg-white text-slate-900 grid place-items-center font-black text-3xl">{v.name[0]}</span>
          <div className="flex-1 min-w-0 sm:min-w-[200px]">
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2 flex-wrap">{v.name} {v.verified && <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">✔ Verified</span>}</h1>
            <p className="text-white/80 text-[13px]">★ {v.rating} • {v.products} products • {(v.followers / 1000).toFixed(1)}k followers • 📍 {v.location}</p>
          </div>
          <div className="w-full sm:w-auto flex gap-2 flex-wrap">
            <button onClick={() => toggleFollow(v.slug)} className={`flex-1 sm:flex-none font-bold text-sm px-5 py-2.5 rounded-xl ${isFollowing ? "bg-white text-slate-900" : "bg-black/30 border border-white/40"}`}>{isFollowing ? "✓ Following" : "+ Follow store"}</button>
            <button className="bg-white text-slate-900 font-bold text-sm px-5 py-2.5 rounded-xl">💬 Chat</button>
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-[12px] text-white/80 flex-wrap">
          <span>🕘 Mon–Sat 8am–8pm</span><span>🚚 Ships nationwide</span><span>↩️ 7-day returns</span><span>⚡ {v.response} response</span>
        </div>
      </div>
      <div className="mt-4 flex gap-2 text-sm font-bold border-b overflow-x-auto no-scrollbar">
        {["All products", "Top selling", "New", "Reviews"].map((t, i) => (
          <span key={t} className={`px-4 py-2 whitespace-nowrap ${i === 0 ? "border-b-2 border-[var(--brand)] text-[var(--brand)]" : "text-slate-500"}`}>{t}</span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
        {items.map((p) => <ProductCard key={p.slug} slug={p.slug} product={p} />)}
      </div>
      <div className="mt-6 bg-white dark:bg-stone-900 rounded-3xl border p-5">
        <h2 className="font-extrabold">Store reviews</h2>
        <div className="mt-2 flex items-center gap-2"><Stars value={v.rating} /><span className="font-bold">{v.rating}</span><span className="text-[13px] text-slate-500">Excellent service, fast dispatch across Nigeria.</span></div>
        <Link href="/products" className="inline-block mt-3 text-sm font-bold text-[var(--brand)]">Browse all products →</Link>
      </div>
    </div>
  );
}
