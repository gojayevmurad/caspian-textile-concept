import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, Languages, Ruler, Stamp } from "lucide-react";
import { isLocale, localePath, type Locale } from "@/src/lib/i18n/config";
import { format, formatPrice, getDictionary } from "@/src/lib/i18n";
import {
  getCatalog,
  getCategories,
  getProduct,
} from "@/src/lib/catalog/queries";
import { colorNames } from "@/src/lib/catalog/taxonomy";
import { defaultSizes } from "@/src/lib/catalog/sizes";
import { Gallery } from "@/src/components/site/gallery";
import { AddToQuote } from "@/src/components/site/add-to-quote";
import { ProductCard, cardLabels } from "@/src/components/site/product-card";
import { buildMetadata, JsonLd, siteUrl } from "@/src/lib/seo/metadata";
import { breadcrumbJsonLd, productJsonLd } from "@/src/lib/seo/jsonld";

export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

type Props = PageProps<"/[lang]/product/[slug]">;

async function load(params: Props["params"]) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return null;
  const product = await getProduct(lang, decodeURIComponent(slug));
  return product ? { lang, product } : null;
}

const largest = (p: {
  variants: { format: string; width: number; path: string }[];
}) =>
  p.variants
    .filter((v) => v.format === "webp")
    .sort((a, b) => b.width - a.width)[0]?.path;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  const { lang, product } = data;
  const t = getDictionary(lang);
  const paths = Object.fromEntries(
    Object.entries(product.alternates).map(([l, s]) => [
      l,
      localePath(l as Locale, "product", s!),
    ]),
  ) as Partial<Record<Locale, string>>;
  return buildMetadata({
    locale: lang,
    title: product.seoTitle || `${product.name} (${product.sku})`,
    description:
      product.seoDescription ||
      product.summary.slice(0, 160) ||
      `${product.name} — ${t.meta.tagline}`,
    paths,
  });
}

export default async function ProductPage({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();
  const { lang, product } = data;
  const t = getDictionary(lang);
  const base = siteUrl();
  const categories = await getCategories(lang);
  const byKey = new Map(categories.map((c) => [`${c.kind}:${c.key}`, c]));
  const industries = product.categories
    .filter((c) => c.startsWith("industry:"))
    .map((k) => byKey.get(k))
    .filter(Boolean);
  const features = product.categories
    .filter((c) => c.startsWith("feature:"))
    .map((k) => byKey.get(k))
    .filter(Boolean);
  const type = product.categories.find((c) => c.startsWith("type:"));
  const typeView = type ? byKey.get(type) : undefined;
  const sizes = product.sizes.length
    ? product.sizes
    : defaultSizes(product.categories);
  const related = type
    ? (await getCatalog(lang))
        .filter((p) => p.id !== product.id && p.categories.includes(type))
        .slice(0, 4)
    : [];
  const href = localePath(lang, "product", product.slug);
  const crumbs = [
    { name: t.nav.home, path: localePath(lang) },
    { name: t.catalog.title, path: localePath(lang, "catalog") },
    ...(typeView
      ? [
          {
            name: typeView.name,
            path: `${localePath(lang, "catalog")}?type=${typeView.key}`,
          },
        ]
      : []),
    { name: product.name, path: href },
  ];
  const thumb = product.image?.variants.find(
    (v) => v.format === "webp" && v.width <= 360,
  )?.path;

  return (
    <div className="container-x py-8">
      <JsonLd
        data={productJsonLd(
          lang,
          base,
          product,
          product.gallery.map((g) => `${base}/media/${largest(g)}`),
        )}
      />
      <JsonLd data={breadcrumbJsonLd(base, crumbs)} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          {crumbs.slice(0, -1).map((c) => (
            <li key={c.path} className="after:ml-1 after:content-['/']">
              <Link href={c.path} className="hover:text-ink">
                {c.name}
              </Link>
            </li>
          ))}
          <li aria-current="page" className="text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <Gallery
          images={product.gallery}
          name={product.name}
          label={t.product.gallery}
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {t.product.sku}: {product.sku}
            {product.brand ? ` · ${t.product.brand}: ${product.brand}` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance">
            {product.name}
          </h1>
          {product.status === "ai_draft" && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
              <Languages className="size-3.5" aria-hidden /> {t.product.aiDraft}
            </p>
          )}
          {product.status === "untranslated" && lang !== "en" && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted ring-1 ring-line">
              <Languages className="size-3.5" aria-hidden />{" "}
              {t.product.untranslated}
            </p>
          )}
          <p className="mt-4 leading-relaxed text-muted">{product.summary}</p>
          <div className="mt-5 flex items-baseline gap-3">
            <p className="text-2xl font-bold text-brand">
              {product.price
                ? format(t.product.priceFrom, {
                    price: formatPrice(lang, product.price, product.currency),
                  })
                : t.product.priceOnRequest}
            </p>
            <p className="text-sm text-muted">{t.product.bulkHint}</p>
          </div>

          <div className="mt-6">
            <AddToQuote
              product={{
                productId: product.id,
                sku: product.sku,
                name: product.name,
                href,
                image: thumb,
                colors: product.colors,
                sizes,
              }}
              colorLabels={Object.fromEntries(
                product.colors.map((c) => [c, colorNames[c]?.[lang] ?? c]),
              )}
              labels={{
                add: t.product.addToQuote,
                added: t.product.added,
                size: t.quote.size,
                color: t.quote.color,
                qty: t.quote.qty,
                basket: t.nav.quote,
              }}
              basketHref={localePath(lang, "quote")}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`${localePath(lang, "sample")}?sku=${encodeURIComponent(product.sku)}`}
              className="btn-ghost"
            >
              {t.product.requestSample}
            </Link>
            <Link
              href={`${localePath(lang, "quote")}#branding`}
              className="btn-ghost"
            >
              <Stamp className="size-4" aria-hidden /> {t.product.customize}
            </Link>
            <a
              href={`/api/spec/${lang}/${encodeURIComponent(product.sku)}`}
              className="btn-ghost"
              download
            >
              <FileDown className="size-4" aria-hidden /> {t.product.specSheet}
            </a>
          </div>

          <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
            {industries.length > 0 && (
              <div className="flex gap-4 py-3">
                <dt className="w-32 shrink-0 text-muted">
                  {t.product.industries}
                </dt>
                <dd className="flex flex-wrap gap-1.5">
                  {industries.map((c) => (
                    <Link
                      key={c!.key}
                      href={localePath(lang, "industries", c!.slug)}
                      className="chip hover:border-brand hover:text-brand"
                    >
                      {c!.name}
                    </Link>
                  ))}
                </dd>
              </div>
            )}
            {features.length > 0 && (
              <div className="flex gap-4 py-3">
                <dt className="w-32 shrink-0 text-muted">
                  {t.product.features}
                </dt>
                <dd className="flex flex-wrap gap-1.5">
                  {features.map((c) => (
                    <span key={c!.key} className="chip">
                      {c!.name}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            <div className="flex gap-4 py-3">
              <dt className="w-32 shrink-0 text-muted">
                {t.product.standards}
              </dt>
              <dd>
                {product.standards.length
                  ? product.standards.join(", ")
                  : t.product.standardsNone}
              </dd>
            </div>
            {sizes.length > 0 && (
              <div className="flex gap-4 py-3">
                <dt className="flex w-32 shrink-0 items-center gap-1 text-muted">
                  <Ruler className="size-3.5" aria-hidden />{" "}
                  {t.product.sizeGuide}
                </dt>
                <dd>{sizes.join(" · ")}</dd>
              </div>
            )}
            {product.leadTimeDays && (
              <div className="flex gap-4 py-3">
                <dt className="w-32 shrink-0 text-muted">
                  {t.product.leadTime}
                </dt>
                <dd>{product.leadTimeDays}</dd>
              </div>
            )}
            {product.minOrder && (
              <div className="flex gap-4 py-3">
                <dt className="w-32 shrink-0 text-muted">
                  {t.product.minOrder}
                </dt>
                <dd>
                  {product.minOrder} {t.common.pcs}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <section
        className="mt-14 grid gap-10 lg:grid-cols-[1fr_320px]"
        aria-labelledby="desc-title"
      >
        <div>
          <h2 id="desc-title" className="text-xl font-bold">
            {t.product.description}
          </h2>
          {product.status !== "source" &&
            product.status !== "approved" &&
            lang !== "en" && (
              <p className="mt-2 text-sm text-muted">
                {t.product.sourceLanguageNote}
              </p>
            )}
          <div
            className="prose-product mt-2 max-w-3xl"
            lang={
              product.status === "source" || product.status === "approved"
                ? undefined
                : "en"
            }
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </div>
        <aside className="h-fit rounded-2xl bg-surface p-5 text-sm">
          <h2 className="font-semibold">{t.product.care}</h2>
          <p className="mt-2 text-muted">{t.product.careText}</p>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-title">
          <h2 id="related-title" className="text-xl font-bold">
            {t.product.related}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                locale={lang}
                labels={cardLabels(t)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
