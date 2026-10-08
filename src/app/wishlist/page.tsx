"use client";
import { useStore } from "@/lib/store";
import { PRODUCTS } from "@/lib/demo-data";
import { ProductCard, Empty } from "@/components/ui";
import Link from "next/link";

export default function WishlistPage() {
  const { wishlist, recentlyViewed } = useStore();
  const items = PRODUCTS.filter((p) => wishlist.includes(p.slug));
  const viewed = PRODUCTS.filter((p) => recentlyViewed.includes(p.slug)).slice(0, 5);
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
      <h1 className="text-xl font-extrabold">Wishlist ({items.length})</h1>
      <p className="text-[13px] text-slate-500">Saved on this device • syncs when you create an account</p>
      {items.length === 0 ? (
        <div className="mt-4"><Empty icon="♡" title="Nothing saved yet" body="Tap the heart on any product to save it here." action={<Link href="/products" className="font-bold text-[var(--brand)]">Discover products →</Link>} /></div>
      ) : (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">{items.map((p) => <ProductCard key={p.slug} slug={p.slug} />)}</div>
      )}
      {viewed.length > 0 && (<>
        <h2 className="mt-8 font-extrabold">Recently viewed</h2>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">{viewed.map((p) => <ProductCard key={p.slug} slug={p.slug} compact />)}</div>
      </>)}
    </div>
  );
}
