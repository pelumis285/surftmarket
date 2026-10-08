export const CURRENCIES: Record<string, { symbol: string; rate: number; label: string }> = {
  NGN: { symbol: "₦", rate: 1, label: "NGN ₦" },
  USD: { symbol: "$", rate: 0.00065, label: "USD $" },
  EUR: { symbol: "€", rate: 0.0006, label: "EUR €" },
  GHS: { symbol: "₵", rate: 0.0098, label: "GHS ₵" },
  KES: { symbol: "KSh", rate: 0.084, label: "KES KSh" },
  GBP: { symbol: "£", rate: 0.00051, label: "GBP £" },
};

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "yo", label: "Yorùbá" },
  { code: "ha", label: "Hausa" },
  { code: "ig", label: "Igbo" },
];

export function formatMoney(ngn: number, currency = "NGN") {
  const c = CURRENCIES[currency] ?? CURRENCIES.NGN;
  const converted = ngn * c.rate;
  const digits = currency === "NGN" || currency === "KES" ? 0 : 2;
  try {
    return `${c.symbol}${converted.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
  } catch {
    return `${c.symbol}${Math.round(converted).toLocaleString()}`;
  }
}

export function naira(n: number) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export function pct(off: number, base: number) {
  if (!base) return 0;
  return Math.round((off / base) * 100);
}

export function timeLeft(target: string | Date) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { h: "00", m: "00", s: "00", done: true };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const pad = (v: number) => String(v).padStart(2, "0");
  return { h: pad(h), m: pad(m), s: pad(s), done: false };
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function orderCode() {
  return "SF" + Math.floor(10000000 + Math.random() * 90000000);
}

export function otp(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export const ORDER_STEPS = ["placed","paid","accepted","preparing","ready","assigned","picked","out_for_delivery","delivered","completed"] as const;

export const STATUS_LABEL: Record<string, string> = {
  placed: "Order placed", paid: "Payment confirmed", accepted: "Vendor accepted",
  preparing: "Preparing", ready: "Ready for pickup", assigned: "Rider assigned",
  picked: "Picked up", out_for_delivery: "Out for delivery", delivered: "Delivered",
  completed: "Completed", cancelled: "Cancelled", returned: "Returned", refunded: "Refunded",
};

export const DELIVERY_OPTIONS = [
  { id: "standard", label: "Standard (2–4 days)", fee: 1500, eta: "2–4 days" },
  { id: "express", label: "Express (24 hrs)", fee: 3500, eta: "24 hours" },
  { id: "same-day", label: "Same-day", fee: 5000, eta: "Today, before 9pm" },
  { id: "pickup", label: "Pickup station", fee: 800, eta: "2–3 days" },
];

export function deliveryFee(base: number, km = 5, speed = "standard", surge = 1) {
  const mult = speed === "express" ? 1.8 : speed === "same-day" ? 2.6 : speed === "pickup" ? 0.5 : 1;
  return Math.round((base + km * 220) * mult * surge);
}
