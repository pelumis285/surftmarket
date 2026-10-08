import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await db.execute(sql`
      INSERT INTO settings(key, value) VALUES
      ('brand', '{"name":"surftmarket","color":"#ea580c","currency":"NGN","lang":"en"}'),
      ('commission', '{"global":10,"electronics":8,"fashion":12}'),
      ('delivery', '{"base":800,"perKm":220,"surge":1}'),
      ('affiliate', '{"windowDays":30,"rate":5}')
      ON CONFLICT (key) DO NOTHING;
    `);
    await db.execute(sql`
      INSERT INTO categories(name, slug, icon, featured) VALUES
      ('Phones & Tablets','phones-tablets','📱',true),
      ('Electronics','electronics','🔌',true),
      ('Fashion','fashion','👗',true),
      ('Groceries','groceries','🛒',true),
      ('Computing','computing','💻',false)
      ON CONFLICT (slug) DO NOTHING;
    `);
    await db.execute(sql`
      INSERT INTO coupons(code, type, value, min_order) VALUES
      ('SURFT10','percent',10,5000),
      ('WELCOME500','flat',500,2000)
      ON CONFLICT (code) DO NOTHING;
    `);
    return Response.json({ ok: true, seeded: ["settings", "categories", "coupons"] });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: true, usage: "POST to seed demo data" });
}
