export type DemoProduct = {
  id: string; slug: string; name: string; price: number; comparePrice?: number;
  rating: number; reviews: number; sold: number; image: string; images: string[];
  category: string; brand: string; vendor: string; vendorSlug: string; stock: number;
  location: string; flash?: boolean; featured?: boolean; isNew?: boolean; description: string;
  variants?: { label: string; options: string[] }[]; colors?: string[];
};

const img = (seed: string) =>
  `https://images.unsplash.com/${seed}?q=80&w=800&auto=format&fit=crop`;

export const CATEGORIES = [
  { name: "Phones & Tablets", slug: "phones-tablets", icon: "📱", count: 12480, image: img("photo-1511707171634-5f897ff02aa9") },
  { name: "Electronics", slug: "electronics", icon: "🔌", count: 8930, image: img("photo-1498049794561-7780e7231661") },
  { name: "Fashion", slug: "fashion", icon: "👗", count: 21400, image: img("photo-1441986300917-64674bd600d8") },
  { name: "Home & Kitchen", slug: "home-kitchen", icon: "🏠", count: 9760, image: img("photo-1556911220-bff31c812dba") },
  { name: "Beauty", slug: "beauty", icon: "💄", count: 6420, image: img("photo-1596462502278-27bfdc403348") },
  { name: "Groceries", slug: "groceries", icon: "🛒", count: 15200, image: img("photo-1542838132-92c53300491e") },
  { name: "Computing", slug: "computing", icon: "💻", count: 5310, image: img("photo-1496181133206-80ce9b88a853") },
  { name: "Baby & Kids", slug: "baby-kids", icon: "🧸", count: 4180, image: img("photo-1519689680058-324335c77eba") },
  { name: "Sports", slug: "sports", icon: "⚽", count: 3890, image: img("photo-1461896836934-ffe607ba8211") },
  { name: "Automobile", slug: "automobile", icon: "🚗", count: 2740, image: img("photo-1492144534655-ae79c964c9d7") },
];

export const PRODUCTS: DemoProduct[] = [
  { id: "p1", slug: "oraimo-freepods-pro anc", name: "Oraimo FreePods Pro ANC True Wireless Earbuds", price: 28500, comparePrice: 42000, rating: 4.6, reviews: 2314, sold: 8900, image: img("photo-1590658268037-6bf12165a8df"), images: [img("photo-1590658268037-6bf12165a8df"), img("photo-1606220945770-b5b6c2c55bf1"), img("photo-1572569511254-d8f925fe2cbb")], category: "Electronics", brand: "Oraimo", vendor: "TechHub Lagos", vendorSlug: "techhub-lagos", stock: 140, location: "Lagos", flash: true, featured: true, description: "Hybrid noise cancellation, 36-hour battery, fast charge, Bluetooth 5.3 with ultra-low latency gaming mode." },
  { id: "p2", slug: "samsung-galaxy-a55-5g", name: "Samsung Galaxy A55 5G 8GB/256GB", price: 485000, comparePrice: 540000, rating: 4.8, reviews: 912, sold: 2100, image: img("photo-1610945265064-0e34e5519bbf"), images: [img("photo-1610945265064-0e34e5519bbf"), img("photo-1598327105666-5b89351aff97")], category: "Phones & Tablets", brand: "Samsung", vendor: "Slot Connect", vendorSlug: "slot-connect", stock: 45, location: "Lagos", flash: true, featured: true, description: "Super AMOLED 120Hz, Exynos 1480, 50MP OIS camera, 5000mAh battery, IP67." },
  { id: "p3", slug: "ankara-midi-dress", name: "Premium Ankara Midi Dress — Owambe Edition", price: 18500, comparePrice: 26000, rating: 4.7, reviews: 640, sold: 3200, image: img("photo-1594938298603-c8148c4dae35"), images: [img("photo-1594938298603-c8148c4dae35"), img("photo-1583496661160-fb5886a13d44")], category: "Fashion", brand: "Adire House", vendor: "Adire House", vendorSlug: "adire-house", stock: 80, location: "Abeokuta", featured: true, description: "Hand-dyed adire, tailored fit, sizes S–XXL. Perfect for owambe and office." },
  { id: "p4", slug: "hp-pavilion-15-laptop", name: "HP Pavilion 15 Core i7 16GB/512GB SSD", price: 895000, comparePrice: 980000, rating: 4.5, reviews: 388, sold: 640, image: img("photo-1496181133206-80ce9b88a853"), images: [img("photo-1496181133206-80ce9b88a853")], category: "Computing", brand: "HP", vendor: "TechHub Lagos", vendorSlug: "techhub-lagos", stock: 22, location: "Lagos", flash: true, description: "13th gen i7, backlit keyboard, fingerprint, 2yr warranty." },
  { id: "p5", slug: "5kg-jollof-rice-bag", name: "Golden Harvest Long Grain Rice 5kg", price: 9800, comparePrice: 12500, rating: 4.4, reviews: 5210, sold: 22000, image: img("photo-1586201375761-83865001e31c"), images: [img("photo-1586201375761-83865001e31c")], category: "Groceries", brand: "Golden Harvest", vendor: "FreshMart", vendorSlug: "freshmart", stock: 500, location: "Kano", flash: true, description: "Stone-free, parboiled long grain. Perfect for party jollof." },
  { id: "p6", slug: "nescafe-gold-blend", name: "Nescafé Gold Blend Instant Coffee 200g", price: 12500, comparePrice: 14900, rating: 4.6, reviews: 1120, sold: 5400, image: img("photo-1559056199-641a0ac8b55e"), images: [img("photo-1559056199-641a0ac8b55e")], category: "Groceries", brand: "Nescafé", vendor: "FreshMart", vendorSlug: "freshmart", stock: 300, location: "Lagos", description: "Rich aroma freeze-dried blend." },
  { id: "p7", slug: "nike-air-zoom-pegasus", name: "Nike Air Zoom Pegasus 40 Running Shoes", price: 78000, comparePrice: 95000, rating: 4.7, reviews: 845, sold: 1900, image: img("photo-1542291026-7eec264c27ff"), images: [img("photo-1542291026-7eec264c27ff"), img("photo-1595950653106-6c9ebd614d3a")], category: "Sports", brand: "Nike", vendor: "SportZone", vendorSlug: "sportzone", stock: 60, location: "Abuja", featured: true, description: "Responsive Zoom Air, breathable mesh, sizes 40–46." },
  { id: "p8", slug: "lg-43-smart-tv", name: 'LG 43" Full HD Smart TV with Magic Remote', price: 325000, comparePrice: 380000, rating: 4.6, reviews: 512, sold: 980, image: img("photo-1593359677879-a4bb92f829d1"), images: [img("photo-1593359677879-a4bb92f829d1")], category: "Electronics", brand: "LG", vendor: "ElectroWorld", vendorSlug: "electroworld", stock: 30, location: "Lagos", flash: true, featured: true, description: "webOS, Netflix/Youtube, DSTV-ready, wall bracket free." },
  { id: "p9", slug: "sheabutter-body-cream", name: "Natural Shea Butter Body Cream 500ml", price: 6500, comparePrice: 8500, rating: 4.8, reviews: 2330, sold: 12000, image: img("photo-1556228720-195a672e8a03"), images: [img("photo-1556228720-195a672e8a03")], category: "Beauty", brand: "Nubian Glow", vendor: "Nubian Glow", vendorSlug: "nubian-glow", stock: 250, location: "Accra", isNew: true, description: "Raw Ghana shea with vitamin E. For glowing skin." },
  { id: "p10", slug: "itel-powerbank-20000", name: "Itel 20000mAh Fast Charge Power Bank", price: 15500, comparePrice: 20000, rating: 4.3, reviews: 1890, sold: 7600, image: img("photo-1609091839311-d5365f9ff1c5"), images: [img("photo-1609091839311-d5365f9ff1c5")], category: "Electronics", brand: "Itel", vendor: "TechHub Lagos", vendorSlug: "techhub-lagos", stock: 200, location: "Lagos", flash: true, description: "22.5W fast charge, dual output, LED display." },
  { id: "p11", slug: "leather-handbag-lagos", name: "Handcrafted Leather Handbag — Lagos Tote", price: 32000, comparePrice: 45000, rating: 4.9, reviews: 210, sold: 850, image: img("photo-1584917865442-de89df76afd3"), images: [img("photo-1584917865442-de89df76afd3")], category: "Fashion", brand: "Lagos Leather", vendor: "Adire House", vendorSlug: "adire-house", stock: 40, location: "Lagos", isNew: true, featured: true, description: "Full-grain leather, handmade in Lagos." },
  { id: "p12", slug: "mixer-grinder-3in1", name: "Binatone 3-in-1 Mixer Grinder 500W", price: 42000, comparePrice: 52000, rating: 4.4, reviews: 760, sold: 2400, image: img("photo-1570222094114-d054a817e56b"), images: [img("photo-1570222094114-d054a817e56b")], category: "Home & Kitchen", brand: "Binatone", vendor: "ElectroWorld", vendorSlug: "electroworld", stock: 70, location: "Onitsha", description: "Dry/wet grinding, juicer attachment, 1yr warranty." },
];

export const VENDORS = [
  { name: "TechHub Lagos", slug: "techhub-lagos", rating: 4.7, products: 1240, followers: 45200, location: "Computer Village, Lagos", verified: true, banner: "from-teal-600 to-cyan-700", response: "98% • within an hour" },
  { name: "Adire House", slug: "adire-house", rating: 4.9, products: 320, followers: 12800, location: "Abeokuta", verified: true, banner: "from-orange-500 to-rose-600", response: "99% • within 30 mins" },
  { name: "FreshMart", slug: "freshmart", rating: 4.5, products: 2100, followers: 33400, location: "Kano", verified: true, banner: "from-green-600 to-emerald-700", response: "97% • within 2 hours" },
  { name: "ElectroWorld", slug: "electroworld", rating: 4.6, products: 860, followers: 18900, location: "Lagos", verified: true, banner: "from-indigo-600 to-violet-700", response: "96% • within an hour" },
  { name: "Nubian Glow", slug: "nubian-glow", rating: 4.8, products: 140, followers: 9600, location: "Accra", verified: true, banner: "from-amber-500 to-orange-600", response: "99% • within 20 mins" },
  { name: "SportZone", slug: "sportzone", rating: 4.6, products: 410, followers: 7200, location: "Abuja", verified: false, banner: "from-slate-700 to-slate-900", response: "94% • within 3 hours" },
];

export const REVIEWS = [
  { name: "Chiamaka O.", rating: 5, date: "2 days ago", title: "Original and fast!", body: "Ordered Monday, delivered Wednesday in Enugu. Well packaged, sealed, with receipt. Escrow made me trust it.", helpful: 42 },
  { name: "Tunde A.", rating: 5, date: "1 week ago", title: "Better than expected", body: "Quality is top notch. Rider called before arrival and I confirmed with OTP. Will buy again.", helpful: 28 },
  { name: "Fatima B.", rating: 4, date: "2 weeks ago", title: "Good, delivery took a day extra", body: "Product is genuine. Delivery was a day late due to rain but support kept me updated.", helpful: 15 },
];

export const QA = [
  { q: "Is this original?", a: "Yes — 100% genuine with 1-year warranty. Covered by Surftmarket Escrow Protection.", by: "Vendor • 2 days ago" },
  { q: "Do you deliver to Port Harcourt?", a: "Yes, 2–4 days standard, same-day within Lagos only.", by: "Vendor • 5 days ago" },
];
