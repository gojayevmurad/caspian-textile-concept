import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  isLocale,
  localePath,
  locales,
  type Locale,
} from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { getCatalog, getCategories } from "@/src/lib/catalog/queries";
import { ProductCard, cardLabels } from "@/src/components/site/product-card";
import { byRecommended } from "@/src/lib/catalog/rank";
import { IndustryIcon } from "@/src/components/site/industry-icon";
import { Picture } from "@/src/components/site/picture";
import { buildMetadata, JsonLd, siteUrl } from "@/src/lib/seo/metadata";
import { organizationJsonLd } from "@/src/lib/seo/jsonld";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return buildMetadata({
    locale: lang,
    title: `${t.meta.siteName} — ${t.meta.tagline}`,
    description: t.meta.description,
    paths: Object.fromEntries(locales.map((l) => [l, localePath(l)])) as Record<
      Locale,
      string
    >,
  });
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const [catalog, categories] = await Promise.all([
    getCatalog(lang),
    getCategories(lang),
  ]);
  const industries = categories.filter(
    (c) => c.kind === "industry" && c.count > 0,
  );
  // One strong product per type for a varied "featured" grid; apparel first.
  const seen = new Set<string>();
  const featured = [...catalog]
    .filter((p) => p.image)
    .sort(byRecommended)
    .filter((p) => {
      const type = p.categories.find((c) => c.startsWith("type:")) ?? p.sku;
      if (seen.has(type)) return false;
      seen.add(type);
      return true;
    })
    .slice(0, 8);
  const heroItems = featured.slice(0, 4);

  return (
    <>
      <JsonLd data={organizationJsonLd(lang, siteUrl())} />
      <section className="relative overflow-hidden bg-brand-50">
        <div className="container-x grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand ring-1 ring-brand-100">
              <span className="size-2 rounded-full bg-hivis" aria-hidden />
              {t.home.eyebrow}
            </p>
            <h1 className="mt-5 text-4xl leading-[1.08] font-bold tracking-tight text-brand-800 text-balance sm:text-5xl">
              {t.home.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              {t.home.lead}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={localePath(lang, "catalog")} className="btn-primary">
                {t.home.ctaCatalog}{" "}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href={localePath(lang, "quote")} className="btn-ghost">
                {t.home.ctaQuote}
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                [catalog.length, t.home.statsProducts],
                [industries.length, t.home.statsIndustries],
                [3, t.home.statsLanguages],
              ].map(([n, label]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl bg-white p-4 ring-1 ring-line"
                >
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="text-2xl font-bold text-brand">{n}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-hidden>
            {heroItems.map((p, i) => (
              <div
                key={p.id}
                className={`rounded-3xl bg-white p-4 ring-1 ring-line ${i % 2 ? "translate-y-6" : ""}`}
              >
                <Picture
                  media={p.image}
                  sizes="(min-width: 1024px) 260px, 45vw"
                  priority={i < 2}
                  alt=""
                  className="mix-blend-multiply"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-16" aria-labelledby="industries-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="industries-title"
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t.home.industriesTitle}
            </h2>
            <p className="mt-2 text-muted">{t.home.industriesLead}</p>
          </div>
          <Link
            href={localePath(lang, "industries")}
            className="text-sm font-semibold text-brand hover:underline"
          >
            {t.nav.industries} →
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {industries.map((c) => (
            <li key={c.id}>
              <Link
                href={localePath(lang, "industries", c.slug)}
                className="flex h-full flex-col gap-3 rounded-2xl border border-line p-4 transition-colors hover:border-brand hover:bg-brand-50"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand text-white">
                  <IndustryIcon name={c.icon} className="size-5" />
                </span>
                <span className="text-sm leading-snug font-semibold">
                  {c.name}
                </span>
                <span className="mt-auto text-xs text-muted">
                  {c.count} {t.home.statsProducts}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-x py-4" aria-labelledby="featured-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2
            id="featured-title"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {t.home.featuredTitle}
          </h2>
          <Link
            href={localePath(lang, "catalog")}
            className="text-sm font-semibold text-brand hover:underline"
          >
            {t.home.viewAll} →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              locale={lang}
              labels={cardLabels(t)}
            />
          ))}
        </div>
      </section>

      <section
        className="mt-20 bg-brand text-white"
        aria-labelledby="process-title"
      >
        <div className="container-x py-16">
          <h2
            id="process-title"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {t.home.processTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-white/75">{t.home.processLead}</p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.home.process.map((step, i) => (
              <li
                key={step.title}
                className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10"
              >
                <span className="text-sm font-bold text-[#ffb27d]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-white/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-x py-16" aria-labelledby="b2b-title">
        <div className="grid gap-10 rounded-3xl border border-line p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2
              id="b2b-title"
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t.home.b2bTitle}
            </h2>
            <Link href={localePath(lang, "quote")} className="btn-accent mt-6">
              {t.home.ctaQuote} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {t.home.b2b.map((s) => (
              <li key={s.title} className="flex gap-3">
                <CheckCircle2
                  className="mt-0.5 size-5 shrink-0 text-hivis-700"
                  aria-hidden
                />
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
