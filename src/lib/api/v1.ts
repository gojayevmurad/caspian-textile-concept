import { isLocale, localePath, type Locale } from "@/src/lib/i18n/config";
import type { ProductSummary } from "@/src/lib/catalog/queries";
import { siteUrl } from "@/src/lib/seo/metadata";

export const headers = {
  "Cache-Control":
    "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
};
export const langOf = (url: URL): Locale => {
  const l = url.searchParams.get("lang");
  return isLocale(l) ? l : "az";
};
export const error = (status: number, message: string) =>
  Response.json({ error: { status, message } }, { status, headers });

export function productDto(p: ProductSummary, locale: Locale) {
  const base = siteUrl();
  return {
    sku: p.sku,
    name: p.name,
    summary: p.summary,
    url: base + localePath(locale, "product", p.slug),
    translationStatus: p.status,
    price:
      p.price != null
        ? { amount: p.price, currency: p.currency, note: "from" }
        : null,
    colors: p.colors,
    brand: p.brand,
    industries: p.categories
      .filter((c) => c.startsWith("industry:"))
      .map((c) => c.slice(9)),
    types: p.categories
      .filter((c) => c.startsWith("type:"))
      .map((c) => c.slice(5)),
    features: p.categories
      .filter((c) => c.startsWith("feature:"))
      .map((c) => c.slice(8)),
    image: p.image
      ? Object.fromEntries(
          p.image.variants
            .filter((v) => v.format === "webp")
            .map((v) => [`w${v.width}`, `${base}/media/${v.path}`]),
        )
      : null,
  };
}
