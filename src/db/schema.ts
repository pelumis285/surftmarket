import {
  pgTable, text, varchar, integer, numeric, boolean, timestamp, jsonb, uuid, serial, pgEnum, index,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["customer","vendor","affiliate","rider","admin","support","finance","content","staff"]);
export const vendorStatusEnum = pgEnum("vendor_status", ["pending","approved","rejected","suspended"]);
export const productStatusEnum = pgEnum("product_status", ["draft","pending","published","rejected"]);
export const orderStatusEnum = pgEnum("order_status", ["placed","paid","accepted","preparing","ready","assigned","picked","out_for_delivery","delivered","completed","cancelled","returned","refunded"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending","approved","paid","rejected"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 160 }).unique(),
  phone: varchar("phone", { length: 40 }).unique(),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").default("customer").notNull(),
  avatar: text("avatar"),
  verified: boolean("verified").default(false),
  walletBalance: numeric("wallet_balance", { precision: 14, scale: 2 }).default("0"),
  addresses: jsonb("addresses").default([]),
  paymentMethods: jsonb("payment_methods").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ip: varchar("ip", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
  index("sessions_expires_at_idx").on(table.expiresAt),
]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  image: text("image"),
  icon: varchar("icon", { length: 40 }),
  parentId: integer("parent_id"),
  featured: boolean("featured").default(false),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).default("10"),
});

export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  name: varchar("name", { length: 140 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  logo: text("logo"),
  banner: text("banner"),
  description: text("description"),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("4.5"),
  reviewCount: integer("review_count").default(0),
  followers: integer("followers").default(0),
  status: vendorStatusEnum("status").default("pending").notNull(),
  verified: boolean("verified").default(false),
  location: varchar("location", { length: 160 }).default("Lagos, Nigeria"),
  businessHours: text("business_hours").default("Mon–Sat 8am–8pm"),
  shippingZones: jsonb("shipping_zones").default([]),
  returnPolicy: text("return_policy").default("7-day free returns."),
  vacationMode: boolean("vacation_mode").default(false),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).default("12"),
  cacNumber: varchar("cac_number", { length: 60 }),
  bankAccount: jsonb("bank_account").default({}),
  documents: jsonb("documents").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  description: text("description"),
  price: numeric("price", { precision: 14, scale: 2 }).notNull(),
  comparePrice: numeric("compare_price", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("NGN"),
  images: jsonb("images").default([]),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  brand: varchar("brand", { length: 100 }),
  sku: varchar("sku", { length: 60 }),
  stock: integer("stock").default(50),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("4.4"),
  reviewCount: integer("review_count").default(0),
  soldCount: integer("sold_count").default(0),
  variants: jsonb("variants").default([]),
  attributes: jsonb("attributes").default({}),
  seoTitle: varchar("seo_title", { length: 200 }),
  seoDesc: text("seo_desc"),
  status: productStatusEnum("status").default("published").notNull(),
  featured: boolean("featured").default(false),
  flashDeal: boolean("flash_deal").default(false),
  flashEndsAt: timestamp("flash_ends_at"),
  deliverySpeed: varchar("delivery_speed", { length: 40 }).default("standard"),
  location: varchar("location", { length: 120 }).default("Lagos"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  userName: varchar("user_name", { length: 120 }),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 160 }),
  body: text("body"),
  vendorReply: text("vendor_reply"),
  status: varchar("status", { length: 20 }).default("approved"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
  userName: varchar("user_name", { length: 120 }),
  question: text("question"),
  answer: text("answer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  type: varchar("type", { length: 20 }).default("percent"),
  value: numeric("value", { precision: 10, scale: 2 }).default("10"),
  minOrder: numeric("min_order", { precision: 12, scale: 2 }).default("0"),
  vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at"),
  usageLimit: integer("usage_limit").default(1000),
  used: integer("used").default(0),
  active: boolean("active").default(true),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 24 }).notNull().unique(),
  parentCode: varchar("parent_code", { length: 24 }),
  customerId: uuid("customer_id").references(() => users.id, { onDelete: "set null" }),
  guestEmail: varchar("guest_email", { length: 160 }),
  guestName: varchar("guest_name", { length: 120 }),
  vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  status: orderStatusEnum("status").default("placed").notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).default("0"),
  shipping: numeric("shipping", { precision: 14, scale: 2 }).default("0"),
  discount: numeric("discount", { precision: 14, scale: 2 }).default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).default("0"),
  commission: numeric("commission", { precision: 14, scale: 2 }).default("0"),
  escrowStatus: varchar("escrow_status", { length: 20 }).default("held"),
  paymentMethod: varchar("payment_method", { length: 40 }).default("paystack"),
  paymentRef: varchar("payment_ref", { length: 120 }),
  shippingAddress: jsonb("shipping_address").default({}),
  deliveryOption: varchar("delivery_option", { length: 30 }).default("standard"),
  timeline: jsonb("timeline").default([]),
  deliveryOtp: varchar("delivery_otp", { length: 10 }),
  affiliateCode: varchar("affiliate_code", { length: 40 }),
  trackingLink: varchar("tracking_link", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: varchar("product_name", { length: 220 }),
  image: text("image"),
  variant: varchar("variant", { length: 160 }),
  qty: integer("qty").default(1),
  price: numeric("price", { precision: 14, scale: 2 }).default("0"),
});

export const riders = pgTable("riders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  vehicleType: varchar("vehicle_type", { length: 40 }).default("bike"),
  plate: varchar("plate", { length: 40 }),
  license: varchar("license", { length: 80 }),
  status: varchar("status", { length: 20 }).default("pending"),
  online: boolean("online").default(false),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("4.8"),
  totalDeliveries: integer("total_deliveries").default(0),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  bank: jsonb("bank").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deliveries = pgTable("deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
  orderCode: varchar("order_code", { length: 24 }),
  riderId: uuid("rider_id").references(() => riders.id, { onDelete: "set null" }),
  status: varchar("status", { length: 30 }).default("unassigned"),
  pickup: text("pickup"),
  dropoff: text("dropoff"),
  distanceKm: numeric("distance_km", { precision: 8, scale: 2 }).default("5"),
  fee: numeric("fee", { precision: 12, scale: 2 }).default("1500"),
  earnings: numeric("earnings", { precision: 12, scale: 2 }).default("1200"),
  otp: varchar("otp", { length: 10 }),
  photoProof: text("photo_proof"),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  timeline: jsonb("timeline").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const affiliates = pgTable("affiliates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  status: varchar("status", { length: 20 }).default("pending"),
  rate: numeric("rate", { precision: 5, scale: 2 }).default("5"),
  tier: varchar("tier", { length: 30 }).default("bronze"),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  pendingEarnings: numeric("pending_earnings", { precision: 14, scale: 2 }).default("0"),
  approvedEarnings: numeric("approved_earnings", { precision: 14, scale: 2 }).default("0"),
  payoutDetails: jsonb("payout_details").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const affiliateClicks = pgTable("affiliate_clicks", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 40 }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  target: text("target"),
  ip: varchar("ip", { length: 60 }),
  converted: boolean("converted").default(false),
  orderCode: varchar("order_code", { length: 24 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  type: varchar("type", { length: 40 }),
  amount: numeric("amount", { precision: 14, scale: 2 }),
  ref: varchar("ref", { length: 120 }),
  status: varchar("status", { length: 20 }).default("completed"),
  meta: jsonb("meta").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payouts = pgTable("payouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  role: varchar("role", { length: 20 }).default("vendor"),
  amount: numeric("amount", { precision: 14, scale: 2 }),
  bank: jsonb("bank").default({}),
  status: payoutStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 160 }),
  subtitle: text("subtitle"),
  image: text("image"),
  link: text("link"),
  position: varchar("position", { length: 40 }).default("hero"),
  active: boolean("active").default(true),
});

export const settings = pgTable("settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: jsonb("value"),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorName: varchar("actor_name", { length: 120 }),
  action: varchar("action", { length: 120 }),
  entity: varchar("entity", { length: 60 }),
  entityId: varchar("entity_id", { length: 80 }),
  meta: jsonb("meta").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  orderCode: varchar("order_code", { length: 24 }),
  subject: varchar("subject", { length: 200 }),
  message: text("message"),
  status: varchar("status", { length: 20 }).default("open"),
  replies: jsonb("replies").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }),
  body: text("body"),
  type: varchar("type", { length: 40 }).default("order"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
