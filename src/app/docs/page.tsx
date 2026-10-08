"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

const TOPICS = [
  {
    id: "orders",
    icon: "📦",
    title: "Orders & delivery",
    summary: "Track an order, understand delivery updates, and manage your purchases.",
    articles: [
      ["Where is my order?", "Use the order code from your confirmation page in the tracker below. You can also open Account → Orders and select Track."],
      ["What do the order statuses mean?", "Placed means we received the order. Preparing means the vendor is packing it. Out for delivery means a rider is bringing it to you."],
      ["Why was my order split?", "Items from different vendors may receive separate tracking codes and delivery updates."],
    ],
  },
  {
    id: "payments",
    icon: "🔒",
    title: "Payments & escrow",
    summary: "Learn how payments, buyer protection, coupons, and refunds work.",
    articles: [
      ["How does escrow protect me?", "Eligible online payments are held while the order is being delivered. Confirm delivery only after you receive and inspect your parcel."],
      ["When should I share my OTP?", "Only give the delivery OTP to the rider when the parcel is physically with you and the order is correct."],
      ["Why did my coupon fail?", "Check the spelling, minimum order, expiry, and whether the coupon belongs to the vendor whose product is in your cart."],
    ],
  },
  {
    id: "returns",
    icon: "↩️",
    title: "Returns & disputes",
    summary: "Get help with damaged, incorrect, missing, or unwanted items.",
    articles: [
      ["How do I request a return?", "Open Account → Returns & disputes, choose the affected order, and explain the problem. Keep the item and packaging while the request is reviewed."],
      ["What if my item is damaged or wrong?", "Take clear photos before using the item and contact support with your order code as soon as possible."],
      ["How long is the return window?", "Eligible products show a 7-day return window. Some hygiene, food, or customised products may have different conditions."],
    ],
  },
  {
    id: "account",
    icon: "👤",
    title: "Account & security",
    summary: "Sign in, protect your account, and manage saved information.",
    articles: [
      ["Can I shop without an account?", "Guest checkout is available. Creating an account makes it easier to keep orders, addresses, and saved products together."],
      ["How do I keep my account safe?", "Use a unique password and never send your password or delivery OTP through chat, email, or social media."],
    ],
  },
  {
    id: "selling",
    icon: "🏪",
    title: "Selling on Surftmarket",
    summary: "Create products, choose categories, manage orders, and receive payouts.",
    articles: [
      ["How do I add a product?", "Sign in as a vendor, open Vendor Hub → Products, select Add product, choose the correct category, upload images, and set the status to Published."],
      ["Why is my product not visible?", "Only published products appear to shoppers. Confirm the product has an image, stock, a valid category, and Published status."],
      ["How do vendor coupons work?", "Create a coupon in Vendor Hub → Promotions. Vendor coupons apply only to eligible products from that store."],
    ],
  },
  {
    id: "earning",
    icon: "💼",
    title: "Affiliates & riders",
    summary: "Find guidance for referrals, deliveries, earnings, and payouts.",
    articles: [
      ["How do affiliate links work?", "Generate a product link from the Affiliate Hub or product page. Eligible delivered orders are credited to the referring affiliate."],
      ["How do riders receive jobs?", "Approved riders can go online in the Rider Hub and accept available delivery assignments."],
    ],
  },
] as const;

const FAQS = [
  ["Can I pay when my order arrives?", "Pay on delivery is shown at checkout when it is available for the order and delivery area."],
  ["Can I change an order after placing it?", "Contact support immediately with the order code. A change may not be possible after a vendor starts preparing the parcel."],
  ["Do vendors see my payment details?", "Vendors receive the order information needed to fulfil your purchase, but they should never ask for your password or OTP."],
  ["How can I contact a vendor?", "Open the product or store page and use Chat with vendor. For payments, returns, or safety concerns, contact Surftmarket support instead."],
  ["What should I do if tracking is not updating?", "Allow a short time for a new status to appear. If it remains unchanged, send support your order code so the team can investigate."],
] as const;

type SupportStatus = { type: "success" | "error"; message: string } | null;

export default function DocsPage() {
  const { user } = useStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [submitting, setSubmitting] = useState(false);
  const [supportStatus, setSupportStatus] = useState<SupportStatus>(null);

  const filteredTopics = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return TOPICS;
    return TOPICS.map((topic) => ({
      ...topic,
      articles: topic.articles.filter(([title, body]) => `${topic.title} ${topic.summary} ${title} ${body}`.toLowerCase().includes(needle)),
    })).filter((topic) => topic.articles.length > 0);
  }, [query]);

  const trackOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = orderCode.trim().toUpperCase().replace(/\s+/g, "");
    if (!code) return;
    router.push(`/track/${encodeURIComponent(code)}`);
  };

  const submitSupport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSupportStatus(null);
    setSubmitting(true);
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const data = await response.json() as { ok?: boolean; error?: string; reference?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Unable to send your request.");
      setSupportStatus({ type: "success", message: `Request sent. Your support reference is ${data.reference}.` });
      formElement.reset();
    } catch (error) {
      setSupportStatus({ type: "error", message: error instanceof Error ? error.message : "Unable to send your request." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-4">
      <section className="bg-slate-950 text-white">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-10 sm:py-14 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">Surftmarket support</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black">How can we help?</h1>
          <p className="mt-2 text-sm text-slate-300">Search answers about shopping, selling, delivery, payments, and returns.</p>
          <label className="mt-6 mx-auto max-w-2xl flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-900 shadow-xl">
            <span aria-hidden="true" className="text-xl">⌕</span>
            <span className="sr-only">Search the Help Center</span>
            <input data-testid="help-search" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search “return”, “coupon”, “add product”…" aria-label="Search the Help Center" />
            {query && <button type="button" onClick={() => setQuery("")} className="text-xs font-bold text-slate-500">Clear</button>}
          </label>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <section className="-mt-4 relative grid md:grid-cols-2 gap-3">
          <form data-testid="track-order-form" onSubmit={trackOrder} className="rounded-3xl border bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-sm">
            <h2 className="font-black">📍 Track an order</h2>
            <p className="mt-1 text-[12px] text-slate-500">Enter the order code shown on your confirmation.</p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <input required value={orderCode} onChange={(event) => setOrderCode(event.target.value)} aria-label="Order code" placeholder="For example, SF10000001" className="flex-1 rounded-xl border bg-transparent px-3 py-2.5 text-sm uppercase" />
              <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-slate-900">Track order</button>
            </div>
          </form>
          <div className="rounded-3xl border bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-sm">
            <h2 className="font-black">👋 Need personal help?</h2>
            <p className="mt-1 text-[12px] text-slate-500">Send the support team the details and keep your reference number.</p>
            <a href="#contact-support" className="mt-3 inline-flex rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: "var(--brand)" }}>Contact support</a>
            <Link href="/account" className="ml-2 inline-flex rounded-xl border px-4 py-2.5 text-sm font-bold">My account</Link>
          </div>
        </section>

        <section className="mt-8" aria-live="polite">
          <div className="flex items-end justify-between gap-3">
            <div><h2 className="text-xl font-black">{query ? "Search results" : "Browse help topics"}</h2><p className="text-[13px] text-slate-500">{filteredTopics.length} topic{filteredTopics.length === 1 ? "" : "s"} available</p></div>
            {query && <span className="text-[12px] text-slate-500">for “{query}”</span>}
          </div>
          {filteredTopics.length ? (
            <div className="mt-3 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredTopics.map((topic) => (
                <article id={topic.id} key={topic.id} data-help-topic={topic.id} className="scroll-mt-32 rounded-3xl border bg-white dark:bg-stone-900 p-4 sm:p-5">
                  <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-2xl dark:bg-orange-950/30">{topic.icon}</span><div><h3 className="font-black">{topic.title}</h3><p className="mt-0.5 text-[12px] text-slate-500">{topic.summary}</p></div></div>
                  <div className="mt-4 space-y-2">
                    {topic.articles.map(([title, body]) => <details key={title} className="group rounded-xl border px-3 py-2"><summary className="cursor-pointer list-none text-[13px] font-bold flex justify-between gap-2">{title}<span className="group-open:rotate-45 transition">+</span></summary><p className="pt-2 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">{body}</p></details>)}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div data-testid="no-help-results" className="mt-3 rounded-3xl border border-dashed bg-white dark:bg-stone-900 p-8 text-center"><span className="text-4xl">🔎</span><h3 className="mt-2 font-black">No help articles matched</h3><p className="text-sm text-slate-500">Try fewer words or send a support request below.</p></div>
          )}
        </section>

        <section className="mt-8 grid lg:grid-cols-[1fr_0.9fr] gap-4">
          <div className="rounded-3xl border bg-white dark:bg-stone-900 p-4 sm:p-5">
            <h2 className="text-xl font-black">Frequently asked questions</h2>
            <div className="mt-3 divide-y">
              {FAQS.map(([question, answer], index) => (
                <div key={question} className="py-1">
                  <button type="button" data-testid="faq-toggle" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-bold"><span>{question}</span><span className={`transition ${openFaq === index ? "rotate-45" : ""}`}>+</span></button>
                  {openFaq === index && <p className="pb-3 pr-8 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{answer}</p>}
                </div>
              ))}
            </div>
          </div>

          <form key={user?.id ?? "guest"} id="contact-support" onSubmit={submitSupport} className="scroll-mt-32 rounded-3xl border bg-slate-950 p-4 text-white sm:p-5">
            <h2 className="text-xl font-black">Contact support</h2>
            <p className="mt-1 text-[12px] text-slate-300">Do not include passwords, card numbers, or delivery OTPs.</p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <label className="text-[12px] font-bold">Name<input required name="name" defaultValue={user?.name ?? ""} minLength={2} maxLength={120} className="mt-1 w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-slate-900" /></label>
              <label className="text-[12px] font-bold">Email<input required name="email" defaultValue={user?.email ?? ""} type="email" maxLength={160} className="mt-1 w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-slate-900" /></label>
              <label className="text-[12px] font-bold">Help with<select name="category" className="mt-1 w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-slate-900"><option>Order & delivery</option><option>Payment & coupon</option><option>Return & refund</option><option>Account & security</option><option>Vendor support</option><option>Affiliate or rider</option><option>Something else</option></select></label>
              <label className="text-[12px] font-bold">Order code <span className="font-normal text-slate-400">(optional)</span><input name="orderCode" maxLength={24} placeholder="SF…" className="mt-1 w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 uppercase text-slate-900" /></label>
            </div>
            <label className="mt-3 block text-[12px] font-bold">Subject<input required name="subject" minLength={4} maxLength={160} className="mt-1 w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-slate-900" /></label>
            <label className="mt-3 block text-[12px] font-bold">How can we help?<textarea required name="message" minLength={10} maxLength={3000} rows={5} className="mt-1 w-full resize-y rounded-xl border border-white/20 bg-white px-3 py-2.5 text-slate-900" placeholder="Describe what happened and what you need help with." /></label>
            {supportStatus && <p role="status" data-testid="support-status" className={`mt-3 rounded-xl px-3 py-2 text-[12px] font-bold ${supportStatus.type === "success" ? "bg-green-500/20 text-green-100" : "bg-red-500/20 text-red-100"}`}>{supportStatus.message}</p>}
            <button disabled={submitting} className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-black text-white disabled:opacity-60" style={{ background: "var(--brand)" }}>{submitting ? "Sending…" : "Send support request"}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
