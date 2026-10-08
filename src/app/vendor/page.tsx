"use client";

import { DragEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, PRODUCTS, type DemoProduct } from "@/lib/demo-data";

type VendorProduct = DemoProduct & { status: string };
type VendorOrder = {
  code: string;
  customer: string;
  items: number;
  total: number;
  status: string;
  time: string;
  rider?: string;
  deliveryId?: string;
};
type StaffMember = { name: string; email: string; permission: string; status: string };
type Coupon = { code: string; discount: number; used: number; minOrder?: number; active?: boolean };
type Payout = { account: string; amount: number; status: string };
type ModalKind = "product" | "bulk" | "reject" | "slip" | "withdraw" | "commission" | "coupon" | "featured" | "chats" | "invite" | null;

const INITIAL_PRODUCTS: VendorProduct[] = PRODUCTS.slice(0, 6).map((product) => ({
  ...product,
  status: "published",
}));

const INITIAL_ORDERS: VendorOrder[] = [
  { code: "SF10000001-A", customer: "Chiamaka O.", items: 2, total: 48500, status: "New — accept?", time: "2 mins ago" },
  { code: "SF10000002-A", customer: "Tunde A.", items: 1, total: 28500, status: "Preparing", time: "1 hr ago" },
  { code: "SF99990011-A", customer: "Fatima B.", items: 3, total: 62400, status: "Ready for pickup", time: "3 hrs ago" },
];

const INITIAL_STAFF: StaffMember[] = [
  { name: "Ada", email: "ada@techhub.test", permission: "Orders & chat", status: "Active" },
  { name: "Musa", email: "musa@techhub.test", permission: "Stock only", status: "Active" },
];

const VENDOR_STORE_SLUG = "techhub-lagos";

const fieldClass = "border rounded-xl px-3 py-2 text-sm bg-transparent w-full";
const buttonClass = "text-[13px] font-bold border rounded-xl px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed";

function VendorModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/60 p-3 grid place-items-center" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border bg-white dark:bg-stone-950 shadow-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <h2 className="font-black text-lg">{title}</h2>
          <button type="button" aria-label="Close dialog" data-testid="modal-close" onClick={onClose} className="w-9 h-9 rounded-full border font-black">×</button>
        </div>
        <div className="pt-4">{children}</div>
      </section>
    </div>
  );
}

export default function VendorPage() {
  const [tab, setTab] = useState("overview");
  const [products, setProducts] = useState<VendorProduct[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<VendorOrder[]>(INITIAL_ORDERS);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [coupons, setCoupons] = useState<Coupon[]>([{ code: "TECH10", discount: 10, used: 212 }]);
  const [payouts, setPayouts] = useState<Payout[]>([
    { account: "GTB ••4521", amount: 450000, status: "Paid" },
    { account: "GTB ••4521", amount: 320000, status: "Pending approval" },
  ]);
  const [availableBalance, setAvailableBalance] = useState(1200000);
  const [vacation, setVacation] = useState(false);
  const [settings, setSettings] = useState({ storeName: "TechHub Lagos", location: "Computer Village, Lagos", shipping: "Lagos ₦1500 • Abuja ₦2500 • Nationwide ₦3500", returns: "7-day free returns" });
  const [modal, setModal] = useState<ModalKind>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [productDraft, setProductDraft] = useState({ name: "", brand: "", categorySlug: "electronics", price: "", stock: "", status: "published" });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [imageUploadStatus, setImageUploadStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [bulkDraft, setBulkDraft] = useState({ adjustment: "0", status: "unchanged" });
  const [rejectReason, setRejectReason] = useState("");
  const [withdrawDraft, setWithdrawDraft] = useState({ amount: "", account: "GTB ••4521" });
  const [couponDraft, setCouponDraft] = useState({ code: "", discount: "10", minOrder: "0" });
  const [submittingCoupon, setSubmittingCoupon] = useState(false);
  const couponSyncStarted = useRef(false);
  const productSyncStarted = useRef(false);
  const [featuredDraft, setFeaturedDraft] = useState({ product: INITIAL_PRODUCTS[0].name, duration: "7" });
  const [featuredRequests, setFeaturedRequests] = useState<string[]>([]);
  const [reviewReply, setReviewReply] = useState("");
  const [publishedReply, setPublishedReply] = useState("");
  const [chatUnread, setChatUnread] = useState(3);
  const [inviteDraft, setInviteDraft] = useState({ name: "", email: "", permission: "Orders & chat" });

  const showNotice = (text: string, error = false) => setNotice({ text, error });
  const closeModal = () => setModal(null);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem("surftmarket-vendor-demo");
        if (raw) {
          const saved = JSON.parse(raw) as {
            products?: VendorProduct[]; orders?: VendorOrder[]; staff?: StaffMember[]; coupons?: Coupon[]; payouts?: Payout[];
            availableBalance?: number; vacation?: boolean; settings?: typeof settings; featuredRequests?: string[]; publishedReply?: string; chatUnread?: number;
          };
          if (saved.products?.length) setProducts(saved.products);
          if (saved.orders?.length) setOrders(saved.orders);
          if (saved.staff?.length) setStaff(saved.staff);
          if (saved.coupons?.length) setCoupons(saved.coupons);
          if (saved.payouts?.length) setPayouts(saved.payouts);
          if (typeof saved.availableBalance === "number") setAvailableBalance(saved.availableBalance);
          if (typeof saved.vacation === "boolean") setVacation(saved.vacation);
          if (saved.settings) setSettings(saved.settings);
          if (saved.featuredRequests) setFeaturedRequests(saved.featuredRequests);
          if (typeof saved.publishedReply === "string") setPublishedReply(saved.publishedReply);
          if (typeof saved.chatUnread === "number") setChatUnread(saved.chatUnread);
        }
      } catch {
        localStorage.removeItem("surftmarket-vendor-demo");
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("surftmarket-vendor-demo", JSON.stringify({ products, orders, staff, coupons, payouts, availableBalance, vacation, settings, featuredRequests, publishedReply, chatUnread }));
  }, [availableBalance, chatUnread, coupons, featuredRequests, hydrated, orders, payouts, products, publishedReply, settings, staff, vacation]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!hydrated || couponSyncStarted.current) return;
    couponSyncStarted.current = true;
    void fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync", coupons, storeName: settings.storeName, storeSlug: VENDOR_STORE_SLUG }),
    }).then(async (response) => {
      const data = await response.json() as { ok?: boolean; coupons?: { code: string; value: number; used: number; minOrder: number; active: boolean }[] };
      if (response.ok && data.ok && data.coupons) setCoupons(data.coupons.map((coupon) => ({ code: coupon.code, discount: Number(coupon.value), used: Number(coupon.used), minOrder: Number(coupon.minOrder), active: coupon.active })));
    }).catch(() => {});
  }, [coupons, hydrated, settings.storeName]);

  useEffect(() => {
    if (!hydrated || productSyncStarted.current) return;
    productSyncStarted.current = true;
    const legacyProducts = products.filter((product) => product.id.startsWith("vendor-"));
    void fetch("/api/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync", products: legacyProducts }),
    }).then(async (response) => {
      const data = await response.json() as { ok?: boolean; items?: VendorProduct[] };
      if (!response.ok || !data.ok || !data.items) return;
      setProducts((current) => {
        const savedSlugs = new Set(data.items?.map((product) => product.slug));
        return [...data.items!, ...current.filter((product) => !savedSlugs.has(product.slug) && !product.id.startsWith("vendor-"))];
      });
    }).catch(() => {});
  }, [hydrated, products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? products.filter((product) => `${product.name} ${product.brand} ${product.slug}`.toLowerCase().includes(query)) : products;
  }, [products, search]);

  const openAddProduct = () => {
    setSelectedProduct(null);
    setProductDraft({ name: "", brand: "", categorySlug: "electronics", price: "", stock: "", status: "published" });
    setProductImages([]);
    setImageUploadStatus(null);
    setModal("product");
  };

  const openEditProduct = (product: VendorProduct) => {
    setSelectedProduct(product.slug);
    setProductDraft({
      name: product.name,
      brand: product.brand,
      categorySlug: CATEGORIES.find((category) => category.name === product.category)?.slug ?? "electronics",
      price: String(product.price),
      stock: String(product.stock),
      status: product.status === "published" ? "published" : "draft",
    });
    setProductImages(product.images?.length ? product.images : [product.image]);
    setImageUploadStatus(null);
    setModal("product");
  };

  const uploadProductImages = async (selectedFiles: File[]) => {
    setImageUploadStatus(null);
    const availableSlots = 8 - productImages.length;
    if (availableSlots <= 0) return setImageUploadStatus({ text: "A product can have up to eight images.", error: true });
    if (!selectedFiles.length) return;
    if (selectedFiles.length > availableSlots) return setImageUploadStatus({ text: `Choose no more than ${availableSlots} additional image${availableSlots === 1 ? "" : "s"}.`, error: true });
    const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    const invalidType = selectedFiles.find((file) => !supportedTypes.has(file.type));
    if (invalidType) return setImageUploadStatus({ text: `${invalidType.name} must be a JPG, PNG, WebP, or GIF image.`, error: true });
    const oversized = selectedFiles.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) return setImageUploadStatus({ text: `${oversized.name} is larger than 5 MB.`, error: true });

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("images", file));
    setUploadingImages(true);
    try {
      const response = await fetch("/api/vendor/images", { method: "POST", body: formData });
      const data = await response.json() as { ok?: boolean; error?: string; images?: { url: string }[] };
      if (!response.ok || !data.ok || !data.images?.length) throw new Error(data.error ?? "Unable to upload the selected images.");
      const uploadedUrls = data.images.map((image) => image.url);
      setProductImages((current) => [...current, ...uploadedUrls.filter((url) => !current.includes(url))].slice(0, 8));
      setImageUploadStatus({ text: `${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded. Select a thumbnail to make it the cover.` });
    } catch (error) {
      setImageUploadStatus({ text: error instanceof Error ? error.message : "Unable to upload the selected images.", error: true });
    } finally {
      setUploadingImages(false);
    }
  };

  const dropProductImages = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!uploadingImages) void uploadProductImages(Array.from(event.dataTransfer.files));
  };

  const makeCoverImage = (url: string) => setProductImages((current) => [url, ...current.filter((image) => image !== url)]);
  const removeProductImage = (url: string) => {
    setProductImages((current) => current.filter((image) => image !== url));
    setImageUploadStatus({ text: "Image removed from this product." });
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(productDraft.price);
    const stock = Number(productDraft.stock);
    if (!productDraft.name.trim() || !productDraft.brand.trim() || price <= 0 || stock < 0) return showNotice("Enter a valid product name, brand, price, and stock.", true);
    const selectedCategory = CATEGORIES.find((category) => category.slug === productDraft.categorySlug);
    if (!selectedCategory) return showNotice("Select a valid product category.", true);
    if (!productImages.length) {
      setImageUploadStatus({ text: "Add at least one product image before saving.", error: true });
      return showNotice("Add at least one product image before saving.", true);
    }
    const existing = selectedProduct ? products.find((product) => product.slug === selectedProduct) : null;
    const isDatabaseProduct = Boolean(existing && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(existing.id));
    if (selectedProduct && !isDatabaseProduct) {
      setProducts((current) => current.map((product) => product.slug === selectedProduct ? { ...product, name: productDraft.name.trim(), brand: productDraft.brand.trim(), category: selectedCategory.name, price, stock, status: productDraft.status, image: productImages[0], images: productImages } : product));
      showNotice("Demo product changes saved in this vendor preview.");
      closeModal();
      return;
    }

    setSavingProduct(true);
    try {
      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isDatabaseProduct ? "update" : "create",
          ...(isDatabaseProduct ? { id: existing?.id } : {}),
          ...productDraft,
          price,
          stock,
          images: productImages,
        }),
      });
      const data = await response.json() as { ok?: boolean; error?: string; item?: VendorProduct };
      if (!response.ok || !data.ok || !data.item) throw new Error(data.error ?? "Unable to save this product.");
      setProducts((current) => isDatabaseProduct
        ? current.map((product) => product.id === data.item!.id ? data.item! : product)
        : [data.item!, ...current.filter((product) => product.slug !== data.item!.slug)]);
      showNotice(productDraft.status === "published" ? "Product published and is now visible in the marketplace and search." : "Product saved as a draft.");
      closeModal();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Unable to save this product.", true);
    } finally {
      setSavingProduct(false);
    }
  };

  const adjustStock = (slug: string, amount: number) => {
    setProducts((current) => current.map((product) => product.slug === slug ? { ...product, stock: Math.max(0, product.stock + amount) } : product));
  };

  const saveBulkEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const adjustment = Number(bulkDraft.adjustment);
    if (!Number.isInteger(adjustment)) return showNotice("Stock adjustment must be a whole number.", true);
    setProducts((current) => current.map((product) => ({ ...product, stock: Math.max(0, product.stock + adjustment), status: bulkDraft.status === "unchanged" ? product.status : bulkDraft.status })));
    showNotice(`Bulk edit applied to ${products.length} products.`);
    closeModal();
  };

  const downloadCsv = () => {
    const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [["SKU", "Name", "Brand", "Price", "Stock", "Status"], ...products.map((product) => [product.id, product.name, product.brand, product.price, product.stock, product.status])].map((row) => row.map(quote).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "surftmarket-products.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showNotice("Product CSV downloaded.");
  };

  const acceptOrder = (code: string) => {
    setOrders((current) => current.map((order) => order.code === code ? { ...order, status: "Preparing" } : order));
    showNotice(`${code} accepted. The customer has been notified.`);
  };

  const openRejectOrder = (code: string) => {
    setSelectedOrder(code);
    setRejectReason("");
    setModal("reject");
  };

  const rejectOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOrder || rejectReason.trim().length < 5) return showNotice("Please provide a short rejection reason.", true);
    setOrders((current) => current.map((order) => order.code === selectedOrder ? { ...order, status: "Rejected" } : order));
    showNotice(`${selectedOrder} rejected. The customer has been notified.`);
    closeModal();
  };

  const openSlip = (code: string) => {
    setSelectedOrder(code);
    setModal("slip");
  };

  const requestRider = async (code: string) => {
    setBusyOrder(code);
    try {
      const response = await fetch("/api/delivery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "assign", orderCode: code }) });
      const data = await response.json() as { ok?: boolean; deliveryId?: string; rider?: { name?: string; etaMin?: number } };
      if (!response.ok || !data.ok || !data.rider?.name) throw new Error("No rider available");
      setOrders((current) => current.map((order) => order.code === code ? { ...order, status: "Rider assigned", rider: data.rider?.name, deliveryId: data.deliveryId } : order));
      showNotice(`${data.rider.name} assigned to ${code}; ETA ${data.rider.etaMin} minutes.`);
    } catch {
      showNotice("Rider request failed. Please try again.", true);
    } finally {
      setBusyOrder(null);
    }
  };

  const submitWithdrawal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(withdrawDraft.amount);
    if (amount < 1000 || amount > availableBalance) return showNotice(`Enter an amount between ₦1,000 and ₦${availableBalance.toLocaleString()}.`, true);
    setAvailableBalance((balance) => balance - amount);
    setPayouts((current) => [{ account: withdrawDraft.account, amount, status: "Pending approval" }, ...current]);
    showNotice(`Withdrawal of ₦${amount.toLocaleString()} submitted for approval.`);
    closeModal();
  };

  const submitCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = couponDraft.code.trim().toUpperCase();
    const discount = Number(couponDraft.discount);
    const minOrder = Number(couponDraft.minOrder);
    if (!/^[A-Z0-9]{4,12}$/.test(code) || discount < 1 || discount > 80 || minOrder < 0) return showNotice("Use a 4–12 character code, a 1–80% discount, and a valid minimum order.", true);
    if (coupons.some((coupon) => coupon.code === code)) return showNotice("That coupon code already exists.", true);
    setSubmittingCoupon(true);
    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", code, discount, minOrder, storeName: settings.storeName, storeSlug: VENDOR_STORE_SLUG }),
      });
      const data = await response.json() as { ok?: boolean; error?: string; coupons?: { code: string; value: number; used: number; minOrder: number; active: boolean }[] };
      if (!response.ok || !data.ok || !data.coupons) throw new Error(data.error ?? "Unable to create coupon.");
      setCoupons(data.coupons.map((coupon) => ({ code: coupon.code, discount: Number(coupon.value), used: Number(coupon.used), minOrder: Number(coupon.minOrder), active: coupon.active })));
      showNotice(`${code} is active and ready to use in the cart.`);
      closeModal();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Unable to create coupon.", true);
    } finally {
      setSubmittingCoupon(false);
    }
  };

  const submitFeaturedRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const label = `${featuredDraft.product} — ${featuredDraft.duration} days — Pending review`;
    setFeaturedRequests((current) => [label, ...current]);
    showNotice("Featured slot request submitted.");
    closeModal();
  };

  const publishReviewReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reviewReply.trim().length < 3) return showNotice("Write a reply before publishing.", true);
    setPublishedReply(reviewReply.trim());
    setReviewReply("");
    showNotice("Your public reply was published.");
  };

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings.storeName.trim() || !settings.location.trim() || !settings.shipping.trim() || !settings.returns.trim()) return showNotice("Complete all store settings fields.", true);
    showNotice("Store settings saved.");
  };

  const inviteStaff = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (staff.length >= 5) return showNotice("All five staff seats are in use.", true);
    if (!inviteDraft.name.trim() || !inviteDraft.email.includes("@")) return showNotice("Enter the staff member’s name and a valid email.", true);
    setStaff((current) => [...current, { name: inviteDraft.name.trim(), email: inviteDraft.email.trim().toLowerCase(), permission: inviteDraft.permission, status: "Invite sent" }]);
    showNotice(`Invitation sent to ${inviteDraft.email.trim().toLowerCase()}.`);
    closeModal();
  };

  const selectedOrderData = orders.find((order) => order.code === selectedOrder);

  return (
    <div data-testid="vendor-hub" className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-10">
      {notice && <div role="status" data-testid="vendor-notice" className={`fixed z-[100] top-3 left-1/2 -translate-x-1/2 max-w-[calc(100%-24px)] rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-xl ${notice.error ? "bg-red-600" : "bg-green-700"}`}>{notice.text}</div>}

      <div className="flex items-center gap-3 flex-wrap">
        <span className="w-12 h-12 rounded-2xl bg-slate-900 text-white grid place-items-center font-black text-xl">{settings.storeName.charAt(0).toUpperCase()}</span>
        <div className="flex-1 min-w-[180px]"><h1 className="font-black text-lg sm:text-xl">{settings.storeName} — Vendor hub</h1><p className="text-[12px] text-slate-500">✔ Approved • Rating 4.7 • {vacation ? "🌴 Vacation mode ON" : "🟢 Open"}</p></div>
        <label className="text-[13px] font-bold flex items-center gap-2 border rounded-xl px-3 py-2">Vacation <input aria-label="Vacation mode" data-testid="vacation-toggle" type="checkbox" checked={vacation} onChange={(event) => { setVacation(event.target.checked); showNotice(event.target.checked ? "Vacation mode enabled. New orders are paused." : "Vacation mode disabled. Your store is open."); }} className="w-5 h-5" /></label>
        <button type="button" data-testid="add-product" onClick={openAddProduct} className="text-[13px] font-bold px-4 py-2 rounded-xl text-white" style={{ background: "var(--brand)" }}>+ Add product</button>
      </div>

      <div className="mt-3 flex gap-1 overflow-x-auto no-scrollbar text-[13px] font-bold">
        {[["overview", "📊 Overview"], ["products", "📦 Products"], ["orders", "🧾 Orders"], ["wallet", "💰 Wallet & payouts"], ["promos", "🎟 Promotions"], ["reviews", "⭐ Reviews & chat"], ["settings", "⚙️ Store settings"], ["team", "👥 Team"]].map(([id, label]) => (
          <button type="button" key={id} data-testid={`tab-${id}`} onClick={() => setTab(id)} className={`px-4 py-2 rounded-full whitespace-nowrap ${tab === id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white dark:bg-stone-900 border"}`}>{label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-3 space-y-3" data-testid="panel-overview">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[["Revenue (30d)", "₦4.2M", "+18%"], ["Orders", "312", "+24"], ["Pending payout", "₦860k", "escrow"], ["Low stock", `${products.filter((product) => product.stock < 50).length} SKUs`, "restock"]].map(([heading, value, note]) => (
              <div key={heading} className="bg-white dark:bg-stone-900 border rounded-2xl p-4"><p className="text-[12px] text-slate-500">{heading}</p><p className="font-black text-xl">{value}</p><p className="text-[11px] text-green-600 font-bold">{note}</p></div>
            ))}
          </div>
          <div className="bg-white dark:bg-stone-900 border rounded-3xl p-5">
            <p className="font-bold text-sm">Sales — last 14 days</p>
            <div className="mt-2 flex items-end gap-1 h-32">
              {[40, 65, 50, 80, 62, 90, 75, 100, 68, 84, 92, 70, 110, 95].map((value, index) => <div key={index} className="flex-1 rounded-t-lg" style={{ height: `${value}%`, background: index === 12 ? "var(--brand)" : "#fed7aa" }} title={`Day ${index + 1}`} />)}
            </div>
            <p className="text-[12px] text-slate-500 mt-2">Top product: Oraimo FreePods (890 sold) • Conversion 3.8% • Visitors from Lagos 42%</p>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="mt-3 bg-white dark:bg-stone-900 border rounded-3xl p-4" data-testid="panel-products">
          <div className="flex gap-2 flex-wrap">
            <input aria-label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SKUs…" className="border rounded-xl px-3 py-2 text-sm flex-1 min-w-[160px] bg-transparent" />
            <button type="button" data-testid="download-csv" onClick={downloadCsv} className={buttonClass}>📤 Bulk CSV</button>
            <button type="button" data-testid="bulk-edit" onClick={() => setModal("bulk")} className={buttonClass}>Bulk edit</button>
            <span className="text-[11px] text-slate-500 self-center">Edits require admin approval (configurable)</span>
          </div>
          <div className="mt-2 space-y-2">
            {filteredProducts.map((product) => (
              <div key={product.slug} data-product-slug={product.slug} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 border rounded-2xl p-2">
                <img src={product.image} alt={product.name} className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 min-w-[170px] sm:min-w-0"><p className="text-[13px] font-bold line-clamp-1">{product.name}</p><p className="text-[11px] text-slate-500">{product.category} • {product.status} • SKU {product.id.slice(0, 8).toUpperCase()}</p></div>
                <span className="flex items-center gap-1 border rounded-full px-1">
                  <button type="button" aria-label={`Decrease stock for ${product.name}`} data-action="stock-decrease" onClick={() => adjustStock(product.slug, -1)} className="w-8 h-8 font-bold">−</button>
                  <span data-testid={`stock-${product.slug}`} className="text-[13px] font-bold w-9 text-center">{product.stock}</span>
                  <button type="button" aria-label={`Increase stock for ${product.name}`} data-action="stock-increase" onClick={() => adjustStock(product.slug, 1)} className="w-8 h-8 font-bold">+</button>
                </span>
                <span className="font-bold text-sm">₦{product.price.toLocaleString()}</span>
                <button type="button" data-action="edit-product" onClick={() => openEditProduct(product)} className="text-[12px] font-bold border rounded-lg px-3 py-2">Edit</button>
              </div>
            ))}
            {!filteredProducts.length && <p data-testid="no-products" className="text-center text-sm text-slate-500 py-8">No products match “{search}”.</p>}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="mt-3 space-y-2" data-testid="panel-orders">
          {orders.map((order) => (
            <div key={order.code} data-order-code={order.code} className="bg-white dark:bg-stone-900 border rounded-2xl p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[180px]"><p className="font-bold text-sm">{order.code} • {order.customer}</p><p className="text-[12px] text-slate-500">{order.items} items • ₦{order.total.toLocaleString()} • {order.time}{order.rider ? ` • ${order.rider} (${order.deliveryId})` : ""}</p></div>
              <span data-testid={`order-status-${order.code}`} className="text-[12px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{order.status}</span>
              <div className="w-full sm:w-auto flex gap-1 flex-wrap">
                <button type="button" data-action="accept-order" onClick={() => acceptOrder(order.code)} disabled={order.status === "Rejected" || order.status === "Rider assigned"} className="text-[12px] font-bold px-3 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50">Accept</button>
                <button type="button" data-action="reject-order" onClick={() => openRejectOrder(order.code)} disabled={order.status === "Rejected" || order.status === "Rider assigned"} className="text-[12px] font-bold px-3 py-2 rounded-lg border disabled:opacity-50">Reject</button>
                <button type="button" data-action="print-slip" onClick={() => openSlip(order.code)} className="text-[12px] font-bold px-3 py-2 rounded-lg border">🖨 Slip</button>
                <button type="button" data-action="request-rider" onClick={() => requestRider(order.code)} disabled={busyOrder === order.code || order.status === "Rejected" || order.status === "Rider assigned"} className="text-[12px] font-bold px-3 py-2 rounded-lg text-white disabled:opacity-50" style={{ background: "var(--brand)" }}>{busyOrder === order.code ? "Assigning…" : "🛵 Request rider"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "wallet" && (
        <div className="mt-3 grid md:grid-cols-3 gap-2" data-testid="panel-wallet">
          <div className="bg-white dark:bg-stone-900 border rounded-2xl p-4"><p className="text-[12px] text-slate-500">Available</p><p data-testid="available-balance" className="font-black text-xl">₦{availableBalance.toLocaleString()}</p><button type="button" data-testid="withdraw" onClick={() => { setWithdrawDraft({ amount: "", account: "GTB ••4521" }); setModal("withdraw"); }} className="mt-2 text-[13px] font-bold px-4 py-2 rounded-xl text-white" style={{ background: "var(--brand)" }}>Withdraw</button></div>
          <div className="bg-white dark:bg-stone-900 border rounded-2xl p-4"><p className="text-[12px] text-slate-500">Pending escrow</p><p className="font-black text-xl">₦860k</p><button type="button" data-testid="view-escrow-orders" onClick={() => { setTab("orders"); showNotice("Showing the orders behind your pending escrow balance."); }} className="mt-2 text-[13px] font-bold px-4 py-2 rounded-xl text-white" style={{ background: "var(--brand)" }}>View 12 orders</button></div>
          <div className="bg-white dark:bg-stone-900 border rounded-2xl p-4"><p className="text-[12px] text-slate-500">Commission paid (30d)</p><p className="font-black text-xl">₦504k</p><button type="button" data-testid="commission-breakdown" onClick={() => setModal("commission")} className="mt-2 text-[13px] font-bold px-4 py-2 rounded-xl text-white" style={{ background: "var(--brand)" }}>View 12% average</button></div>
          <div className="md:col-span-3 bg-white dark:bg-stone-900 border rounded-2xl p-4 text-sm">
            <p className="font-bold">Payout history</p>
            {payouts.map((payout, index) => <p key={`${payout.account}-${payout.amount}-${index}`} className="flex flex-wrap justify-between gap-1 border-b last:border-b-0 py-2"><span>→ {payout.account} • ₦{payout.amount.toLocaleString()}</span><b className={payout.status === "Paid" ? "text-green-600" : "text-amber-600"}>{payout.status}</b></p>)}
          </div>
        </div>
      )}

      {tab === "promos" && (
        <div className="mt-3 bg-white dark:bg-stone-900 border rounded-3xl p-4 text-sm" data-testid="panel-promos">
          <p className="font-bold">Coupons & featured requests</p>
          <div className="mt-2 flex gap-2 flex-wrap">
            {coupons.map((coupon) => <span key={coupon.code} className="border rounded-xl px-3 py-2 font-bold">{coupon.code} — {coupon.discount}% off{Number(coupon.minOrder ?? 0) > 0 ? ` • min ₦${Number(coupon.minOrder).toLocaleString()}` : ""} ⚡ {coupon.used} used</span>)}
            <button type="button" data-testid="new-coupon" onClick={() => { setCouponDraft({ code: "", discount: "10", minOrder: "0" }); setModal("coupon"); }} className="font-bold px-3 py-2 rounded-xl text-white" style={{ background: "var(--brand)" }}>+ New coupon</button>
            <button type="button" data-testid="request-featured" onClick={() => { setFeaturedDraft({ product: products[0]?.name ?? "", duration: "7" }); setModal("featured"); }} className="font-bold px-3 py-2 rounded-xl border">⭐ Request featured slot</button>
          </div>
          {featuredRequests.length > 0 && <div className="mt-4 border-t pt-3"><p className="font-bold">Requests</p>{featuredRequests.map((request, index) => <p key={`${request}-${index}`} className="text-slate-500 mt-1">• {request}</p>)}</div>}
        </div>
      )}

      {tab === "reviews" && (
        <div className="mt-3 bg-white dark:bg-stone-900 border rounded-3xl p-4 text-sm" data-testid="panel-reviews">
          <p className="font-bold">Latest review — “Original and fast!” ★★★★★</p>
          <p className="text-slate-500">Chiamaka O. on Oraimo FreePods</p>
          {publishedReply && <p data-testid="published-reply" className="mt-2 rounded-xl bg-slate-100 dark:bg-stone-800 p-3"><b>Your reply:</b> {publishedReply}</p>}
          <form onSubmit={publishReviewReply} className="mt-2 flex flex-col sm:flex-row gap-2"><input aria-label="Public review reply" value={reviewReply} onChange={(event) => setReviewReply(event.target.value)} placeholder="Reply publicly…" className="flex-1 border rounded-xl px-3 py-2 text-sm bg-transparent" /><button type="submit" data-testid="publish-reply" className="font-bold px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Reply</button></form>
          <button type="button" data-testid="open-chats" onClick={() => setModal("chats")} className="mt-3 font-bold border rounded-xl px-3 py-2">💬 Open customer chats ({chatUnread} unread)</button>
        </div>
      )}

      {tab === "settings" && (
        <form onSubmit={saveSettings} className="mt-3 bg-white dark:bg-stone-900 border rounded-3xl p-4 text-sm grid md:grid-cols-2 gap-2" data-testid="panel-settings">
          <input required value={settings.storeName} onChange={(event) => setSettings((current) => ({ ...current, storeName: event.target.value }))} className={fieldClass} aria-label="Store name" />
          <input required value={settings.location} onChange={(event) => setSettings((current) => ({ ...current, location: event.target.value }))} className={fieldClass} aria-label="Location" />
          <input required value={settings.shipping} onChange={(event) => setSettings((current) => ({ ...current, shipping: event.target.value }))} className={`${fieldClass} md:col-span-2`} aria-label="Shipping zones" />
          <input required value={settings.returns} onChange={(event) => setSettings((current) => ({ ...current, returns: event.target.value }))} className={`${fieldClass} md:col-span-2`} aria-label="Return policy" />
          <button type="submit" data-testid="save-settings" className="font-bold px-4 py-2 rounded-xl text-white md:col-span-2" style={{ background: "var(--brand)" }}>Save store settings</button>
        </form>
      )}

      {tab === "team" && (
        <div className="mt-3 bg-white dark:bg-stone-900 border rounded-3xl p-4 text-sm" data-testid="panel-team">
          <p className="font-bold">Staff ({staff.length}/5 seats)</p>
          {staff.map((member) => <p key={member.email} className="flex flex-wrap justify-between gap-1 border-b py-2"><span>{member.name} — {member.permission}<small className="block text-slate-500">{member.email}</small></span><span className="text-slate-500">{member.status}</span></p>)}
          <button type="button" data-testid="invite-staff" disabled={staff.length >= 5} onClick={() => { setInviteDraft({ name: "", email: "", permission: "Orders & chat" }); setModal("invite"); }} className="mt-2 font-bold text-sm border rounded-xl px-3 py-2 disabled:opacity-50">+ Invite staff</button>
        </div>
      )}

      {modal === "product" && <VendorModal title={selectedProduct ? "Edit product" : "Add product"} onClose={closeModal}>
        <form onSubmit={saveProduct} className="space-y-3">
          <label className="block text-sm font-bold">Product name<input required aria-label="Product name" value={productDraft.name} onChange={(event) => setProductDraft((current) => ({ ...current, name: event.target.value }))} className={`${fieldClass} mt-1`} /></label>
          <label className="block text-sm font-bold">Brand<input required aria-label="Product brand" value={productDraft.brand} onChange={(event) => setProductDraft((current) => ({ ...current, brand: event.target.value }))} className={`${fieldClass} mt-1`} /></label>
          <label className="block text-sm font-bold">Category
            <select required aria-label="Product category" value={productDraft.categorySlug} onChange={(event) => setProductDraft((current) => ({ ...current, categorySlug: event.target.value }))} className={`${fieldClass} mt-1`}>
              {CATEGORIES.map((category) => <option key={category.slug} value={category.slug}>{category.icon} {category.name}</option>)}
            </select>
            <span className="mt-1 block text-[11px] font-normal text-slate-500">Published products appear in this category and in marketplace search.</span>
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2"><p className="text-sm font-bold">Product images</p><span data-testid="product-image-count" className="text-[12px] text-slate-500">{productImages.length}/8 images</span></div>
            <label
              data-testid="product-image-dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={dropProductImages}
              className={`min-h-24 border-2 border-dashed rounded-2xl px-4 py-5 grid place-items-center text-center cursor-pointer transition ${uploadingImages ? "opacity-60 cursor-wait" : "hover:border-orange-500 hover:bg-orange-50/60 dark:hover:bg-orange-950/20"}`}
            >
              <input
                data-testid="product-image-input"
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={uploadingImages || productImages.length >= 8}
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files ?? []);
                  event.currentTarget.value = "";
                  void uploadProductImages(files);
                }}
              />
              <span><span className="block text-2xl">{uploadingImages ? "⏳" : "📷"}</span><span className="block text-sm font-bold">{uploadingImages ? "Uploading images…" : productImages.length >= 8 ? "Maximum of eight images reached" : "Choose images or drop them here"}</span><span className="block text-[11px] text-slate-500 mt-1">JPG, PNG, WebP or GIF • up to 5 MB each • maximum 8</span></span>
            </label>
            {imageUploadStatus && <p role="status" data-testid="image-upload-status" className={`rounded-xl px-3 py-2 text-[12px] font-bold ${imageUploadStatus.error ? "bg-red-50 text-red-700 dark:bg-red-950/30" : "bg-green-50 text-green-700 dark:bg-green-950/30"}`}>{imageUploadStatus.text}</p>}
            {productImages.length > 0 ? (
              <div data-testid="product-image-gallery" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {productImages.map((url, index) => (
                  <div key={url} className={`relative rounded-2xl border-2 overflow-hidden bg-slate-50 dark:bg-stone-900 ${index === 0 ? "border-orange-500" : "border-slate-200 dark:border-stone-700"}`}>
                    <button type="button" data-action="make-cover-image" onClick={() => makeCoverImage(url)} aria-label={`Make image ${index + 1} the product cover`} className="block w-full aspect-square">
                      <img src={url} alt={`${productDraft.name || "Product"} preview ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                    <div className="absolute left-1.5 top-1.5 rounded-full bg-slate-950/80 text-white text-[10px] font-bold px-2 py-1">{index === 0 ? "Cover" : `Image ${index + 1}`}</div>
                    <button type="button" data-action="remove-product-image" onClick={() => removeProductImage(url)} aria-label={`Remove image ${index + 1}`} className="absolute right-1.5 top-1.5 w-7 h-7 rounded-full bg-white/95 text-red-600 border font-black shadow">×</button>
                  </div>
                ))}
              </div>
            ) : <p className="text-[12px] text-slate-500">Add clear photos from different angles. The first image will be the marketplace cover.</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-bold">Price (₦)<input required min="1" type="number" aria-label="Product price" value={productDraft.price} onChange={(event) => setProductDraft((current) => ({ ...current, price: event.target.value }))} className={`${fieldClass} mt-1`} /></label>
            <label className="block text-sm font-bold">Stock<input required min="0" type="number" aria-label="Product stock" value={productDraft.stock} onChange={(event) => setProductDraft((current) => ({ ...current, stock: event.target.value }))} className={`${fieldClass} mt-1`} /></label>
          </div>
          <label className="block text-sm font-bold">Status<select aria-label="Product status" value={productDraft.status} onChange={(event) => setProductDraft((current) => ({ ...current, status: event.target.value }))} className={`${fieldClass} mt-1`}><option value="published">Published — visible to shoppers</option><option value="draft">Draft — vendor only</option></select></label>
          <div className="flex justify-end gap-2"><button type="button" onClick={closeModal} className={buttonClass}>Cancel</button><button type="submit" disabled={uploadingImages || savingProduct} data-testid="save-product" className="rounded-xl px-4 py-2 font-bold text-white disabled:opacity-50" style={{ background: "var(--brand)" }}>{uploadingImages ? "Uploading…" : savingProduct ? "Saving…" : selectedProduct ? "Save changes" : "Create product"}</button></div>
        </form>
      </VendorModal>}

      {modal === "bulk" && <VendorModal title="Bulk edit products" onClose={closeModal}>
        <form onSubmit={saveBulkEdit} className="space-y-3">
          <p className="text-sm text-slate-500">Apply these changes to all {products.length} products.</p>
          <label className="block text-sm font-bold">Stock adjustment<input type="number" step="1" aria-label="Bulk stock adjustment" value={bulkDraft.adjustment} onChange={(event) => setBulkDraft((current) => ({ ...current, adjustment: event.target.value }))} className={`${fieldClass} mt-1`} /></label>
          <label className="block text-sm font-bold">Set status<select aria-label="Bulk product status" value={bulkDraft.status} onChange={(event) => setBulkDraft((current) => ({ ...current, status: event.target.value }))} className={`${fieldClass} mt-1`}><option value="unchanged">Leave unchanged</option><option value="published">Published</option><option value="draft">Draft</option><option value="paused">Paused</option></select></label>
          <div className="flex justify-end gap-2"><button type="button" onClick={closeModal} className={buttonClass}>Cancel</button><button type="submit" data-testid="apply-bulk-edit" className="rounded-xl bg-slate-900 text-white px-4 py-2 font-bold">Apply changes</button></div>
        </form>
      </VendorModal>}

      {modal === "reject" && <VendorModal title={`Reject ${selectedOrder ?? "order"}`} onClose={closeModal}>
        <form onSubmit={rejectOrder} className="space-y-3"><label className="block text-sm font-bold">Reason<textarea required minLength={5} aria-label="Rejection reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} className={`${fieldClass} mt-1 min-h-24`} placeholder="For example: Item is out of stock" /></label><div className="flex justify-end gap-2"><button type="button" onClick={closeModal} className={buttonClass}>Cancel</button><button type="submit" data-testid="confirm-reject" className="rounded-xl bg-red-600 text-white px-4 py-2 font-bold">Reject order</button></div></form>
      </VendorModal>}

      {modal === "slip" && selectedOrderData && <VendorModal title="Packing slip" onClose={closeModal}>
        <div data-testid="packing-slip" className="border rounded-2xl p-4 text-sm"><p className="font-black text-lg">SURFTMARKET</p><p className="mt-3"><b>Order:</b> {selectedOrderData.code}</p><p><b>Customer:</b> {selectedOrderData.customer}</p><p><b>Items:</b> {selectedOrderData.items}</p><p><b>Total:</b> ₦{selectedOrderData.total.toLocaleString()}</p><p><b>Store:</b> {settings.storeName}</p></div>
        <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={closeModal} className={buttonClass}>Close</button><button type="button" data-testid="print-packing-slip" onClick={() => { window.print(); showNotice("Packing slip sent to the print dialog."); }} className="rounded-xl bg-slate-900 text-white px-4 py-2 font-bold">🖨 Print packing slip</button></div>
      </VendorModal>}

      {modal === "withdraw" && <VendorModal title="Withdraw funds" onClose={closeModal}>
        <form onSubmit={submitWithdrawal} className="space-y-3"><p className="text-sm text-slate-500">Available: ₦{availableBalance.toLocaleString()}</p><label className="block text-sm font-bold">Amount (₦)<input required min="1000" max={availableBalance} type="number" aria-label="Withdrawal amount" value={withdrawDraft.amount} onChange={(event) => setWithdrawDraft((current) => ({ ...current, amount: event.target.value }))} className={`${fieldClass} mt-1`} /></label><label className="block text-sm font-bold">Payout account<select aria-label="Payout account" value={withdrawDraft.account} onChange={(event) => setWithdrawDraft((current) => ({ ...current, account: event.target.value }))} className={`${fieldClass} mt-1`}><option>GTB ••4521</option><option>Access ••9074</option></select></label><div className="flex justify-end gap-2"><button type="button" onClick={closeModal} className={buttonClass}>Cancel</button><button type="submit" data-testid="submit-withdrawal" className="rounded-xl text-white px-4 py-2 font-bold" style={{ background: "var(--brand)" }}>Submit withdrawal</button></div></form>
      </VendorModal>}

      {modal === "commission" && <VendorModal title="Commission breakdown" onClose={closeModal}>
        <div className="space-y-2 text-sm"><p className="flex justify-between border-b pb-2"><span>Electronics</span><b>10%</b></p><p className="flex justify-between border-b pb-2"><span>Phones & tablets</span><b>12%</b></p><p className="flex justify-between border-b pb-2"><span>Other categories</span><b>14%</b></p><p className="flex justify-between font-black"><span>Weighted average</span><span>12%</span></p></div><button type="button" data-testid="close-commission" onClick={closeModal} className="mt-4 w-full rounded-xl bg-slate-900 text-white px-4 py-2 font-bold">Done</button>
      </VendorModal>}

      {modal === "coupon" && <VendorModal title="Create coupon" onClose={closeModal}>
        <form onSubmit={submitCoupon} className="space-y-3"><label className="block text-sm font-bold">Coupon code<input required minLength={4} maxLength={12} aria-label="Coupon code" value={couponDraft.code} onChange={(event) => setCouponDraft((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))} className={`${fieldClass} mt-1 uppercase`} placeholder="WELCOME15" /></label><div className="grid grid-cols-2 gap-2"><label className="block text-sm font-bold">Discount (%)<input required min="1" max="80" type="number" aria-label="Coupon discount" value={couponDraft.discount} onChange={(event) => setCouponDraft((current) => ({ ...current, discount: event.target.value }))} className={`${fieldClass} mt-1`} /></label><label className="block text-sm font-bold">Minimum order (₦)<input required min="0" type="number" aria-label="Coupon minimum order" value={couponDraft.minOrder} onChange={(event) => setCouponDraft((current) => ({ ...current, minOrder: event.target.value }))} className={`${fieldClass} mt-1`} /></label></div><p className="text-[12px] text-slate-500">The discount applies only to items sold by your store. Customers must press Apply in their cart.</p><div className="flex justify-end gap-2"><button type="button" disabled={submittingCoupon} onClick={closeModal} className={buttonClass}>Cancel</button><button type="submit" disabled={submittingCoupon} data-testid="create-coupon" className="rounded-xl text-white px-4 py-2 font-bold disabled:opacity-50" style={{ background: "var(--brand)" }}>{submittingCoupon ? "Creating…" : "Create coupon"}</button></div></form>
      </VendorModal>}

      {modal === "featured" && <VendorModal title="Request featured slot" onClose={closeModal}>
        <form onSubmit={submitFeaturedRequest} className="space-y-3"><label className="block text-sm font-bold">Product<select aria-label="Featured product" value={featuredDraft.product} onChange={(event) => setFeaturedDraft((current) => ({ ...current, product: event.target.value }))} className={`${fieldClass} mt-1`}>{products.map((product) => <option key={product.slug}>{product.name}</option>)}</select></label><label className="block text-sm font-bold">Placement duration<select aria-label="Featured duration" value={featuredDraft.duration} onChange={(event) => setFeaturedDraft((current) => ({ ...current, duration: event.target.value }))} className={`${fieldClass} mt-1`}><option value="3">3 days — ₦15,000</option><option value="7">7 days — ₦30,000</option><option value="14">14 days — ₦52,000</option></select></label><div className="rounded-xl bg-amber-50 text-amber-800 p-3 text-sm">Requests are reviewed before your wallet is charged.</div><div className="flex justify-end gap-2"><button type="button" onClick={closeModal} className={buttonClass}>Cancel</button><button type="submit" data-testid="submit-featured" className="rounded-xl text-white px-4 py-2 font-bold" style={{ background: "var(--brand)" }}>Submit request</button></div></form>
      </VendorModal>}

      {modal === "chats" && <VendorModal title="Customer chats" onClose={closeModal}>
        <div className="space-y-2 text-sm"><p className="border rounded-xl p-3"><b>Chiamaka O.</b><span className="block text-slate-500">Is the black colour still available?</span></p><p className="border rounded-xl p-3"><b>Tunde A.</b><span className="block text-slate-500">Please confirm my pickup time.</span></p><p className="border rounded-xl p-3"><b>Fatima B.</b><span className="block text-slate-500">Thank you for the quick delivery!</span></p></div><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={closeModal} className={buttonClass}>Close</button><button type="button" data-testid="mark-chats-read" onClick={() => { setChatUnread(0); showNotice("All customer chats marked as read."); closeModal(); }} className="rounded-xl bg-slate-900 text-white px-4 py-2 font-bold">Mark all read</button></div>
      </VendorModal>}

      {modal === "invite" && <VendorModal title="Invite staff member" onClose={closeModal}>
        <form onSubmit={inviteStaff} className="space-y-3"><label className="block text-sm font-bold">Name<input required aria-label="Staff name" value={inviteDraft.name} onChange={(event) => setInviteDraft((current) => ({ ...current, name: event.target.value }))} className={`${fieldClass} mt-1`} /></label><label className="block text-sm font-bold">Email<input required type="email" aria-label="Staff email" value={inviteDraft.email} onChange={(event) => setInviteDraft((current) => ({ ...current, email: event.target.value }))} className={`${fieldClass} mt-1`} /></label><label className="block text-sm font-bold">Permissions<select aria-label="Staff permissions" value={inviteDraft.permission} onChange={(event) => setInviteDraft((current) => ({ ...current, permission: event.target.value }))} className={`${fieldClass} mt-1`}><option>Orders & chat</option><option>Stock only</option><option>Reports only</option><option>Full manager</option></select></label><div className="flex justify-end gap-2"><button type="button" onClick={closeModal} className={buttonClass}>Cancel</button><button type="submit" data-testid="send-invite" className="rounded-xl text-white px-4 py-2 font-bold" style={{ background: "var(--brand)" }}>Send invitation</button></div></form>
      </VendorModal>}
    </div>
  );
}
