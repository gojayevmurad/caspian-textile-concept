import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isLocale, localePath, type Locale } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import {
  getCatalog,
  getCategories,
  getCategory,
  getCategoryAlternates,
} from "@/src/lib/catalog/queries";
import { CatalogBrowser } from "@/src/components/site/catalog-browser";
import { cardLabels } from "@/src/components/site/product-card";
import { IndustryIcon } from "@/src/components/site/industry-icon";
import { buildMetadata, JsonLd, siteUrl } from "@/src/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/src/lib/seo/jsonld";

export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}
type Props = PageProps<"/[lang]/industries/[slug]">;

async function load(params: Props["params"]) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return null;
  const industry = await getCategory(
    lang,
    "industry",
    decodeURIComponent(slug),
  );
  return industry ? { lang, industry } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  const { lang, industry } = data;
  const t = getDictionary(lang);
  const alt = await getCategoryAlternates(industry.id);
  return buildMetadata({
    locale: lang,
    title: industry.seoTitle || `${industry.name} — ${t.nav.catalog}`,
    description:
      industry.seoDescription ||
      industry.description ||
      `${industry.name}: ${t.catalog.lead}`,
    paths: Object.fromEntries(
      Object.entries(alt).map(([l, s]) => [
        l,
        localePath(l as Locale, "industries", s!),
      ]),
    ),
  });
}

export default async function IndustryPage({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();
  const { lang, industry } = data;
  const t = getDictionary(lang);
  const [products, categories] = await Promise.all([
    getCatalog(lang),
    getCategories(lang),
  ]);
  const scoped = products.filter((p) =>
    p.categories.includes(`industry:${industry.key}`),
  );
  return (
    <div className="container-x py-10">
      <JsonLd
        data={breadcrumbJsonLd(siteUrl(), [
          { name: t.nav.home, path: localePath(lang) },
          { name: t.nav.industries, path: localePath(lang, "industries") },
          {
            name: industry.name,
            path: localePath(lang, "industries", industry.slug),
          },
        ])}
      />
      <header className="mb-8 flex items-start gap-4">
        <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white">
          <IndustryIcon name={industry.icon} className="size-7" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {industry.name}
          </h1>
          {industry.description && (
            <p className="mt-2 max-w-3xl text-muted">{industry.description}</p>
          )}
        </div>
      </header>
      <Suspense>
        <CatalogBrowser
          products={scoped}
          categories={categories}
          locale={lang}
          labels={{ ...t.catalog, close: t.nav.close }}
          card={cardLabels(t)}
          fixed={{ facet: "industry", value: industry.key }}
        />
      </Suspense>
    </div>
  );
}
