import type { MetadataRoute } from "next";
import {
  locales,
  localePath,
  type Locale,
  type RouteKey,
} from "@/src/lib/i18n/config";
import {
  getCatalog,
  getCategories,
  getCategoryAlternates,
  getProduct,
} from "@/src/lib/catalog/queries";
import { siteUrl } from "@/src/lib/seo/metadata";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = [];
  const alt = (paths: Partial<Record<Locale, string>>) => ({
    languages: Object.fromEntries([
      ...Object.entries(paths).map(([l, p]) => [l, base + p]),
      ["x-default", base + (paths.az ?? paths.en)],
    ]),
  });
  const statics: (RouteKey | undefined)[] = [
    undefined,
    "catalog",
    "industries",
    "about",
    "contact",
    "patterns",
    "case-study",
  ];
  for (const key of statics) {
    const paths = Object.fromEntries(
      locales.map((l) => [l, localePath(l, key)]),
    ) as Record<Locale, string>;
    for (const l of locales)
      entries.push({
        url: base + paths[l],
        alternates: alt(paths),
        changeFrequency: "weekly",
        priority: key ? 0.7 : 1,
      });
  }
  const industries = (await getCategories("az")).filter(
    (c) => c.kind === "industry" && c.count > 0,
  );
  for (const c of industries) {
    const slugs = await getCategoryAlternates(c.id);
    const paths = Object.fromEntries(
      Object.entries(slugs).map(([l, s]) => [
        l,
        localePath(l as Locale, "industries", s!),
      ]),
    );
    for (const l of locales)
      if (paths[l])
        entries.push({
          url: base + paths[l],
          alternates: alt(paths),
          changeFrequency: "weekly",
          priority: 0.8,
        });
  }
  for (const p of await getCatalog("az")) {
    const detail = await getProduct("az", p.slug);
    if (!detail) continue;
    const paths = Object.fromEntries(
      Object.entries(detail.alternates).map(([l, s]) => [
        l,
        localePath(l as Locale, "product", s!),
      ]),
    );
    const images = detail.gallery
      .map(
        (g) =>
          g.variants
            .filter((v) => v.format === "webp")
            .sort((a, b) => b.width - a.width)[0],
      )
      .filter(Boolean)
      .map((v) => `${base}/media/${v!.path}`);
    for (const l of locales)
      if (paths[l])
        entries.push({
          url: base + paths[l],
          lastModified: detail.updatedAt,
          alternates: alt(paths),
          images,
          changeFrequency: "monthly",
          priority: 0.6,
        });
  }
  return entries;
}
