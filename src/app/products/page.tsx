"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/demo-data";
import { ProductCard, ProductGridSkeleton, Empty, SectionHead } from "@/components/ui";
import { useCatalogProducts } from "@/lib/use-catalog";

function ListingInner() {
  const sp = useSearchParams();
  const initialQ = sp.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState(sp.get("cat") || "All");
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [inStock, setInStock] = useState(false);
  const [brand, setBrand] = useState("All");
  const [page, setPage] = useState(1);
  const { products, loading } = useCatalogProducts();

  const brands = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.brand)))], [products]);
  const filtered = useMemo(() => {
    let r = products.filter((p) =>
      (!q || p.name.toLowerCase().includes(q.toLowerCase())) &&
      (cat === "All" || p.category === cat) &&
      p.price <= maxPrice && p.rating >= minRating &&
      (!inStock || p.stock > 0) && (brand === "All" || p.brand === brand)
    );
    if (sort === "price-asc") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") r = [...r].sort((a, b) => b.price - a.price);
    if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === "sold") r = [...r].sort((a, b) => b.sold - a.sold);
    return r;
  }, [products, q, cat, maxPrice, minRating, sort, inStock, brand]);

  const perPage = 8;
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const slice = filtered.slice(0, page * perPage);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 grid lg:grid-cols-[240px_1fr] gap-4">
      <aside className="hidden lg:block bg-white dark:bg-stone-900 rounded-2xl border p-4 h-fit sticky top-32 space-y-4">
        <div><p className="font-bold text-sm mb-1">Category</p>
          {["All", ...CATEGORIES.map((c) => c.name)].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`block w-full text-left text-[13px] px-2 py-1 rounded-lg ${cat === c ? "bg-orange-100 dark:bg-orange-900/30 font-bold" : "hover:bg-slate-50 dark:hover:bg-stone-800"}`}>{c}</button>
          ))}
        </div>
        <div><p className="font-bold text-sm">Max price: ₦{maxPrice.toLocaleString()}</p>
          <input type="range" min={5000} max={1000000} step={5000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full" aria-label="Max price" />
        </div>
        <div><p className="font-bold text-sm mb-1">Rating</p>
          {[0, 4, 4.5, 4.7].map((r) => <button key={r} onClick={() => setMinRating(r)} className={`mr-1 mb-1 text-[12px] border rounded-full px-2 py-0.5 ${minRating === r ? "bg-slate-900 text-white" : ""}`}>{r === 0 ? "Any" : `${r}+ ★`}</button>)}
        </div>
        <div><p className="font-bold text-sm mb-1">Brand</p>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full border rounded-xl px-2 py-1.5 text-sm">{brands.map((b) => <option key={b}>{b}</option>)}</select>
        </div>
        <label className="flex items-center gap-2 text-[13px] font-semibold"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> In stock only</label>
      </aside>

      <div>
        <details className="lg:hidden mb-3 bg-white dark:bg-stone-900 rounded-2xl border p-3">
          <summary className="cursor-pointer font-bold text-sm">Filters: category, price, rating & brand</summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[12px] font-bold">Category<select value={cat} onChange={(e) => setCat(e.target.value)} className="mt-1 w-full border rounded-xl px-2 py-2 bg-transparent"><option>All</option>{CATEGORIES.map((c) => <option key={c.slug}>{c.name}</option>)}</select></label>
            <label className="text-[12px] font-bold">Brand<select value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 w-full border rounded-xl px-2 py-2 bg-transparent">{brands.map((b) => <option key={b}>{b}</option>)}</select></label>
            <label className="text-[12px] font-bold">Max price<select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="mt-1 w-full border rounded-xl px-2 py-2 bg-transparent"><option value={50000}>₦50,000</option><option value={100000}>₦100,000</option><option value={250000}>₦250,000</option><option value={1000000}>Any price</option></select></label>
            <label className="text-[12px] font-bold">Minimum rating<select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="mt-1 w-full border rounded-xl px-2 py-2 bg-transparent"><option value={0}>Any rating</option><option value={4}>4+ stars</option><option value={4.5}>4.5+ stars</option></select></label>
            <label className="col-span-2 flex items-center gap-2 text-[13px] font-semibold"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="w-5 h-5" /> In stock only</label>
          </div>
        </details>
        <div className="flex gap-2 items-center flex-wrap">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter in results…" className="flex-1 min-w-[160px] border rounded-xl px-3 py-2 text-sm bg-white dark:bg-stone-900" aria-label="Filter" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded-xl px-2 py-2 text-sm bg-white dark:bg-stone-900" aria-label="Sort">
            <option value="popular">Most popular</option><option value="sold">Best selling</option>
            <option value="rating">Top rated</option><option value="price-asc">Price: low → high</option><option value="price-desc">Price: high → low</option>
          </select>
          <button onClick={() => setView(view === "grid" ? "list" : "grid")} className="border rounded-xl px-3 py-2 text-sm bg-white dark:bg-stone-900" aria-label="Toggle view">{view === "grid" ? "☰ List" : "▦ Grid"}</button>
        </div>
        <p className="text-[13px] text-slate-500 my-2">{filtered.length} products {q && <>for “<b>{q}</b>”</>}</p>
        {loading ? <ProductGridSkeleton /> : slice.length === 0 ? (
          <Empty icon="🔍" title="No products found" body="Try a different keyword, category or price range." action={<Link href="/products" className="font-bold text-[var(--brand)]">Clear filters</Link>} />
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {slice.map((p) => <ProductCard key={p.slug} slug={p.slug} product={p} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {slice.map((p) => (
              <Link key={p.slug} href={`/products/${encodeURIComponent(p.slug)}`} className="flex gap-3 bg-white dark:bg-stone-900 rounded-2xl border p-3">
                <img src={p.image} alt="" className="w-24 h-24 rounded-xl object-cover" />
                <span className="flex-1"><span className="block font-bold text-sm line-clamp-2">{p.name}</span>
                  <span className="block text-[12px] text-slate-500">★ {p.rating} ({p.reviews}) • {p.vendor}</span>
                  <span className="block font-extrabold mt-1">₦{p.price.toLocaleString()}</span></span>
              </Link>
            ))}
          </div>
        )}
        {page < pages && <button onClick={() => setPage(page + 1)} className="w-full mt-4 border rounded-2xl py-3 font-bold text-sm bg-white dark:bg-stone-900">Load more ({filtered.length - slice.length} left)</button>}
        <div className="mt-3 flex gap-1 justify-center">{Array.from({ length: pages }).slice(0, 5).map((_, i) => (
          <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-full text-sm font-bold ${page === i + 1 ? "bg-slate-900 text-white" : "border"}`}>{i + 1}</button>
        ))}</div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (<Suspense fallback={<div className="max-w-7xl mx-auto p-4"><ProductGridSkeleton /></div>}>
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4"><SectionHead title="All products" sub="Filter by price, rating, brand & vendor" /></div>
    <ListingInner />
  </Suspense>);
}
