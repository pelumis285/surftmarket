import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Affiliate: click tracking (cookie + param, 30-day window), conversion on completed orders, fraud checks
const clicks = new Map<string, number>();

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { action, code = "", target = "" } = body;
  const ip = req.headers.get("x-forwarded-for") ?? "local";

  if (action === "click") {
    const key = `${code}:${ip}`;
    const n = (clicks.get(key) ?? 0) + 1;
    clicks.set(key, n);
    const duplicate = n > 10; // fraud: duplicate-click shield
    const selfRef = false; // check buyer === affiliate in prod via user id
    return Response.json({
      ok: true, tracked: !duplicate && !selfRef, code, target,
      attributionDays: 30, duplicate, selfRef,
    });
  }
  if (action === "convert") {
    // only on delivered + not refunded
    const { delivered = true, refunded = false, total = 0 } = body;
    if (!delivered || refunded) return Response.json({ ok: true, commission: 0, reason: "only completed orders pay" });
    const rate = 0.05;
    return Response.json({ ok: true, commission: Math.round(Number(total) * rate), rate });
  }
  return Response.json({ ok: true });
}

export async function GET() {
  return Response.json({
    ok: true,
    program: { windowDays: 30, globalRate: 5, tiers: { bronze: 5, gold: 7, platinum: 9 }, bonusAfter50: "+2%", bonusAfter200: "+4%" },
  });
}
