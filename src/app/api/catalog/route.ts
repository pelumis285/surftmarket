import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, products, vendors } from "@/db/schema";
import { currentUser, hasRole, recordAudit } from "@/lib/auth";
import { CATEGORIES, PRODUCTS, type DemoProduct } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: string;
  comparePrice: string | null;
  images: unknown;
  brand: string | null;
  stock: number | null;
  rating: string | null;
  reviewCount: number | null;
  soldCount: number | null;
  featured: boolean | null;
  flashDeal: boolean | null;
  location: string | null;
  status: "draft" | "pending" | "published" | "rejected";
  category: string | null;
  vendor: string | null;
  vendorSlug: string | null;
};

function responseError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

function productImages(value: unknown) {
  return Array.isArray(value) ? value.filter((image): image is string => typeof image === "string" && image.length > 0).slice(0, 8) : [];
}

function toCatalogProduct(row: ProductRow): DemoProduct & { status: string } {
  const images = productImages(row.images);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || `${row.name} from ${row.vendor ?? "a verified Surftmarket vendor"}.`,
    price: Number(row.price),
    ...(row.comparePrice ? { comparePrice: Number(row.comparePrice) } : {}),
    image: images[0] ?? PRODUCTS[0].image,
    images: images.length ? images : [PRODUCTS[0].image],
    category: row.category ?? "Other",
    brand: row.brand ?? "Unbranded",
    vendor: row.vendor ?? "Surftmarket Vendor",
    vendorSlug: row.vendorSlug ?? "surftmarket-vendor",
    stock: Number(row.stock ?? 0),
    rating: Number(row.rating ?? 0),
    reviews: Number(row.reviewCount ?? 0),
    sold: Number(row.soldCount ?? 0),
    location: row.location ?? "Nigeria",
    featured: Boolean(row.featured),
    flash: Boolean(row.flashDeal),
    status: row.status,
  };
}

async function databaseProducts(where?: ReturnType<typeof eq>) {
  return db.select({
    id: products.id,
    slug: products.slug,
    name: products.name,
    description: products.description,
    price: products.price,
    comparePrice: products.comparePrice,
    images: products.images,
    brand: products.brand,
    stock: products.stock,
    rating: products.rating,
    reviewCount: products.reviewCount,
    soldCount: products.soldCount,
    featured: products.featured,
    flashDeal: products.flashDeal,
    location: products.location,
    status: products.status,
    category: categories.name,
    vendor: vendors.name,
    vendorSlug: vendors.slug,
  }).from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .where(where)
    .orderBy(desc(products.createdAt));
}

function matches(product: DemoProduct, q: string, category: string, flash: boolean) {
  const needle = q.trim().toLowerCase();
  const searchable = `${product.name} ${product.brand} ${product.category} ${product.vendor}`.toLowerCase();
  return (!needle || searchable.includes(needle))
    && (!category || category === "All" || product.category.toLowerCase() === category.toLowerCase())
    && (!flash || Boolean(product.comparePrice && product.comparePrice > product.price));
}

async function vendorForUser(userId: string) {
  const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, userId)).limit(1);
  return vendor ?? null;
}

async function categoryForSlug(slug: string) {
  const definition = CATEGORIES.find((category) => category.slug === slug);
  if (!definition) return null;
  await db.insert(categories).values({
    name: definition.name,
    slug: definition.slug,
    icon: definition.icon,
    image: definition.image,
    featured: true,
  }).onConflictDoNothing({ target: categories.slug });
  const [category] = await db.select().from(categories).where(eq(categories.slug, definition.slug)).limit(1);
  return category ?? null;
}

function cleanDraft(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim().slice(0, 200);
  const brand = String(body.brand ?? "").trim().slice(0, 100);
  const description = String(body.description ?? "").trim().slice(0, 5000);
  const price = Number(body.price);
  const stock = Number(body.stock);
  const categorySlug = String(body.categorySlug ?? "").trim();
  const images = productImages(body.images);
  const requestedStatus = String(body.status ?? "published");
  const status = requestedStatus === "published" ? "published" as const : "draft" as const;
  if (name.length < 2) return { error: "Enter a product name." } as const;
  if (!brand) return { error: "Enter the product brand." } as const;
  if (!Number.isFinite(price) || price <= 0 || price > 100_000_000) return { error: "Enter a valid product price." } as const;
  if (!Number.isInteger(stock) || stock < 0 || stock > 10_000_000) return { error: "Enter a valid whole-number stock quantity." } as const;
  if (!CATEGORIES.some((category) => category.slug === categorySlug)) return { error: "Select a valid product category." } as const;
  if (!images.length) return { error: "Add at least one product image." } as const;
  return { name, brand, description, price, stock, categorySlug, images, status } as const;
}

function productSlug(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 170) || "product";
  return `${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "public";
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("cat") ?? "";
  const slug = searchParams.get("slug");
  const flash = searchParams.get("flash") === "1";
  const type = searchParams.get("type") ?? "products";

  try {
    if (scope === "vendor") {
      const user = await currentUser(request);
      if (!user) return responseError("Sign in to manage products.", 401);
      if (!hasRole(user, ["vendor", "admin"])) return responseError("Only vendors can manage products.", 403);
      const vendor = await vendorForUser(user.id);
      if (!vendor) return responseError("Vendor profile not found.", 404);
      const items = (await databaseProducts(eq(products.vendorId, vendor.id))).map(toCatalogProduct);
      return NextResponse.json({ ok: true, items, categories: CATEGORIES }, { headers: { "Cache-Control": "no-store" } });
    }

    const saved = (await databaseProducts(eq(products.status, "published"))).map(toCatalogProduct);
    const combined = [...saved, ...PRODUCTS.filter((product) => !saved.some((item) => item.slug === product.slug))];
    const items = combined.filter((product) => (!slug || product.slug === slug) && matches(product, q, category, flash));
    return NextResponse.json({
      ok: true,
      items: type === "suggest" ? items.slice(0, 6) : items,
      categories: CATEGORIES,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Catalog lookup failed", error);
    return responseError("The product catalogue is temporarily unavailable.", 503);
  }
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return responseError("Sign in to manage products.", 401);
  if (!hasRole(user, ["vendor", "admin"])) return responseError("Only vendors can manage products.", 403);
  const vendor = await vendorForUser(user.id);
  if (!vendor) return responseError("Vendor profile not found.", 404);
  if (vendor.status !== "approved") return responseError("Your vendor account must be approved before publishing products.", 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return responseError("Invalid product request.", 400);
  const action = String(body.action ?? "create");

  if (action === "sync") {
    const incoming = Array.isArray(body.products) ? body.products.slice(0, 30) : [];
    for (const entry of incoming) {
      if (!entry || typeof entry !== "object") continue;
      const source = entry as Record<string, unknown>;
      const categoryName = String(source.category ?? "");
      const categorySlug = CATEGORIES.find((item) => item.name === categoryName)?.slug ?? String(source.categorySlug ?? "");
      const draft = cleanDraft({ ...source, categorySlug });
      if ("error" in draft) continue;
      const category = await categoryForSlug(draft.categorySlug);
      if (!category) continue;
      const requestedSlug = String(source.slug ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 210);
      await db.insert(products).values({
        vendorId: vendor.id,
        categoryId: category.id,
        name: draft.name,
        slug: requestedSlug || productSlug(draft.name),
        description: draft.description,
        price: String(draft.price),
        images: draft.images,
        brand: draft.brand,
        stock: draft.stock,
        status: draft.status,
        location: vendor.location,
        rating: "0",
      }).onConflictDoNothing({ target: products.slug });
    }
    const items = (await databaseProducts(eq(products.vendorId, vendor.id))).map(toCatalogProduct);
    return NextResponse.json({ ok: true, items });
  }

  const draft = cleanDraft(body);
  if ("error" in draft && draft.error) return responseError(draft.error, 400);
  const category = await categoryForSlug(draft.categorySlug);
  if (!category) return responseError("Select a valid product category.", 400);

  if (action === "create") {
    const [created] = await db.insert(products).values({
      vendorId: vendor.id,
      categoryId: category.id,
      name: draft.name,
      slug: productSlug(draft.name),
      description: draft.description,
      price: String(draft.price),
      images: draft.images,
      brand: draft.brand,
      stock: draft.stock,
      status: draft.status,
      location: vendor.location,
      rating: "0",
    }).returning({ id: products.id });
    const [item] = (await databaseProducts(eq(products.id, created.id))).map(toCatalogProduct);
    await recordAudit({ actorId: user.id, actorName: user.name, action: "vendor.product.create", entity: "product", entityId: created.id, meta: { category: category.name, status: draft.status } });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  }

  if (action === "update") {
    const productId = String(body.id ?? "");
    const [updated] = await db.update(products).set({
      categoryId: category.id,
      name: draft.name,
      description: draft.description,
      price: String(draft.price),
      images: draft.images,
      brand: draft.brand,
      stock: draft.stock,
      status: draft.status,
    }).where(and(eq(products.id, productId), eq(products.vendorId, vendor.id))).returning({ id: products.id });
    if (!updated) return responseError("Product not found.", 404);
    const [item] = (await databaseProducts(eq(products.id, updated.id))).map(toCatalogProduct);
    await recordAudit({ actorId: user.id, actorName: user.name, action: "vendor.product.update", entity: "product", entityId: updated.id, meta: { category: category.name, status: draft.status } });
    return NextResponse.json({ ok: true, item });
  }

  return responseError("Unknown product action.", 400);
}
