import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

export const metadata: Metadata = {
  title: "Surftmarket — Shop, Sell, Deliver | Global Marketplace",
  description: "Surftmarket: multi-vendor marketplace with escrow payments, fast dispatch, affiliate earnings. Phones, fashion, groceries & more.",
  manifest: "/manifest.webmanifest",
  openGraph: { title: "Surftmarket", description: "Shop everything with escrow protection.", type: "website" },
};

export const viewport: Viewport = { themeColor: "#ea580c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-[#faf7f2] dark:bg-stone-950 text-slate-900 dark:text-stone-100 antialiased">
        <StoreProvider>
          <Header />
          <CartDrawer />
          <main className="min-h-[60vh] pb-mobile-nav">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
