import { isLocale } from "@/src/lib/i18n/config";
import { searchProducts } from "@/src/lib/catalog/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 80);
  const lang = url.searchParams.get("lang") ?? "az";
  if (!isLocale(lang) || q.trim().length < 2)
    return Response.json({ results: [] });
  const results = await searchProducts(lang, q, 12);
  return Response.json(
    {
      results: results.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        image:
          p.image?.variants.find((v) => v.format === "webp" && v.width <= 360)
            ?.path ?? null,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
  );
}
