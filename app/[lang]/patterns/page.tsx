import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, Globe2, ShieldCheck } from "lucide-react";
import {
  isLocale,
  localePath,
  locales,
  type Locale,
} from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { buildMetadata } from "@/src/lib/seo/metadata";
import { patternProductIds, patternProducts } from "@/src/lib/billing/patterns";
import { BuyPattern } from "@/src/components/site/buy-pattern";
import { getEnv } from "@/src/config/env";

export const revalidate = 3600;
const demoLabel: Record<Locale, string> = {
  az: "Demo nümunə məhsul",
  en: "Demo sample product",
  ru: "Демо-пример товара",
};

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/patterns">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return buildMetadata({
    locale: lang,
    title: t.patterns.title,
    description: t.patterns.lead,
    paths: Object.fromEntries(
      locales.map((l) => [l, localePath(l, "patterns")]),
    ) as Record<Locale, string>,
  });
}

export default async function Patterns({
  params,
}: PageProps<"/[lang]/patterns">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const env = getEnv();
  const ids = patternProductIds(env.POLAR_PATTERN_PRODUCTS);
  return (
    <div className="container-x py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t.patterns.title}
      </h1>
      <p className="mt-3 max-w-3xl text-muted">{t.patterns.lead}</p>
      <ul className="mt-6 flex flex-wrap gap-3 text-sm">
        <li className="chip">
          <Globe2 className="size-4" aria-hidden /> Polar · Merchant of Record
        </li>
        <li className="chip">
          <ShieldCheck className="size-4" aria-hidden /> {env.POLAR_ENVIRONMENT}
        </li>
        <li className="chip">
          <FileText className="size-4" aria-hidden /> PDF / DXF
        </li>
      </ul>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {patternProducts.map((p) => (
          <article
            key={p.key}
            className="flex flex-col rounded-3xl border border-line p-6"
          >
            <p className="text-xs font-semibold text-hivis-700 uppercase">
              {demoLabel[lang]}
            </p>
            <h2 className="mt-2 text-lg font-semibold">{p.names[lang]}</h2>
            <p className="mt-1 text-sm text-muted">
              {p.formats} · {p.sizes}
            </p>
            <div className="mt-auto pt-6">
              <BuyPattern
                productKey={p.key}
                lang={lang}
                label={t.patterns.buy}
                disabledLabel={t.patterns.disabled}
                enabled={Boolean(env.POLAR_ACCESS_TOKEN && ids[p.key])}
              />
            </div>
          </article>
        ))}
      </div>
      <p className="mt-8 rounded-2xl bg-surface p-4 text-sm text-muted">
        {t.patterns.note}
      </p>
    </div>
  );
}
