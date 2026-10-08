import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { affiliates, riders, users, vendors } from "@/db/schema";
import {
  clearRateLimit,
  clearSessionCookie,
  consumeRateLimit,
  createSession,
  currentUser,
  destroySession,
  hashPassword,
  recordAudit,
  requestIp,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { slugify } from "@/lib/format";
import { authActionSchema, firstValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase();
}

function normalizePhone(phone?: string) {
  return phone?.replace(/[\s()-]/g, "");
}

function errorResponse(error: string, status: number, code: string) {
  return NextResponse.json({ ok: false, error, code }, { status });
}

function safeUser(user: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: typeof users.$inferSelect.role;
  verified: boolean | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    verified: Boolean(user.verified),
  };
}

function databaseErrorResponse(error: unknown) {
  const pgError = error as { code?: string };
  if (pgError.code === "23505") {
    return errorResponse("An account already exists for that email or phone", 409, "ACCOUNT_EXISTS");
  }
  console.error("Authentication request failed", error);
  return errorResponse("Authentication is temporarily unavailable", 503, "AUTH_UNAVAILABLE");
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser(request);
    if (!user) return errorResponse("Not authenticated", 401, "UNAUTHENTICATED");
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => ({}));
  const parsed = authActionSchema.safeParse({ ...raw, action: raw.action ?? "login" });
  if (!parsed.success) {
    return errorResponse(firstValidationError(parsed.error), 400, "INVALID_REQUEST");
  }

  if (parsed.data.action === "logout") {
    try {
      const user = await currentUser(request);
      await destroySession(request);
      if (user) {
        await recordAudit({
          actorId: user.id,
          actorName: user.name,
          action: "auth.logout",
          entity: "session",
          meta: { ip: requestIp(request) },
        });
      }
      const response = NextResponse.json({ ok: true });
      clearSessionCookie(response);
      return response;
    } catch (error) {
      return databaseErrorResponse(error);
    }
  }

  const email = normalizeEmail(parsed.data.email);
  const phone = normalizePhone(parsed.data.phone);

  if (parsed.data.action === "register") {
    try {
      if (email) {
        const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        if (existing) return errorResponse("An account already exists for that email", 409, "ACCOUNT_EXISTS");
      }
      if (phone) {
        const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
        if (existing) return errorResponse("An account already exists for that phone", 409, "ACCOUNT_EXISTS");
      }

      const passwordHash = await hashPassword(parsed.data.password);
      const [created] = await db.insert(users).values({
        name: parsed.data.name,
        email,
        phone,
        passwordHash,
        role: parsed.data.role,
      }).returning();

      if (parsed.data.role === "vendor") {
        const baseSlug = slugify(parsed.data.name) || "vendor";
        await db.insert(vendors).values({
          userId: created.id,
          name: parsed.data.name,
          slug: `${baseSlug}-${randomBytes(3).toString("hex")}`,
          cacNumber: parsed.data.cac,
          bankAccount: parsed.data.bank ? { details: parsed.data.bank } : {},
          status: "pending",
        });
      } else if (parsed.data.role === "rider") {
        await db.insert(riders).values({
          userId: created.id,
          vehicleType: parsed.data.vehicle ?? "bike",
          bank: parsed.data.bank ? { details: parsed.data.bank } : {},
          status: "pending",
        });
      } else if (parsed.data.role === "affiliate") {
        await db.insert(affiliates).values({
          userId: created.id,
          code: `AFF-${randomBytes(4).toString("hex").toUpperCase()}`,
          payoutDetails: parsed.data.bank ? { details: parsed.data.bank } : {},
          status: "pending",
        });
      }

      const session = await createSession(created.id, request);
      await recordAudit({
        actorId: created.id,
        actorName: created.name,
        action: "auth.register",
        entity: "user",
        entityId: created.id,
        meta: { role: created.role, ip: requestIp(request) },
      });

      const pending = created.role === "vendor" || created.role === "rider" || created.role === "affiliate";
      const response = NextResponse.json({
        ok: true,
        user: safeUser(created),
        status: pending ? "pending" : "active",
        message: pending ? `${created.role} application submitted for review` : "Account created",
      }, { status: 201 });
      setSessionCookie(response, session.token, session.expiresAt);
      return response;
    } catch (error) {
      return databaseErrorResponse(error);
    }
  }

  const identifier = email ?? phone ?? "unknown";
  const rateLimitKey = `login:${requestIp(request)}:${identifier}`;
  const rateLimit = consumeRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    const response = errorResponse("Too many login attempts. Try again later.", 429, "RATE_LIMITED");
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  try {
    const [account] = email
      ? await db.select().from(users).where(eq(users.email, email)).limit(1)
      : await db.select().from(users).where(eq(users.phone, phone!)).limit(1);

    if (!account?.passwordHash || !await verifyPassword(parsed.data.password, account.passwordHash)) {
      return errorResponse("Invalid email, phone, or password", 401, "INVALID_CREDENTIALS");
    }

    clearRateLimit(rateLimitKey);
    const session = await createSession(account.id, request);
    await recordAudit({
      actorId: account.id,
      actorName: account.name,
      action: "auth.login",
      entity: "session",
      meta: { ip: requestIp(request) },
    });

    const response = NextResponse.json({ ok: true, user: safeUser(account), message: "Signed in" });
    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
