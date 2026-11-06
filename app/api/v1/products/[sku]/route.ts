import { getCatalog, getProduct } from "@/src/lib/catalog/queries";
import { error, headers, langOf, productDto } from "@/src/lib/api/v1";
import { defaultSizes } from "@/src/lib/catalog/sizes";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ sku: string }> },
) {
  const { sku } = await ctx.params;
  const lang = langOf(new URL(request.url));
  const summary = (await getCatalog(lang)).find(
    (p) => p.sku === decodeURIComponent(sku),
  );
  if (!summary) return error(404, "Product not found");
  const detail = await getProduct(lang, summary.slug);
  if (!detail) return error(404, "Product not found");
  return Response.json(
    {
      ...productDto(summary, lang),
      descriptionHtml: detail.descriptionHtml,
      sizes: detail.sizes.length
        ? detail.sizes
        : defaultSizes(detail.categories),
      standards: detail.standards,
      minOrder: detail.minOrder,
      leadTimeDays: detail.leadTimeDays,
      gallery: detail.gallery
        .map(
          (g) =>
            g.variants
              .filter((v) => v.format === "webp")
              .sort((a, b) => b.width - a.width)[0]?.path,
        )
        .filter(Boolean),
      updatedAt: detail.updatedAt,
    },
    { headers },
  );
}
