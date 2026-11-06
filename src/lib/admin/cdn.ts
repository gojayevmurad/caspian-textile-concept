import "server-only";
import { getEnv } from "@/src/config/env";
import { logger } from "@/src/lib/logger";

/** Purges the Cloudflare cache after content changes (token must be scoped to Cache Purge only). */
export async function purgeCdn() {
  const env = getEnv();
  if (!env.CLOUDFLARE_ZONE_ID || !env.CLOUDFLARE_API_TOKEN)
    return { skipped: true };
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purge_everything: true }),
    },
  ).catch((e) => {
    logger.warn({ err: String(e) }, "CDN purge failed");
    return null;
  });
  return { ok: Boolean(res?.ok) };
}
