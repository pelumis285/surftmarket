"use client";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProductCard, Empty } from "@/components/ui";
import { useCatalogProducts } from "@/lib/use-catalog";

function SearchInner() {
  const sp = useSearchParams();
  const q = (sp.get("q") ?? "").toLowerCase();
  const cat = sp.get("cat") ?? "";
  const flash = sp.get("flash");
  const { products, loading } = useCatalogProducts();
  const results = useMemo(() => products.filter((p) =>
    (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) &&
    (!cat || p.category === cat) && (!flash || (p.comparePrice && p.comparePrice > p.price))
  ), [products, q, cat, flash]);
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
      <h1 className="text-lg sm:text-xl font-extrabold break-words">Search results {q && <>for “{sp.get("q")}”</>} {cat && <span className="text-[var(--brand)]">in {cat}</span>}</h1>
      <p className="text-[13px] text-slate-500">{loading ? "Searching the marketplace…" : `${results.length} found • sorted by relevance`}</p>
      {!loading && results.length === 0 ? <div className="mt-4"><Empty icon="🔍" title="Nothing matched" body="Check spelling or try 'phone', 'rice', 'dress'." action={<Link href="/products" className="font-bold text-[var(--brand)]">Browse all →</Link>} /></div> :
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">{results.map((p) => <ProductCard key={p.slug} slug={p.slug} product={p} />)}</div>}
    </div>
  );
}
export default function SearchPage() {
  return <Suspense fallback={<p className="p-8">Searching…</p>}><SearchInner /></Suspense>;
}
