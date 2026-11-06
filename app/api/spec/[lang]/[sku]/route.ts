import { and, eq } from "drizzle-orm";
import { isLocale } from "@/src/lib/i18n/config";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { getCategories, getProduct } from "@/src/lib/catalog/queries";
import { buildSpecSheet } from "@/src/lib/pdf/spec-sheet";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ lang: string; sku: string }> },
) {
  const { lang, sku } = await ctx.params;
  if (!isLocale(lang)) return new Response("Not found", { status: 404 });
  const [row] = await db()
    .select({ slug: s.productTranslation.slug })
    .from(s.product)
    .innerJoin(
      s.productTranslation,
      and(
        eq(s.productTranslation.productId, s.product.id),
        eq(s.productTranslation.locale, lang),
      ),
    )
    .where(
      and(
        eq(s.product.sku, decodeURIComponent(sku)),
        eq(s.product.status, "published"),
      ),
    );
  const product = row ? await getProduct(lang, row.slug) : null;
  if (!product) return new Response("Not found", { status: 404 });
  const pdf = await buildSpecSheet(lang, product, await getCategories(lang));
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${product.sku}-${lang}.pdf"`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
