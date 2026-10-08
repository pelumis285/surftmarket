"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CURRENCIES } from "./format";
import { calculateCoupon, type CouponRule } from "./coupons";

export type CartItem = { slug: string; name: string; price: number; image: string; qty: number; variant?: string; vendor: string; vendorSlug?: string };
type User = { id?: string; name: string; email?: string | null; phone?: string | null; role: string; verified?: boolean } | null;
export type CouponApplyResult = { ok: boolean; error?: string; message?: string };

type Store = {
  cart: CartItem[]; addToCart: (i: CartItem) => void; removeFromCart: (slug: string, variant?: string) => void;
  setQty: (slug: string, qty: number, variant?: string) => void; clearCart: () => void; cartCount: number; cartTotal: number;
  wishlist: string[]; toggleWish: (slug: string) => void;
  currency: string; setCurrency: (c: string) => void;
  lang: string; setLang: (l: string) => void;
  user: User; login: (u: NonNullable<User>) => void; logout: () => void;
  dark: boolean; setDark: (d: boolean) => void;
  recentlyViewed: string[]; pushViewed: (slug: string) => void;
  followed: string[]; toggleFollow: (slug: string) => void;
  coupon: CouponRule | null; couponDiscount: number; applyCoupon: (code: string) => Promise<CouponApplyResult>; removeCoupon: () => void;
  cartOpen: boolean; setCartOpen: (b: boolean) => void;
};

const Ctx = createContext<Store | null>(null);
const read = (k: string, fb: any) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [currency, setCurrency] = useState("NGN");
  const [lang, setLang] = useState("en");
  const [user, setUser] = useState<User>(null);
  const [dark, setDarkState] = useState(false);
  const [recentlyViewed, setViewed] = useState<string[]>([]);
  const [followed, setFollowed] = useState<string[]>([]);
  const [coupon, setCoupon] = useState<CouponRule | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrate = window.setTimeout(async () => {
      setCart(read("sf_cart", [])); setWishlist(read("sf_wish", []));
      setCurrency(localStorage.getItem("sf_cur") || "NGN");
      setLang(localStorage.getItem("sf_lang") || "en");
      setUser(read("sf_user", null)); setViewed(read("sf_viewed", []));
      setFollowed(read("sf_follow", []));
      const savedCoupon = read("sf_coupon", null);
      setCoupon(savedCoupon && typeof savedCoupon === "object" && typeof savedCoupon.code === "string" ? savedCoupon : null);
      const d = localStorage.getItem("sf_dark") === "1";
      setDarkState(d); if (d) document.documentElement.classList.add("dark");
      setHydrated(true);
      try {
        const response = await fetch("/api/auth", { cache: "no-store" });
        const data = await response.json();
        setUser(response.ok ? data.user : null);
      } catch {
        setUser(null);
      }
    }, 0);
    return () => window.clearTimeout(hydrate);
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem("sf_cart", JSON.stringify(cart)); }, [cart, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("sf_wish", JSON.stringify(wishlist)); }, [wishlist, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("sf_user", JSON.stringify(user)); }, [user, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("sf_viewed", JSON.stringify(recentlyViewed)); }, [recentlyViewed, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("sf_follow", JSON.stringify(followed)); }, [followed, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("sf_coupon", JSON.stringify(coupon)); }, [coupon, hydrated]);

  const setDark = (d: boolean) => {
    setDarkState(d); localStorage.setItem("sf_dark", d ? "1" : "0");
    document.documentElement.classList.toggle("dark", d);
  };
  const pushViewed = useCallback((slug: string) => {
    setViewed((viewed) => [slug, ...viewed.filter((item) => item !== slug)].slice(0, 12));
  }, []);

  const applyCoupon = useCallback(async (code: string): Promise<CouponApplyResult> => {
    if (!cart.length) return { ok: false, error: "Add an item to your cart before applying a coupon." };
    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", code, items: cart }),
      });
      const data = await response.json() as { ok?: boolean; error?: string; coupon?: CouponRule; discount?: number };
      if (!response.ok || !data.ok || !data.coupon) return { ok: false, error: data.error ?? "Coupon could not be applied." };
      setCoupon(data.coupon);
      return { ok: true, message: `${data.coupon.code} applied — you save ₦${Number(data.discount ?? 0).toLocaleString()}.` };
    } catch {
      return { ok: false, error: "Coupon validation is temporarily unavailable." };
    }
  }, [cart]);

  const couponDiscount = useMemo(() => calculateCoupon(coupon, cart).discount, [cart, coupon]);

  const value: Store = useMemo(() => ({
    cart,
    addToCart: (i) => setCart((c) => {
      const k = c.find((x) => x.slug === i.slug && x.variant === i.variant);
      if (k) return c.map((x) => x.slug === i.slug && x.variant === i.variant ? { ...x, qty: x.qty + i.qty } : x);
      return [...c, i];
    }),
    removeFromCart: (slug, variant) => setCart((c) => c.filter((x) => !(x.slug === slug && x.variant === variant))),
    setQty: (slug, qty, variant) => setCart((c) => qty <= 0 ? c.filter((x) => !(x.slug === slug && x.variant === variant)) : c.map((x) => x.slug === slug && x.variant === variant ? { ...x, qty } : x)),
    clearCart: () => { setCart([]); setCoupon(null); },
    cartCount: cart.reduce((a, b) => a + b.qty, 0),
    cartTotal: cart.reduce((a, b) => a + b.qty * b.price, 0),
    wishlist, toggleWish: (s) => setWishlist((w) => w.includes(s) ? w.filter((x) => x !== s) : [...w, s]),
    currency, setCurrency: (c) => { setCurrency(c); localStorage.setItem("sf_cur", c); },
    lang, setLang: (l) => { setLang(l); localStorage.setItem("sf_lang", l); },
    user, login: (u) => setUser(u), logout: () => {
      fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      }).catch(() => {}).finally(() => setUser(null));
    },
    dark, setDark, recentlyViewed,
    pushViewed,
    followed, toggleFollow: (s) => setFollowed((f) => f.includes(s) ? f.filter((x) => x !== s) : [...f, s]),
    coupon, couponDiscount, applyCoupon, removeCoupon: () => setCoupon(null), cartOpen, setCartOpen,
  }), [cart, wishlist, currency, lang, user, dark, recentlyViewed, followed, coupon, couponDiscount, cartOpen, pushViewed, applyCoupon]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
}
export function useCurrency() {
  const { currency } = useStore();
  return { currency, symbol: (CURRENCIES[currency]?.symbol ?? "₦") };
}
