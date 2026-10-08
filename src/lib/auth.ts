import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, sessions, userRoleEnum, users } from "@/db/schema";
export { hashPassword, verifyPassword } from "@/lib/password";

const SESSION_COOKIE = "surftmarket_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export type UserRole = (typeof userRoleEnum.enumValues)[number];

export type AuthUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  verified: boolean;
};

type RateLimitEntry = { count: number; resetAt: number };
const globalForAuth = globalThis as typeof globalThis & {
  __surftmarketAuthRateLimits?: Map<string, RateLimitEntry>;
};
const rateLimits = globalForAuth.__surftmarketAuthRateLimits ?? new Map<string, RateLimitEntry>();
if (process.env.NODE_ENV !== "production") globalForAuth.__surftmarketAuthRateLimits = rateLimits;

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function requestIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export function consumeRateLimit(key: string, limit = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clearRateLimit(key: string) {
  rateLimits.delete(key);
}

export async function createSession(userId: string, request: NextRequest) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(sessions).values({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
    ip: requestIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  return { token, expiresAt };
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function destroySession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)));
}

export async function currentUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [record] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      verified: users.verified,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(
      eq(sessions.tokenHash, hashSessionToken(token)),
      gt(sessions.expiresAt, new Date()),
    ))
    .limit(1);

  return record ? { ...record, verified: Boolean(record.verified) } : null;
}

export function hasRole(user: AuthUser, roles: readonly UserRole[]) {
  return roles.includes(user.role);
}

export async function recordAudit(entry: {
  actorId?: string;
  actorName?: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    actorId: entry.actorId,
    actorName: entry.actorName,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    meta: entry.meta ?? {},
  });
}
