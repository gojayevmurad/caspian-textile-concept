import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { foldForSearch, type Locale } from "@/src/lib/i18n/config";
import type { MediaVariant } from "@/src/lib/media/process";

export const CATALOG_TAG = "catalog";
// Cache keys include the database identity so different databases (dev/test/prod) never share entries.
const DB_KEY = createHash("sha1")
  .update(process.env.DATABASE_URL ?? "none")
  .digest("hex")
  .slice(0, 8);
const hasDb = () => Boolean(process.env.DATABASE_URL);

export type MediaRef = {
  id: number;
  width: number;
  height: number;
  color: string;
  blur: string;
  variants: MediaVariant[];
  alt: string;
};
export type CategoryView = {
  id: number;
  kind: "industry" | "type" | "feature";
  key: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  count: number;
  seoTitle: string | null;
  seoDescription: string | null;
};
export type ProductSummary = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  summary: string;
  status: "source" | "ai_draft" | "approved" | "untranslated";
  price: number | null;
  currency: string;
  colors: string[];
  brand: string | null;
  categories: string[]; // "industry:construction", "type:jackets", …
  image: MediaRef | null;
  position: number;
  createdAt: string;
};

function mediaRef(
  row: typeof s.media.$inferSelect | null | undefined,
  locale: Locale,
): MediaRef | null {
  if (!row) return null;
  const alt = (row.alt as Record<string, string>)[locale] ?? "";
  return {
    id: row.id,
    width: row.width,
    height: row.height,
    color: row.color,
    blur: row.blur,
    variants: row.variants as MediaVariant[],
    alt,
  };
}

export const getCategories = unstable_cache(
  async (locale: Locale): Promise<CategoryView[]> => {
    if (!hasDb()) return [];
    const rows = await db()
      .select({
        c: s.category,
        t: s.categoryTranslation,
        count: sql<number>`(select count(*)::int from ${s.productCategory} pc join ${s.product} p on p.id = pc.product_id where pc.category_id = ${s.category.id} and p.status = 'published')`,
      })
      .from(s.category)
      .innerJoin(
        s.categoryTranslation,
        and(
          eq(s.categoryTranslation.categoryId, s.category.id),
          eq(s.categoryTranslation.locale, locale),
        ),
      )
      .orderBy(asc(s.category.position));
    return rows.map(({ c, t, count }) => ({
      id: c.id,
      kind: c.kind as CategoryView["kind"],
      key: c.key,
      name: t.name,
      slug: t.slug,
      description: t.description,
      icon: c.icon,
      count,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
    }));
  },
  ["categories-v1", DB_KEY],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export const getCatalog = unstable_cache(
  async (locale: Locale): Promise<ProductSummary[]> => {
    if (!hasDb()) return [];
    const rows = await db()
      .select({ p: s.product, t: s.productTranslation })
      .from(s.product)
      .innerJoin(
        s.productTranslation,
        and(
          eq(s.productTranslation.productId, s.product.id),
          eq(s.productTranslation.locale, locale),
        ),
      )
      .where(eq(s.product.status, "published"))
      .orderBy(asc(s.product.position), asc(s.product.id));
    const ids = rows.map((r) => r.p.id);
    if (!ids.length) return [];
    const cats = await db()
      .select({
        productId: s.productCategory.productId,
        kind: s.category.kind,
        key: s.category.key,
      })
      .from(s.productCategory)
      .innerJoin(s.category, eq(s.category.id, s.productCategory.categoryId))
      .where(inArray(s.productCategory.productId, ids));
    const firstMedia = await db()
      .selectDistinctOn([s.productMedia.productId], {
        productId: s.productMedia.productId,
        m: s.media,
      })
      .from(s.productMedia)
      .innerJoin(s.media, eq(s.media.id, s.productMedia.mediaId))
      .where(inArray(s.productMedia.productId, ids))
      .orderBy(s.productMedia.productId, asc(s.productMedia.position));
    const catMap = new Map<number, string[]>();
    for (const c of cats)
      catMap.set(c.productId, [
        ...(catMap.get(c.productId) ?? []),
        `${c.kind}:${c.key}`,
      ]);
    const mediaMap = new Map(firstMedia.map((m) => [m.productId, m.m]));
    return rows.map(({ p, t }) => ({
      id: p.id,
      sku: p.sku,
      name: t.name,
      slug: t.slug,
      summary: t.shortDescription,
      status: t.status as ProductSummary["status"],
      price: p.priceAmount != null ? Number(p.priceAmount) : null,
      currency: p.currency,
      colors: p.colors,
      brand: p.brand,
      categories: catMap.get(p.id) ?? [],
      image: mediaRef(mediaMap.get(p.id), locale),
      position: p.position,
      createdAt: p.createdAt.toISOString(),
    }));
  },
  ["catalog-v1", DB_KEY],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export type ProductDetail = ProductSummary & {
  descriptionHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  sizes: string[];
  standards: string[];
  minOrder: number | null;
  leadTimeDays: number | null;
  gallery: MediaRef[];
  alternates: Partial<Record<Locale, string>>; // locale → slug
  updatedAt: string;
};

export const getProduct = unstable_cache(
  async (locale: Locale, slug: string): Promise<ProductDetail | null> => {
    if (!hasDb()) return null;
    const [row] = await db()
      .select({ p: s.product, t: s.productTranslation })
      .from(s.productTranslation)
      .innerJoin(s.product, eq(s.product.id, s.productTranslation.productId))
      .where(
        and(
          eq(s.productTranslation.locale, locale),
          eq(s.productTranslation.slug, slug),
          eq(s.product.status, "published"),
        ),
      );
    if (!row) return null;
    const { p, t } = row;
    const [gallery, translations, cats] = await Promise.all([
      db()
        .select({ m: s.media })
        .from(s.productMedia)
        .innerJoin(s.media, eq(s.media.id, s.productMedia.mediaId))
        .where(eq(s.productMedia.productId, p.id))
        .orderBy(asc(s.productMedia.position)),
      db()
        .select({
          locale: s.productTranslation.locale,
          slug: s.productTranslation.slug,
        })
        .from(s.productTranslation)
        .where(eq(s.productTranslation.productId, p.id)),
      db()
        .select({ kind: s.category.kind, key: s.category.key })
        .from(s.productCategory)
        .innerJoin(s.category, eq(s.category.id, s.productCategory.categoryId))
        .where(eq(s.productCategory.productId, p.id)),
    ]);
    const media = gallery.map((g) => mediaRef(g.m, locale)!).filter(Boolean);
    return {
      id: p.id,
      sku: p.sku,
      name: t.name,
      slug: t.slug,
      summary: t.shortDescription,
      status: t.status as ProductSummary["status"],
      price: p.priceAmount != null ? Number(p.priceAmount) : null,
      currency: p.currency,
      colors: p.colors,
      brand: p.brand,
      categories: cats.map((c) => `${c.kind}:${c.key}`),
      image: media[0] ?? null,
      position: p.position,
      createdAt: p.createdAt.toISOString(),
      descriptionHtml: t.descriptionHtml,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
      sizes: p.sizes,
      standards: p.standards,
      minOrder: p.minOrder,
      leadTimeDays: p.leadTimeDays,
      gallery: media,
      alternates: Object.fromEntries(
        translations.map((x) => [x.locale, x.slug]),
      ),
      updatedAt: (t.updatedAt > p.updatedAt
        ? t.updatedAt
        : p.updatedAt
      ).toISOString(),
    };
  },
  ["product-v1", DB_KEY],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export async function getCategory(
  locale: Locale,
  kind: CategoryView["kind"],
  slug: string,
) {
  return (
    (await getCategories(locale)).find(
      (c) => c.kind === kind && c.slug === slug,
    ) ?? null
  );
}

/** Category slugs per locale for a category (for hreflang alternates). */
export const getCategoryAlternates = unstable_cache(
  async (categoryId: number) => {
    if (!hasDb()) return {};
    const rows = await db()
      .select({
        locale: s.categoryTranslation.locale,
        slug: s.categoryTranslation.slug,
      })
      .from(s.categoryTranslation)
      .where(eq(s.categoryTranslation.categoryId, categoryId));
    return Object.fromEntries(rows.map((r) => [r.locale, r.slug])) as Partial<
      Record<Locale, string>
    >;
  },
  ["category-alternates-v1", DB_KEY],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

/** Typo-tolerant search over product names/SKU/description in one locale (pg_trgm). */
export async function searchProducts(locale: Locale, q: string, limit = 12) {
  const query = foldForSearch(q).slice(0, 80);
  if (!hasDb() || query.length < 2) return [];
  const rows = await db()
    .select({
      productId: s.productTranslation.productId,
      score: sql<number>`greatest(word_similarity(${query}, ${s.productTranslation.searchText}), similarity(${query}, ${s.productTranslation.name}))`,
    })
    .from(s.productTranslation)
    .innerJoin(s.product, eq(s.product.id, s.productTranslation.productId))
    .where(
      and(
        eq(s.productTranslation.locale, locale),
        eq(s.product.status, "published"),
        sql`(${s.productTranslation.searchText} ilike ${"%" + query + "%"} or word_similarity(${query}, ${s.productTranslation.searchText}) > 0.35)`,
      ),
    )
    .orderBy(sql`2 desc`)
    .limit(limit);
  const catalog = await getCatalog(locale);
  const byId = new Map(catalog.map((p) => [p.id, p]));
  return rows
    .map((r) => byId.get(r.productId))
    .filter(Boolean) as ProductSummary[];
}
