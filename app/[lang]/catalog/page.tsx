import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  isLocale,
  localePath,
  locales,
  type Locale,
} from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { getCatalog, getCategories } from "@/src/lib/catalog/queries";
import { CatalogBrowser } from "@/src/components/site/catalog-browser";
import { cardLabels } from "@/src/components/site/product-card";
import { buildMetadata, JsonLd, siteUrl } from "@/src/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/src/lib/seo/jsonld";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/catalog">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return buildMetadata({
    locale: lang,
    title: t.catalog.title,
    description: `${t.catalog.lead} ${t.meta.tagline}.`,
    paths: Object.fromEntries(
      locales.map((l) => [l, localePath(l, "catalog")]),
    ) as Record<Locale, string>,
  });
}

export default async function CatalogPage({
  params,
}: PageProps<"/[lang]/catalog">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const [products, categories] = await Promise.all([
    getCatalog(lang),
    getCategories(lang),
  ]);
  const labels = { ...t.catalog, close: t.nav.close };
  return (
    <div className="container-x py-10">
      <JsonLd
        data={breadcrumbJsonLd(siteUrl(), [
          { name: t.nav.home, path: localePath(lang) },
          { name: t.catalog.title, path: localePath(lang, "catalog") },
        ])}
      />
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t.catalog.title}
        </h1>
        <p className="mt-2 text-muted">{t.catalog.lead}</p>
      </header>
      <Suspense>
        <CatalogBrowser
          products={products}
          categories={categories}
          locale={lang}
          labels={labels}
          card={cardLabels(t)}
        />
      </Suspense>
    </div>
  );
}
