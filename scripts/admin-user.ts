// Create or update an operator account. Never runs automatically.
//   pnpm admin:user --email you@example.com --name "Your Name" [--role admin]
//   pnpm admin:create-demo            (read-only demo_viewer account for recruiters)
// The password is generated, printed ONCE to this terminal and never logged elsewhere.
import { randomBytes, randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { scriptDb } from "./lib/db";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    role: { type: "string", default: "admin" },
    demo: { type: "boolean", default: false },
    "rotate-password": { type: "boolean", default: false },
  },
});

const demo = values.demo;
const role = demo ? "demo_viewer" : values.role;
if (role !== "admin" && role !== "demo_viewer")
  throw new Error("--role must be admin or demo_viewer");
const email = (values.email ?? (demo ? process.env.DEMO_EMAIL : undefined))
  ?.trim()
  .toLowerCase();
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
  throw new Error(
    demo
      ? "Set --email or DEMO_EMAIL for the demo account"
      : "--email is required",
  );
const name = values.name ?? (demo ? "Demo (read-only)" : email);

// Readable but strong: 4 groups of 5 base32 chars (~100 bits).
const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
const bytes = randomBytes(20);
const password = Array.from(bytes, (b) => alphabet[b % alphabet.length])
  .join("")
  .replace(/(.{5})(?=.)/g, "$1-");

const { db, pool, schema } = scriptDb();
try {
  const [existing] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, email));
  const userId = existing?.id ?? randomUUID();
  const hash = await hashPassword(password);
  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(schema.user)
        .set({ role, name, emailVerified: true, updatedAt: new Date() })
        .where(eq(schema.user.id, userId));
    } else {
      await tx
        .insert(schema.user)
        .values({ id: userId, email, name, role, emailVerified: true });
    }
    const [credential] = await tx
      .select()
      .from(schema.account)
      .where(
        and(
          eq(schema.account.userId, userId),
          eq(schema.account.providerId, "credential"),
        ),
      );
    if (!credential) {
      await tx.insert(schema.account).values({
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: "credential",
        password: hash,
      });
    } else if (values["rotate-password"] || !existing) {
      await tx
        .update(schema.account)
        .set({ password: hash, updatedAt: new Date() })
        .where(eq(schema.account.id, credential.id));
    }
    // Rotating credentials signs out every existing session of that user.
    if (values["rotate-password"])
      await tx.delete(schema.session).where(eq(schema.session.userId, userId));
  });
  const printed = !existing || values["rotate-password"];
  console.log(`${existing ? "Updated" : "Created"} ${role} account: ${email}`);
  if (printed) console.log(`Password (shown once): ${password}`);
  else
    console.log(
      "Password unchanged (use --rotate-password to issue a new one).",
    );
} finally {
  await pool.end();
}
