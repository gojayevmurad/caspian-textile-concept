// Database access for operator scripts (outside Next.js; avoids "server-only" modules).
import { existsSync } from "node:fs";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../src/lib/db/schema";

if (existsSync(".env.local") && !process.env.DATABASE_URL)
  process.loadEnvFile(".env.local");

export function scriptDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString: url, max: 4 });
  return { db: drizzle(pool, { schema }), pool, schema };
}
