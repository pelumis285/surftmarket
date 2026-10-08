"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { REVIEWS, QA, VENDORS } from "@/lib/demo-data";
import { Price, Stars, ProductCard, ShareButtons } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useCatalogProducts } from "@/lib/use-catalog";

export default function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const decoded = decodeURIComponent(slug);
  const sp = useSearchParams();
  const affRef = sp.get("ref") ?? sp.get("aff") ?? "";
  const { products: catalogProducts, loading } = useCatalogProducts();
  const p = catalogProducts.find((product) => product.slug === decoded);
  const { addToCart, toggleWish, wishlist, pushViewed, setCartOpen, followed, toggleFollow } = useStore();
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState("As pictured");
  const [size, setSize] = useState("M");
  const [zoom, setZoom] = useState(false);
  const [tab, setTab] = useState<"desc" | "reviews" | "qa">("reviews");
  const [affLink, setAffLink] = useState("");
  const wished = p ? wishlist.includes(p.slug) : false;

  useEffect(() => { if (p) pushViewed(p.slug); }, [p, pushViewed]);
  useEffect(() => {
    if (p && affRef && affRef !== "card") {
      fetch("/api/affiliate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "click", code: affRef, target: `/products/${p.slug}` }) }).catch(() => {});
    }
  }, [affRef, p]);

  const vendor = p ? VENDORS.find((item) => item.slug === p.vendorSlug) ?? {
    name: p.vendor,
    slug: p.vendorSlug,
    rating: p.rating,
    products: 1,
    followers: 0,
    location: p.location,
    verified: true,
    banner: "from-orange-500 to-rose-600",
    response: "Usually responds within an hour",
  } : null;
  const related = useMemo(() => p
    ? catalogProducts.filter((item) => item.category === p.category && item.slug !== p.slug)
      .concat(catalogProducts.filter((item) => item.category !== p.category && item.slug !== p.slug)).slice(0, 5)
    : [], [catalogProducts, p]);

  if (!p || !vendor) {
    return <div className="max-w-7xl mx-auto p-8 text-center text-sm text-slate-500">{loading ? "Loading product…" : "This product is not available."}</div>;
  }

  const genAff = () => {
    const code = "AFF-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    setAffLink(`${typeof window !== "undefined" ? window.location.origin : ""}/products/${encodeURIComponent(p.slug)}?aff=${code}`);
    fetch("/api/affiliate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "click", code, target: p.slug }) }).catch(() => {});
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
      <p className="text-[12px] text-slate-500 break-words"><Link href="/" className="hover:underline">Home</Link> / <Link href="/products" className="hover:underline">{p.category}</Link> / <span className="text-slate-800 dark:text-slate-200 font-semibold">{p.name.slice(0, 40)}…</span>
        {affRef && <span className="ml-2 bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">Referred by {affRef}</span>}</p>

      <div className="mt-3 grid md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px] gap-4">
        {/* Gallery */}
        <div>
          <div className="relative bg-white dark:bg-stone-900 rounded-3xl border overflow-hidden cursor-zoom-in" onClick={() => setZoom(!zoom)}>
            <img src={p.images[img]} alt={p.name} className={`w-full h-[300px] sm:h-[400px] md:h-[380px] lg:h-[440px] object-cover transition-transform ${zoom ? "scale-150" : ""}`} />
            <span className="absolute top-3 left-3 text-[11px] font-bold bg-red-600 text-white px-2 py-1 rounded-full">-{Math.round(((p.comparePrice ?? p.price) - p.price) / (p.comparePrice ?? p.price) * 100 || 15)}% OFF</span>
            <span className="absolute bottom-3 right-3 text-[11px] bg-black/60 text-white px-2 py-1 rounded-full">🔍 Click to {zoom ? "unzoom" : "zoom"}</span>
          </div>
          <div className="mt-2 flex gap-2">
            {p.images.map((im, i) => (
              <button key={i} onClick={() => setImg(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${img === i ? "border-[var(--brand)]" : "border-transparent"}`}><img src={im} alt="" className="w-full h-full object-cover" /></button>
            ))}
          </div>
          <div className="mt-3 flex gap-2 flex-wrap"><ShareButtons title={p.name} />
            <button onClick={genAff} className="text-[12px] font-bold px-3 py-1.5 rounded-full bg-violet-600 text-white">🔗 Get affiliate link (earn 5%)</button>
          </div>
          {affLink && <p className="mt-2 text-[12px] bg-violet-50 dark:bg-violet-950 border border-violet-200 rounded-xl p-2 break-all">Your link: <b>{affLink}</b> • QR & WhatsApp ready in <Link href="/affiliate" className="underline font-bold">affiliate hub</Link></p>}
        </div>

        {/* Info */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border p-5 h-fit">
          <p className="text-[11px] font-bold text-[var(--brand)] uppercase tracking-wider">{p.brand} • {p.category}</p>
          <h1 className="text-xl md:text-2xl font-extrabold leading-tight mt-1">{p.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-[13px]"><Stars value={p.rating} /><span className="font-bold">{p.rating}</span><a href="#reviews" className="text-slate-500 underline">{p.reviews.toLocaleString()} ratings</a><span className="text-slate-300">|</span><span className="text-slate-500">{p.sold.toLocaleString()} sold</span></div>
          <div className="mt-3 border-y py-3"><Price ngn={p.price} compare={p.comparePrice} big /></div>
          <div className="mt-3 space-y-2 text-[13px]">
            <div><span className="font-bold">Color: </span>{["As pictured", "Black", "Blue", "Gold"].map((c) => (<button key={c} onClick={() => setColor(c)} className={`mr-1 mb-1 px-3 py-1 rounded-full border text-[12px] font-bold ${color === c ? "bg-slate-900 text-white" : ""}`}>{c}</button>))}</div>
            <div><span className="font-bold">Size: </span>{["S", "M", "L", "XL", "XXL"].map((s) => (<button key={s} onClick={() => setSize(s)} className={`mr-1 mb-1 w-9 h-9 rounded-xl border text-[12px] font-bold ${size === s ? "bg-slate-900 text-white" : ""}`}>{s}</button>))}</div>
            <p>📦 <b className={p.stock < 30 ? "text-red-600" : "text-green-600"}>{p.stock > 0 ? `In stock (${p.stock} left)` : "Out of stock"}</b> {p.stock < 30 && "— hurry!"}</p>
            <p>🚚 Delivery: <b>2–4 days standard</b> (₦1,500) • <b>Same-day in Lagos</b> (₦5,000) • Free over ₦25k</p>
            <p>🛡️ <b>Escrow protected:</b> payment held until you confirm delivery with OTP.</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center border rounded-xl"><button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-10 font-bold">−</button><span className="w-8 text-center font-bold">{qty}</span><button onClick={() => setQty(qty + 1)} className="w-9 h-10 font-bold">+</button></span>
            <button onClick={() => { addToCart({ slug: p.slug, name: p.name, price: p.price, image: p.image, qty, variant: `${color}/${size}`, vendor: p.vendor, vendorSlug: p.vendorSlug }); setCartOpen(true); }} className="flex-1 font-extrabold rounded-xl py-3 text-white text-sm" style={{ background: "var(--brand)" }}>Add to cart</button>
            <button onClick={() => toggleWish(p.slug)} aria-label="wishlist" className={`w-12 h-12 rounded-xl border grid place-items-center text-xl ${wished ? "bg-red-50 text-red-600" : ""}`}>{wished ? "♥" : "♡"}</button>
          </div>
          <Link href="/checkout" onClick={() => addToCart({ slug: p.slug, name: p.name, price: p.price, image: p.image, qty, variant: `${color}/${size}`, vendor: p.vendor, vendorSlug: p.vendorSlug })} className="block text-center mt-2 font-extrabold rounded-xl py-3 text-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900">Buy now →</Link>
          <p className="mt-2 text-[12px] text-slate-500">SKU {p.brand.slice(0, 3).toUpperCase()}-{p.id.toUpperCase()} • 📍 Ships from {p.location} • 7-day returns</p>
        </div>

        {/* Vendor card */}
        <div className="space-y-3 md:col-span-2 xl:col-span-1 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:block xl:space-y-3">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border p-4">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-slate-900 text-white grid place-items-center font-black text-xl">{vendor.name[0]}</span>
              <div><Link href={`/stores/${vendor.slug}`} className="font-bold text-sm hover:underline flex items-center gap-1">{vendor.name} {vendor.verified && <span className="text-blue-500">✔</span>}</Link>
                <p className="text-[12px] text-slate-500">★ {vendor.rating} • {(vendor.followers / 1000).toFixed(1)}k followers</p></div>
            </div>
            <p className="text-[12px] text-slate-500 mt-2">⚡ {vendor.response} • 📍 {vendor.location}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => toggleFollow(vendor.slug)} className={`text-[13px] font-bold rounded-xl py-2 border ${followed.includes(vendor.slug) ? "bg-slate-900 text-white" : ""}`}>{followed.includes(vendor.slug) ? "✓ Following" : "+ Follow"}</button>
              <Link href={`/stores/${vendor.slug}`} className="text-center text-[13px] font-bold rounded-xl py-2 text-white" style={{ background: "var(--brand)" }}>Visit store</Link>
            </div>
            <button className="w-full mt-2 text-[13px] font-bold rounded-xl py-2 bg-slate-100 dark:bg-stone-800">💬 Chat with vendor</button>
          </div>
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-3xl p-4 text-[13px]">
            <p className="font-bold">✅ Buyer protection</p>
            <ul className="mt-1 space-y-1 text-green-900 dark:text-green-200"><li>• Full refund if not as described</li><li>• OTP confirmation on delivery</li><li>• Dispute center + support tickets</li></ul>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div id="reviews" className="mt-6 bg-white dark:bg-stone-900 rounded-3xl border p-4 sm:p-5">
        <div className="flex gap-2 border-b pb-2 overflow-x-auto no-scrollbar">
          {(["desc", "reviews", "qa"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`text-sm font-bold px-4 py-2 rounded-full ${tab === t ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : ""}`}>{t === "desc" ? "Description" : t === "reviews" ? `Reviews (${p.reviews.toLocaleString()})` : "Q&A"}</button>
          ))}
        </div>
        {tab === "desc" && <p className="mt-3 text-sm leading-relaxed">{p.description} Ships nationwide with tracking. Bulk discounts available — chat the vendor. SEO: Buy {p.name} online in Nigeria at best price with escrow.</p>}
        {tab === "reviews" && (
          <div className="mt-3 grid md:grid-cols-[220px_1fr] gap-4">
            <div className="text-center border rounded-2xl p-4 h-fit"><p className="text-4xl font-black">{p.rating}</p><Stars value={p.rating} /><p className="text-[12px] text-slate-500">{p.reviews.toLocaleString()} verified ratings</p>
              {[5, 4, 3, 2, 1].map((s) => (<div key={s} className="flex items-center gap-1 text-[11px] mt-1"><span className="w-3">{s}</span><span>★</span><span className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><span className="block h-full bg-amber-400" style={{ width: `${s === 5 ? 70 : s === 4 ? 18 : 7}%` }} /></span></div>))}
              <button className="mt-3 w-full text-[13px] font-bold border rounded-xl py-2">Write a review</button></div>
            <div className="space-y-3">
              {REVIEWS.map((r, i) => (
                <div key={i} className="border rounded-2xl p-3"><div className="flex items-center gap-2 flex-wrap"><span className="w-8 h-8 rounded-full bg-orange-100 grid place-items-center font-bold text-[13px]">{r.name[0]}</span><span className="font-bold text-[13px]">{r.name}</span><Stars value={r.rating} /><span className="sm:ml-auto text-[11px] text-slate-400">{r.date}</span></div>
                  <p className="text-[13px] font-bold mt-1">{r.title}</p><p className="text-[13px] text-slate-600 dark:text-slate-300">{r.body}</p>
                  <p className="text-[12px] text-slate-400 mt-1">Helpful ({r.helpful}) • Vendor replied ✔</p></div>
              ))}
            </div>
          </div>
        )}
        {tab === "qa" && <div className="mt-3 space-y-2">{QA.map((x, i) => <div key={i} className="border rounded-2xl p-3 text-sm"><p className="font-bold">Q: {x.q}</p><p className="mt-1 text-slate-600 dark:text-slate-300">A: {x.a}</p><p className="text-[11px] text-slate-400 mt-1">{x.by}</p></div>)}
          <div className="flex flex-col sm:flex-row gap-2"><input placeholder="Ask a question…" className="flex-1 border rounded-xl px-3 py-2 text-sm" /><button className="font-bold text-sm px-4 py-2 rounded-xl text-white" style={{ background: "var(--brand)" }}>Ask</button></div></div>}
      </div>

      <h2 className="mt-6 font-extrabold text-lg">Related products</h2>
      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">{related.map((r) => <ProductCard key={r.slug} slug={r.slug} product={r} />)}</div>
    </div>
  );
}
