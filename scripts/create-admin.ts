import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/lib/password";

async function main() {
  const name = process.env.ADMIN_NAME?.trim() || "Surftmarket Admin";
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters");
  }

  const passwordHash = await hashPassword(password);
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (existing) {
    await db.update(users).set({ name, passwordHash, role: "admin", verified: true, updatedAt: new Date() }).where(eq(users.id, existing.id));
    console.log(`Updated admin account: ${email}`);
    return;
  }

  await db.insert(users).values({ name, email, passwordHash, role: "admin", verified: true });
  console.log(`Created admin account: ${email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
