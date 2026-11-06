import { sql } from "drizzle-orm";
import { db } from "@/src/lib/db";
import { getEnv } from "@/src/config/env";
export const dynamic = "force-dynamic";
// Never cache at the CDN: monitoring must see the origin's real state.
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  try {
    getEnv();
    if (process.env.DATABASE_URL) await db().execute(sql`select 1`);
    return Response.json(
      {
        status: "ok",
        database: process.env.DATABASE_URL ? "connected" : "unconfigured",
      },
      { headers },
    );
  } catch {
    return Response.json({ status: "unhealthy" }, { status: 503, headers });
  }
}
