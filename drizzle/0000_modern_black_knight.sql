CREATE TYPE "public"."order_status" AS ENUM('placed', 'paid', 'accepted', 'preparing', 'ready', 'assigned', 'picked', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'returned', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'approved', 'paid', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'pending', 'published', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'vendor', 'affiliate', 'rider', 'admin', 'support', 'finance', 'content', 'staff');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TABLE "affiliate_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(40),
	"product_id" uuid,
	"target" text,
	"ip" varchar(60),
	"converted" boolean DEFAULT false,
	"order_code" varchar(24),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "affiliates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"code" varchar(40) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"rate" numeric(5, 2) DEFAULT '5',
	"tier" varchar(30) DEFAULT 'bronze',
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"pending_earnings" numeric(14, 2) DEFAULT '0',
	"approved_earnings" numeric(14, 2) DEFAULT '0',
	"payout_details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "affiliates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_name" varchar(120),
	"action" varchar(120),
	"entity" varchar(60),
	"entity_id" varchar(80),
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(160),
	"subtitle" text,
	"image" text,
	"link" text,
	"position" varchar(40) DEFAULT 'hero',
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"image" text,
	"icon" varchar(40),
	"parent_id" integer,
	"featured" boolean DEFAULT false,
	"commission_rate" numeric(5, 2) DEFAULT '10',
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"type" varchar(20) DEFAULT 'percent',
	"value" numeric(10, 2) DEFAULT '10',
	"min_order" numeric(12, 2) DEFAULT '0',
	"vendor_id" uuid,
	"expires_at" timestamp,
	"usage_limit" integer DEFAULT 1000,
	"used" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"order_code" varchar(24),
	"rider_id" uuid,
	"status" varchar(30) DEFAULT 'unassigned',
	"pickup" text,
	"dropoff" text,
	"distance_km" numeric(8, 2) DEFAULT '5',
	"fee" numeric(12, 2) DEFAULT '1500',
	"earnings" numeric(12, 2) DEFAULT '1200',
	"otp" varchar(10),
	"photo_proof" text,
	"lat" numeric(10, 6),
	"lng" numeric(10, 6),
	"timeline" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" varchar(160),
	"body" text,
	"type" varchar(40) DEFAULT 'order',
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"product_id" uuid,
	"product_name" varchar(220),
	"image" text,
	"variant" varchar(160),
	"qty" integer DEFAULT 1,
	"price" numeric(14, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(24) NOT NULL,
	"parent_code" varchar(24),
	"customer_id" uuid,
	"guest_email" varchar(160),
	"guest_name" varchar(120),
	"vendor_id" uuid,
	"status" "order_status" DEFAULT 'placed' NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT '0',
	"shipping" numeric(14, 2) DEFAULT '0',
	"discount" numeric(14, 2) DEFAULT '0',
	"total" numeric(14, 2) DEFAULT '0',
	"commission" numeric(14, 2) DEFAULT '0',
	"escrow_status" varchar(20) DEFAULT 'held',
	"payment_method" varchar(40) DEFAULT 'paystack',
	"payment_ref" varchar(120),
	"shipping_address" jsonb DEFAULT '{}'::jsonb,
	"delivery_option" varchar(30) DEFAULT 'standard',
	"timeline" jsonb DEFAULT '[]'::jsonb,
	"delivery_otp" varchar(10),
	"affiliate_code" varchar(40),
	"tracking_link" varchar(200),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"role" varchar(20) DEFAULT 'vendor',
	"amount" numeric(14, 2),
	"bank" jsonb DEFAULT '{}'::jsonb,
	"status" "payout_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid,
	"name" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"description" text,
	"price" numeric(14, 2) NOT NULL,
	"compare_price" numeric(14, 2),
	"currency" varchar(8) DEFAULT 'NGN',
	"images" jsonb DEFAULT '[]'::jsonb,
	"category_id" integer,
	"brand" varchar(100),
	"sku" varchar(60),
	"stock" integer DEFAULT 50,
	"rating" numeric(3, 2) DEFAULT '4.4',
	"review_count" integer DEFAULT 0,
	"sold_count" integer DEFAULT 0,
	"variants" jsonb DEFAULT '[]'::jsonb,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"seo_title" varchar(200),
	"seo_desc" text,
	"status" "product_status" DEFAULT 'published' NOT NULL,
	"featured" boolean DEFAULT false,
	"flash_deal" boolean DEFAULT false,
	"flash_ends_at" timestamp,
	"delivery_speed" varchar(40) DEFAULT 'standard',
	"location" varchar(120) DEFAULT 'Lagos',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"user_name" varchar(120),
	"question" text,
	"answer" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"user_id" uuid,
	"user_name" varchar(120),
	"rating" integer NOT NULL,
	"title" varchar(160),
	"body" text,
	"vendor_reply" text,
	"status" varchar(20) DEFAULT 'approved',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "riders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"vehicle_type" varchar(40) DEFAULT 'bike',
	"plate" varchar(40),
	"license" varchar(80),
	"status" varchar(20) DEFAULT 'pending',
	"online" boolean DEFAULT false,
	"rating" numeric(3, 2) DEFAULT '4.8',
	"total_deliveries" integer DEFAULT 0,
	"lat" numeric(10, 6),
	"lng" numeric(10, 6),
	"bank" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"value" jsonb
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"order_code" varchar(24),
	"subject" varchar(200),
	"message" text,
	"status" varchar(20) DEFAULT 'open',
	"replies" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" varchar(40),
	"amount" numeric(14, 2),
	"ref" varchar(120),
	"status" varchar(20) DEFAULT 'completed',
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(160),
	"phone" varchar(40),
	"password_hash" text,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"avatar" text,
	"verified" boolean DEFAULT false,
	"wallet_balance" numeric(14, 2) DEFAULT '0',
	"addresses" jsonb DEFAULT '[]'::jsonb,
	"payment_methods" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(140) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"logo" text,
	"banner" text,
	"description" text,
	"rating" numeric(3, 2) DEFAULT '4.5',
	"review_count" integer DEFAULT 0,
	"followers" integer DEFAULT 0,
	"status" "vendor_status" DEFAULT 'pending' NOT NULL,
	"verified" boolean DEFAULT false,
	"location" varchar(160) DEFAULT 'Lagos, Nigeria',
	"business_hours" text DEFAULT 'Mon–Sat 8am–8pm',
	"shipping_zones" jsonb DEFAULT '[]'::jsonb,
	"return_policy" text DEFAULT '7-day free returns.',
	"vacation_mode" boolean DEFAULT false,
	"commission_rate" numeric(5, 2) DEFAULT '12',
	"cac_number" varchar(60),
	"bank_account" jsonb DEFAULT '{}'::jsonb,
	"documents" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vendors_slug_unique" UNIQUE("slug")
);
