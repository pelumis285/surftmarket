import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { consumeRateLimit, currentUser, recordAudit, requestIp } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set([
  "Order & delivery",
  "Payment & coupon",
  "Return & refund",
  "Account & security",
  "Vendor support",
  "Affiliate or rider",
  "Something else",
]);

function errorResponse(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return errorResponse("Sign in to view your support requests.", 401);
  const items = await db.select({
    id: tickets.id,
    orderCode: tickets.orderCode,
    subject: tickets.subject,
    message: tickets.message,
    status: tickets.status,
    replies: tickets.replies,
    createdAt: tickets.createdAt,
  }).from(tickets).where(eq(tickets.userId, user.id)).orderBy(desc(tickets.createdAt));
  return NextResponse.json({ ok: true, tickets: items.map((ticket) => ({ ...ticket, reference: `T-${ticket.id.slice(0, 8).toUpperCase()}` })) });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return errorResponse("Invalid support request.", 400);
  const user = await currentUser(request);
  const name = clean(body.name, 120);
  const email = clean(body.email, 160).toLowerCase();
  const category = clean(body.category, 40);
  const orderCode = clean(body.orderCode, 24).toUpperCase().replace(/\s+/g, "");
  const subject = clean(body.subject, 160);
  const message = clean(body.message, 3000);

  if (name.length < 2) return errorResponse("Enter your name.", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse("Enter a valid email address.", 400);
  if (!CATEGORIES.has(category)) return errorResponse("Select a valid help category.", 400);
  if (subject.length < 4) return errorResponse("Enter a short subject.", 400);
  if (message.length < 10) return errorResponse("Tell us a little more about the problem.", 400);
  if (orderCode && !/^[A-Z0-9-]{5,24}$/.test(orderCode)) return errorResponse("Enter a valid order code.", 400);

  const rateLimit = consumeRateLimit(`support:${requestIp(request)}:${user?.id ?? email}`, 4, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    const response = errorResponse("Too many support requests. Please try again later.", 429);
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  try {
    const [created] = await db.insert(tickets).values({
      userId: user?.id,
      orderCode: orderCode || null,
      subject: `[${category}] ${subject}`,
      message: `${message}\n\nContact: ${name} <${email}>`,
      status: "open",
      replies: [],
    }).returning({ id: tickets.id, status: tickets.status, createdAt: tickets.createdAt });
    const reference = `T-${created.id.slice(0, 8).toUpperCase()}`;
    await recordAudit({
      actorId: user?.id,
      actorName: user?.name ?? name,
      action: "support.ticket.create",
      entity: "ticket",
      entityId: created.id,
      meta: { reference, category, orderCode: orderCode || null },
    });
    return NextResponse.json({ ok: true, reference, status: created.status, createdAt: created.createdAt }, { status: 201 });
  } catch (error) {
    console.error("Support request failed", error);
    return errorResponse("Support is temporarily unavailable. Please try again.", 503);
  }
}
