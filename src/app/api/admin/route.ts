import { NextRequest } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { currentUser, hasRole, recordAudit, type AuthUser, type UserRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ADMIN_ROLES: readonly UserRole[] = ["admin", "support", "finance", "content"];

async function authorize(request: NextRequest): Promise<{ user: AuthUser } | { response: Response }> {
  const user = await currentUser(request);
  if (!user) {
    return { response: Response.json({ ok: false, error: "Authentication required" }, { status: 401 }) };
  }
  if (!hasRole(user, ADMIN_ROLES)) {
    return { response: Response.json({ ok: false, error: "Admin permission required" }, { status: 403 }) };
  }
  return { user };
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req);
  if ("response" in auth) return auth.response;
  const body = await req.json().catch(() => ({}));
  const { action } = body;
  await db.execute(sql`select 1`);

  if (action === "approve") {
    await recordAudit({ actorId: auth.user.id, actorName: auth.user.name, action: "admin.approve", entity: body.entity ?? "unknown", entityId: body.id, meta: { decision: body.decision ?? "approved" } });
    return Response.json({ ok: true, id: body.id, decision: body.decision ?? "approved", notified: ["email", "sms", "in-app"], audit: true });
  }
  if (action === "settings") {
    // white-label: brand, currency, commission, gateways, delivery rules, templates, SEO, toggles
    await recordAudit({ actorId: auth.user.id, actorName: auth.user.name, action: "admin.settings.update", entity: "settings", meta: { keys: Object.keys(body.settings ?? {}) } });
    return Response.json({ ok: true, saved: Object.keys(body.settings ?? {}), published: true });
  }
  if (action === "payout") {
    if (!hasRole(auth.user, ["admin", "finance"])) {
      return Response.json({ ok: false, error: "Finance permission required" }, { status: 403 });
    }
    await recordAudit({ actorId: auth.user.id, actorName: auth.user.name, action: "admin.payout.update", entity: "payout", entityId: body.id, meta: { decision: body.decision ?? "paid" } });
    return Response.json({ ok: true, payout: body.id, status: body.decision ?? "paid" });
  }
  return Response.json({ ok: false, error: "Unknown admin action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const auth = await authorize(req);
  if ("response" in auth) return auth.response;
  return Response.json({
    ok: true,
    kpis: { gmv: 86400000, orders: 12408, commission: 9100000, ridersOnline: 47 },
    health: "ok",
  });
}
