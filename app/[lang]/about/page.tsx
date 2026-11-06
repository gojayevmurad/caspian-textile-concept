import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Factory,
  Scissors,
  Palette,
  Stamp,
  Package,
  PenTool,
} from "lucide-react";
import {
  isLocale,
  localePath,
  locales,
  type Locale,
} from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { company } from "@/src/config/company";
import { buildMetadata } from "@/src/lib/seo/metadata";

export const revalidate = 86400;
const icons = [PenTool, Scissors, Factory, Palette, Stamp, Package];

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return buildMetadata({
    locale: lang,
    title: t.about.title,
    description: t.about.lead,
    paths: Object.fromEntries(
      locales.map((l) => [l, localePath(l, "about")]),
    ) as Record<Locale, string>,
  });
}

export default async function About({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <div className="container-x py-12">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t.about.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            {t.about.lead}
          </p>
          <h2 className="mt-10 text-xl font-bold">{t.about.capabilities}</h2>
          <ul className="mt-4 space-y-2">
            {t.about.capabilityList.map((c) => (
              <li key={c} className="flex gap-2 text-muted">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-hivis"
                  aria-hidden
                />{" "}
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-8 rounded-2xl bg-surface p-4 text-sm text-muted">
            {t.about.clientsNote}
          </p>
        </div>
        <aside className="h-fit rounded-3xl border border-line p-6">
          <h2 className="font-semibold">{t.about.factsTitle}</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-muted">{t.contact.factory}</dt>
              <dd className="font-medium">{company.factory.address[lang]}</dd>
            </div>
            <div>
              <dt className="text-muted">{t.contact.office}</dt>
              <dd className="font-medium">{company.office.address[lang]}</dd>
            </div>
            <div>
              <dt className="text-muted">{t.contact.phone}</dt>
              <dd className="font-medium">
                {company.factory.phones.join(" · ")}
              </dd>
            </div>
          </dl>
          <Link
            href={localePath(lang, "contact")}
            className="btn-primary mt-6 w-full"
          >
            {t.nav.contact}
          </Link>
        </aside>
      </div>
      <section className="mt-16" aria-labelledby="chain">
        <h2 id="chain" className="text-2xl font-bold">
          {t.home.processTitle}
        </h2>
        <ol className="relative mt-8 grid gap-6 border-l-2 border-brand-100 pl-6 md:grid-cols-3 md:border-l-0 md:pl-0">
          {t.home.process.map((s, i) => {
            const Icon = icons[i];
            return (
              <li
                key={s.title}
                className="relative rounded-2xl border border-line p-5"
              >
                <Icon className="size-6 text-brand" aria-hidden />
                <p className="mt-3 text-xs font-bold text-hivis-700">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
