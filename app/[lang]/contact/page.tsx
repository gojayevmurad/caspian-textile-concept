import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle, Phone, Mail } from "lucide-react";
import {
  isLocale,
  localePath,
  locales,
  type Locale,
} from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { company, tel } from "@/src/config/company";
import { buildMetadata } from "@/src/lib/seo/metadata";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return buildMetadata({
    locale: lang,
    title: t.contact.title,
    description: t.contact.lead,
    paths: Object.fromEntries(
      locales.map((l) => [l, localePath(l, "contact")]),
    ) as Record<Locale, string>,
  });
}

export default async function Contact({
  params,
}: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const { lat, lng } = company.factory.geo;
  const places = [
    {
      title: t.contact.office,
      address: company.office.address[lang],
      phones: company.office.phones,
      map: `https://www.openstreetmap.org/search?query=${encodeURIComponent(company.office.address.en)}`,
    },
    {
      title: t.contact.factory,
      address: company.factory.address[lang],
      phones: company.factory.phones,
      map: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
    },
  ];
  return (
    <div className="container-x py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t.contact.title}
      </h1>
      <p className="mt-2 text-muted">{t.contact.lead}</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {places.map((p) => (
          <section key={p.title} className="rounded-3xl border border-line p-6">
            <h2 className="text-lg font-semibold">{p.title}</h2>
            <p className="mt-3 flex gap-2 text-muted">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />{" "}
              {p.address}
            </p>
            <ul className="mt-3 space-y-1">
              {p.phones.map((ph) => (
                <li key={ph}>
                  <a
                    href={tel(ph)}
                    className="inline-flex items-center gap-2 font-medium hover:text-brand"
                  >
                    <Phone className="size-4" aria-hidden /> {ph}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={p.map}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
            >
              {t.contact.route} ↗
            </a>
          </section>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={`mailto:${company.email}`} className="btn-ghost">
          <Mail className="size-4" aria-hidden /> {company.email}
        </a>
        <a
          href={`https://wa.me/${company.whatsapp.replace("+", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
        >
          <MessageCircle className="size-4" aria-hidden /> {t.contact.whatsapp}
        </a>
        <a href={localePath(lang, "quote")} className="btn-primary">
          {t.nav.getQuote}
        </a>
      </div>
      {/* Static map image instead of a third-party embed: no API key, no cookies, no layout shift. */}
      <a
        href={places[1].map}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 block overflow-hidden rounded-3xl border border-line bg-brand-50 p-8 text-center"
      >
        <MapPin className="mx-auto size-8 text-hivis-700" aria-hidden />
        <p className="mt-2 font-semibold">{company.factory.address[lang]}</p>
        <p className="text-sm text-muted">
          {lat.toFixed(5)}, {lng.toFixed(5)} · OpenStreetMap ↗
        </p>
      </a>
    </div>
  );
}
