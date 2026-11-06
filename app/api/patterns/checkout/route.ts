import { z } from "zod";
import { getEnv } from "@/src/config/env";
import { sameOrigin } from "@/src/lib/security/validation";
import { polar } from "@/src/lib/billing/provider";
import { patternProductIds } from "@/src/lib/billing/patterns";
import { isLocale, localePath } from "@/src/lib/i18n/config";

/**
 * Guest checkout for digital patterns via Polar (Merchant of Record; global card payments, tax handled).
 * Files are delivered by Polar's "file downloads" benefit. The return URL never grants anything.
 */
export async function POST(request: Request) {
  const env = getEnv();
  if (!sameOrigin(request, env.APP_URL))
    return new Response(null, { status: 403 });
  const body = z
    .object({ key: z.string().max(40), lang: z.string() })
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return Response.json({ error: "invalid" }, { status: 400 });
  const product = patternProductIds(env.POLAR_PATTERN_PRODUCTS)[body.data.key];
  if (!env.POLAR_ACCESS_TOKEN || !product)
    return Response.json({ error: "not_configured" }, { status: 503 });
  const lang = isLocale(body.data.lang) ? body.data.lang : "az";
  try {
    const checkout = await polar().checkouts.create({
      products: [product],
      success_url: `${env.APP_URL}${localePath(lang, "patterns")}?checkout=returned`,
      return_url: `${env.APP_URL}${localePath(lang, "patterns")}`,
    });
    return Response.json({ url: checkout.url });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
