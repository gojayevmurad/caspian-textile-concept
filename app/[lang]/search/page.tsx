import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  isLocale,
  localePath,
  locales,
  type Locale,
} from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { buildMetadata } from "@/src/lib/seo/metadata";
import { SearchBox } from "@/src/components/site/search-box";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/search">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return buildMetadata({
    locale: lang,
    title: t.search.title,
    description: t.search.placeholder,
    paths: Object.fromEntries(
      locales.map((l) => [l, localePath(l, "search")]),
    ) as Record<Locale, string>,
    noindex: true,
  });
}

export default async function SearchPage({
  params,
}: PageProps<"/[lang]/search">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="mb-6 text-3xl font-bold">{t.search.title}</h1>
      <SearchBox
        locale={lang}
        productBase={localePath(lang, "product")}
        labels={t.search}
      />
    </div>
  );
}
