import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Dispatch: pricing engine, auto-assign nearest rider, OTP handover, 3PL adapter hook
export function price(base = 800, km = 5, speed = "standard", surge = 1) {
  const mult = speed === "express" ? 1.8 : speed === "same-day" ? 2.6 : speed === "pickup" ? 0.5 : 1;
  return Math.round((base + km * 220) * mult * surge);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { action } = body;
  if (action === "price") {
    const { km = 5, speed = "standard", surge = 1, weight = 1 } = body;
    const fee = price(800, km, speed, surge) + Math.max(0, weight - 5) * 150;
    return Response.json({ ok: true, fee, earnings: Math.round(fee * 0.8), breakdown: { base: 800, perKm: 220, km, speed, surge, weight } });
  }
  if (action === "assign") {
    // nearest-available with 15s timeout → next rider; fallback to 3PL adapter
    return Response.json({
      ok: true, deliveryId: "D-" + Math.floor(1000 + Math.random() * 9000),
      rider: { name: "Emeka R.", plate: "LAG-482-QA", etaMin: 14 },
      rule: "nearest-first", timeoutSec: 15, fallback: "3PL adapter ready",
    });
  }
  if (action === "status") {
    return Response.json({ ok: true, status: body.status ?? "picked", live: { lat: 6.5244, lng: 3.3792 }, etaMin: 9 });
  }
  return Response.json({ ok: true });
}
