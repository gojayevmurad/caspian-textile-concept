import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  isLocale,
  localePath,
  locales,
  type Locale,
} from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { getCategories } from "@/src/lib/catalog/queries";
import { IndustryIcon } from "@/src/components/site/industry-icon";
import { buildMetadata } from "@/src/lib/seo/metadata";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/industries">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return buildMetadata({
    locale: lang,
    title: t.nav.industries,
    description: t.home.industriesLead,
    paths: Object.fromEntries(
      locales.map((l) => [l, localePath(l, "industries")]),
    ) as Record<Locale, string>,
  });
}

export default async function Industries({
  params,
}: PageProps<"/[lang]/industries">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const industries = (await getCategories(lang)).filter(
    (c) => c.kind === "industry" && c.count > 0,
  );
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t.nav.industries}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">{t.home.industriesLead}</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {industries.map((c) => (
          <li key={c.id}>
            <Link
              href={localePath(lang, "industries", c.slug)}
              className="flex h-full gap-4 rounded-2xl border border-line p-5 transition-colors hover:border-brand hover:bg-brand-50"
            >
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
                <IndustryIcon name={c.icon} />
              </span>
              <span>
                <span className="block font-semibold">{c.name}</span>
                {c.description && (
                  <span className="mt-1 block text-sm text-muted">
                    {c.description}
                  </span>
                )}
                <span className="mt-2 block text-xs text-muted">
                  {c.count} {t.home.statsProducts}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
