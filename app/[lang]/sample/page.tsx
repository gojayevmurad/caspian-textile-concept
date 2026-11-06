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
import { QuotePage } from "@/src/components/site/quote-page";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/sample">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return buildMetadata({
    locale: lang,
    title: t.quote.sampleTitle,
    description: t.quote.sampleLead,
    paths: Object.fromEntries(
      locales.map((l) => [l, localePath(l, "sample")]),
    ) as Record<Locale, string>,
    noindex: true,
  });
}

export default async function Page({ params }: PageProps<"/[lang]/sample">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <QuotePage locale={lang} kind="sample" />;
}
