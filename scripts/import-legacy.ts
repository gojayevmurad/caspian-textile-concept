// Idempotent importer for the data scraped from the legacy WordPress/WooCommerce site.
//   LEGACY_DATA_DIR=caspian-research/data pnpm import:legacy [--skip-media] [--report path]
// Reads products.normalized.json, image files and (optionally) translations.draft.json.
// Writes catalogue tables, processed media and legacy redirects. Never contacts the old site.
import { readFile, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { eq, inArray, sql } from "drizzle-orm";
import { scriptDb } from "./lib/db";
import { taxonomy, normalizeColor } from "../src/lib/catalog/taxonomy";
import {
  cleanDescription,
  htmlToText,
  firstSentences,
} from "../src/lib/catalog/clean-html";
import {
  locales,
  localePath,
  slugify,
  type Locale,
} from "../src/lib/i18n/config";
import { processImage } from "../src/lib/media/process";

const { values: args } = parseArgs({
  options: {
    "skip-media": { type: "boolean", default: false },
    report: { type: "string" },
  },
});

type LegacyTranslation = {
  sourceId: number;
  name: string;
  slug: string;
  sourceUrl: string;
  shortDescription: string;
  descriptionHtml: string;
  categories: { name: string; slug: string }[];
};
type LegacyProduct = {
  sku: string;
  translations: Partial<Record<Locale, LegacyTranslation>>;
  images: { src: string; local: string | null; alt: string }[];
  price: { amount: number | null; currency: string | null };
  attributes: { name: string; terms: string[] }[];
  brands: string[];
  inStock: boolean;
  issues: string[];
};
type Draft = Partial<Record<Locale, { name: string; summary: string }>>;

const dataDir = resolve(process.env.LEGACY_DATA_DIR || "caspian-research/data");
const exists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );
const decodePath = (url: string) => {
  const p = decodeURIComponent(new URL(url).pathname).replace(/\/+$/, "");
  return p || "/";
};

const products: LegacyProduct[] = JSON.parse(
  await readFile(join(dataDir, "products.normalized.json"), "utf8"),
);
const draftsPath = resolve("data/translations.draft.json");
const drafts: Record<string, Draft> = (await exists(draftsPath))
  ? JSON.parse(await readFile(draftsPath, "utf8"))
  : {};
const siteData = JSON.parse(
  await readFile(join(dataDir, "raw", "site-data.json"), "utf8"),
);

const legacyToKey = new Map<string, string>();
for (const t of taxonomy)
  for (const l of t.legacy) legacyToKey.set(`${t.kind}:${l}`, t.key);
const keysFor = (slugs: string[], kind: "industry" | "type" | "feature") => [
  ...new Set(
    slugs
      .map((s) => legacyToKey.get(`${kind}:${s}`))
      .filter(Boolean) as string[],
  ),
];

const { db, pool, schema } = scriptDb();
const report: string[] = [];
const stats = {
  products: 0,
  translations: { source: 0, ai_draft: 0, untranslated: 0 },
  media: 0,
  mediaFailed: 0,
  redirects: 0,
  gone: 0,
  uncategorized: [] as string[],
};

try {
  // 1) Taxonomy
  const categoryIds = new Map<string, number>();
  for (const [i, t] of taxonomy.entries()) {
    const [row] = await db
      .insert(schema.category)
      .values({
        kind: t.kind,
        key: t.key,
        position: i,
        icon: t.icon,
        legacySlugs: t.legacy,
      })
      .onConflictDoUpdate({
        target: [schema.category.kind, schema.category.key],
        set: {
          legacySlugs: t.legacy,
          icon: t.icon ?? null,
          updatedAt: new Date(),
        },
      })
      .returning({ id: schema.category.id });
    categoryIds.set(`${t.kind}:${t.key}`, row.id);
    for (const l of locales) {
      await db
        .insert(schema.categoryTranslation)
        .values({
          categoryId: row.id,
          locale: l,
          name: t.names[l],
          slug: slugify(t.names[l]),
          description: t.descriptions?.[l] ?? null,
          status: "source",
        })
        .onConflictDoNothing();
    }
  }

  // 2) Products
  const usedSlugs: Record<Locale, Set<string>> = {
    az: new Set(),
    en: new Set(),
    ru: new Set(),
  };
  const existingSlugs = await db
    .select({
      locale: schema.productTranslation.locale,
      slug: schema.productTranslation.slug,
      productId: schema.productTranslation.productId,
    })
    .from(schema.productTranslation);
  const mediaCache = new Map<string, number>();

  for (const [index, p] of products.entries()) {
    const translations = p.translations;
    const sourceLocale = (
      translations.en ? "en" : translations.az ? "az" : "ru"
    ) as Locale;
    const source = translations[sourceLocale]!;
    const allSlugs = Object.values(translations).flatMap((t) =>
      t!.categories.map((c) => decodeURIComponent(c.slug)),
    );
    const colors = [
      ...new Set(
        p.attributes
          .filter((a) => a.name === "Color")
          .flatMap((a) => a.terms)
          .map(normalizeColor)
          .filter(Boolean) as string[],
      ),
    ];
    const brand =
      p.attributes.find((a) => a.name === "Brand")?.terms[0] ??
      p.brands[0] ??
      null;
    const legacyIds = Object.values(translations).map((t) => t!.sourceId);

    const [row] = await db
      .insert(schema.product)
      .values({
        sku: p.sku,
        // Obvious duplicates on the old site (e.g. "… (Copy)") are imported as drafts, not published.
        status: /\(copy\)/i.test(
          Object.values(translations)
            .map((t) => t!.name)
            .join(" "),
        )
          ? "draft"
          : "published",
        brand,
        priceAmount: p.price.amount != null ? p.price.amount.toFixed(2) : null,
        currency: p.price.currency ?? "AZN",
        colors,
        legacyIds,
        position: index,
      })
      .onConflictDoUpdate({
        target: schema.product.sku,
        set: {
          brand,
          colors,
          legacyIds,
          priceAmount:
            p.price.amount != null ? p.price.amount.toFixed(2) : null,
          updatedAt: new Date(),
        },
      })
      .returning({ id: schema.product.id });
    const productId = row.id;
    stats.products++;

    // Categories
    const catKeys = [
      ...keysFor(allSlugs, "industry").map((k) => `industry:${k}`),
      ...keysFor(allSlugs, "type").map((k) => `type:${k}`),
      ...keysFor(allSlugs, "feature").map((k) => `feature:${k}`),
    ];
    if (!catKeys.some((k) => k.startsWith("type:")))
      stats.uncategorized.push(`${p.sku} ${source.name}`);
    await db
      .delete(schema.productCategory)
      .where(eq(schema.productCategory.productId, productId));
    if (catKeys.length)
      await db
        .insert(schema.productCategory)
        .values(
          catKeys.map((k) => ({ productId, categoryId: categoryIds.get(k)! })),
        )
        .onConflictDoNothing();

    // Translations
    const sourceHtml = cleanDescription(source.descriptionHtml);
    for (const l of locales) {
      const own = translations[l];
      const draft = drafts[p.sku]?.[l];
      let name: string,
        shortDescription: string,
        descriptionHtml: string,
        status: "source" | "ai_draft" | "untranslated";
      if (own && !(l !== "en" && own.name === translations.en?.name && draft)) {
        name = own.name;
        shortDescription = firstSentences(
          htmlToText(own.shortDescription),
          3,
          420,
        );
        descriptionHtml = cleanDescription(own.descriptionHtml);
        status = "source";
      } else if (draft) {
        name = draft.name;
        shortDescription = draft.summary;
        descriptionHtml = sourceHtml; // long text stays in the source language until reviewed
        status = "ai_draft";
      } else {
        name = source.name;
        shortDescription = firstSentences(
          htmlToText(source.shortDescription),
          3,
          420,
        );
        descriptionHtml = sourceHtml;
        status = "untranslated";
      }
      stats.translations[status]++;
      const existing = existingSlugs.find(
        (s) => s.productId === productId && s.locale === l,
      );
      let slug = existing?.slug ?? slugify(name);
      if (!existing) {
        if (
          usedSlugs[l].has(slug) ||
          existingSlugs.some(
            (s) =>
              s.locale === l && s.slug === slug && s.productId !== productId,
          )
        )
          slug = `${slug}-${slugify(p.sku)}`;
      }
      usedSlugs[l].add(slug);
      const searchText = [
        name,
        p.sku,
        brand,
        shortDescription,
        htmlToText(descriptionHtml).slice(0, 600),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      await db
        .insert(schema.productTranslation)
        .values({
          productId,
          locale: l,
          name,
          slug,
          shortDescription,
          descriptionHtml,
          status,
          legacyUrl: own ? decodePath(own.sourceUrl) : null,
          searchText,
        })
        .onConflictDoUpdate({
          target: [
            schema.productTranslation.productId,
            schema.productTranslation.locale,
          ],
          // Never overwrite text an admin has approved.
          set: {
            name,
            shortDescription,
            descriptionHtml,
            status,
            searchText,
            updatedAt: new Date(),
          },
          setWhere: sql`${schema.productTranslation.status} <> 'approved'`,
        });

      // Legacy URL → new URL (301). The old site served English at the root and az/ru under prefixes.
      if (own) {
        const from = decodePath(own.sourceUrl);
        await db
          .insert(schema.redirect)
          .values({
            fromPath: from,
            toPath: localePath(l, "product", slug),
            statusCode: 301,
            source: "legacy-import",
          })
          .onConflictDoUpdate({
            target: schema.redirect.fromPath,
            set: { toPath: localePath(l, "product", slug) },
          });
        stats.redirects++;
      }
    }

    // Media
    if (!args["skip-media"]) {
      const current = await db
        .select()
        .from(schema.productMedia)
        .where(eq(schema.productMedia.productId, productId));
      if (!current.length) {
        for (const [pos, im] of p.images.entries()) {
          if (!im.local) continue;
          try {
            let mediaId = mediaCache.get(im.local);
            if (!mediaId) {
              const buf = await readFile(join(dataDir, im.local));
              const processed = await processImage(buf);
              const alt = Object.fromEntries(
                locales.map((l) => [
                  l,
                  translations[l]?.name ??
                    drafts[p.sku]?.[l]?.name ??
                    source.name,
                ]),
              );
              const [m] = await db
                .insert(schema.media)
                .values({
                  hash: processed.hash,
                  originalName: im.local.split("/").pop()!,
                  sourceUrl: im.src,
                  width: processed.width,
                  height: processed.height,
                  color: processed.color,
                  blur: processed.blur,
                  variants: processed.variants,
                  alt,
                })
                .onConflictDoUpdate({
                  target: schema.media.hash,
                  set: { sourceUrl: im.src },
                })
                .returning({ id: schema.media.id });
              mediaId = m.id;
              mediaCache.set(im.local, mediaId);
              stats.media++;
            }
            await db
              .insert(schema.productMedia)
              .values({ productId, mediaId, position: pos })
              .onConflictDoNothing();
          } catch (e) {
            stats.mediaFailed++;
            report.push(
              `- media failed for ${p.sku}: ${im.local} (${String(e).slice(0, 120)})`,
            );
          }
        }
      }
    }
    if ((index + 1) % 20 === 0)
      console.log(`… ${index + 1}/${products.length} products`);
  }

  // 3) Theme demo posts from the old sitemap: 410 Gone (they were never real content).
  for (const l of ["en", "az", "ru"]) {
    for (const post of siteData.posts?.[l] ?? []) {
      await db
        .insert(schema.redirect)
        .values({
          fromPath: decodePath(post.link),
          toPath: "",
          statusCode: 410,
          source: "legacy-import",
        })
        .onConflictDoNothing();
      stats.gone++;
    }
  }

  // 3b) Legacy WordPress pages (all languages) → new localized pages.
  const pageRules: [RegExp, Parameters<typeof localePath>[1] | undefined][] = [
    [/about|haqq|o-nas|о-нас|о-компании/i, "about"],
    [/contact|elaq|əlaq|kontakt|контакт|свяж/i, "contact"],
    [/privacy|məxfilik|mexfilik|конфиденц/i, "privacy"],
    [/^shop|magaza|mağaza|магазин/i, "catalog"],
    [/cart|checkout|səbət|sebet|корзин|оформлен/i, "quote"],
    [/compare|müqayis|muqayis|сравн/i, "catalog"],
    [/wishlist|istək|istek|избран/i, "catalog"],
  ];
  for (const l of ["en", "az", "ru"] as const) {
    for (const page of siteData.pages?.[l] ?? []) {
      const from = decodePath(page.link);
      if (from === "/" || from === "/az" || from === "/ru") continue;
      const slug = decodeURIComponent(page.slug);
      const target = pageRules.find(([re]) => re.test(slug))?.[1];
      await db
        .insert(schema.redirect)
        .values({
          fromPath: from,
          toPath: localePath(l, target),
          statusCode: 301,
          source: "legacy-import",
        })
        .onConflictDoUpdate({
          target: schema.redirect.fromPath,
          set: { toPath: localePath(l, target) },
        });
      stats.redirects++;
    }
  }

  // 4) Products present in the DB but not in the data are left untouched (admin may have created them).
  const total = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.product);
  const untranslated = await db
    .select({
      locale: schema.productTranslation.locale,
      status: schema.productTranslation.status,
      n: sql<number>`count(*)::int`,
    })
    .from(schema.productTranslation)
    .where(inArray(schema.productTranslation.locale, ["az", "ru"]))
    .groupBy(
      schema.productTranslation.locale,
      schema.productTranslation.status,
    );

  const lines = [
    `# Import report`,
    ``,
    `Generated ${new Date().toISOString()} from \`${dataDir}\`.`,
    ``,
    `| Metric | Value |`,
    `|---|---|`,
    `| Products imported | ${stats.products} (DB total ${total[0].n}) |`,
    `| Translations from the old site | ${stats.translations.source} |`,
    `| AI draft translations (need review) | ${stats.translations.ai_draft} |`,
    `| Untranslated (English fallback) | ${stats.translations.untranslated} |`,
    `| Media processed | ${stats.media} (failed ${stats.mediaFailed}) |`,
    `| Product redirects (301) | ${stats.redirects} |`,
    `| Demo blog posts marked 410 Gone | ${stats.gone} |`,
    ``,
    `## az/ru translation status`,
    ``,
    ...untranslated.map((u) => `- ${u.locale} · ${u.status}: ${u.n}`),
    ``,
    `## Products without a product type (${stats.uncategorized.length})`,
    ``,
    ...stats.uncategorized.map((s) => `- ${s}`),
    ``,
    `## Problems`,
    ``,
    ...(report.length ? report : ["- none"]),
    ``,
  ];
  await writeFile(
    args.report ?? resolve(dataDir, "..", "import-report.md"),
    lines.join("\n"),
  );
  console.log(lines.slice(4, 13).join("\n"));
} finally {
  await pool.end();
}
