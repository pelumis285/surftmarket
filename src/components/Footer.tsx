"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-10 bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 grid grid-cols-2 md:grid-cols-5 gap-6 text-[13px]">
        <div className="col-span-2 md:col-span-2">
          <p className="font-black text-white text-xl">surft<span className="text-orange-500">market</span></p>
          <p className="mt-2 text-slate-400 max-w-xs">Africa&apos;s trusted marketplace with escrow protection, fast dispatch and affiliate earnings. Shop, sell, deliver.</p>
          <div className="mt-3 flex gap-2 flex-wrap">
            {["Visa", "Mastercard", "Paystack", "Flutterwave", "Stripe"].map((p) => (
              <span key={p} className="text-[11px] font-bold bg-white/10 rounded-lg px-2 py-1">{p}</span>
            ))}
          </div>
          <form className="mt-4 flex flex-col sm:flex-row rounded-xl overflow-hidden max-w-sm gap-2 sm:gap-0" onSubmit={(e) => e.preventDefault()}>
            <input placeholder="Email for deals & vouchers" className="flex-1 min-w-0 rounded-xl sm:rounded-none px-3 py-2.5 text-sm text-slate-900" aria-label="Newsletter email" />
            <button className="bg-orange-600 rounded-xl sm:rounded-none px-4 py-2.5 font-bold text-white text-sm">Subscribe</button>
          </form>
        </div>
        <div>
          <p className="font-bold text-white mb-2">Shop</p>
          {["Flash deals", "Phones", "Fashion", "Groceries", "Track order", "Wishlist"].map((l) => <Link key={l} href="/search" className="block py-1 hover:text-white">{l}</Link>)}
        </div>
        <div>
          <p className="font-bold text-white mb-2">Sell & Earn</p>
          <Link href="/vendor" className="block py-1 hover:text-white">Become a vendor</Link>
          <Link href="/affiliate" className="block py-1 hover:text-white">Affiliate program</Link>
          <Link href="/rider" className="block py-1 hover:text-white">Become a rider</Link>
          <Link href="/admin" className="block py-1 hover:text-white">Admin demo</Link>
          <Link href="/docs#selling" className="block py-1 hover:text-white">Seller guide</Link>
        </div>
        <div>
          <p className="font-bold text-white mb-2">Support</p>
          <Link href="/docs" className="block py-1 hover:text-white">Help center</Link>
          <Link href="/track/SF10000001" className="block py-1 hover:text-white">Track order</Link>
          <Link href="/docs#returns" className="block py-1 hover:text-white">Returns & disputes</Link>
          <Link href="/docs#payments" className="block py-1 hover:text-white">Payments & escrow</Link>
          <Link href="/docs#contact-support" className="block py-1 hover:text-white">Contact support</Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-2 items-start md:items-center justify-between text-[12px] text-slate-400">
          <p>© 2026 Surftmarket • Made for global commerce • Default NGN / English • Configurable white-label</p>
          <p>PWA-ready • Offline cart • Escrow • Multi-currency</p>
        </div>
      </div>
    </footer>
  );
}
