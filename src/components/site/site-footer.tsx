import Link from "next/link";
import type { Locale } from "@/src/lib/i18n/config";
import { localePath } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { company, tel } from "@/src/config/company";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-x grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <img
            src="/brand/logo.webp"
            alt={company.name}
            width={106}
            height={96}
            className="h-12 w-auto"
            loading="lazy"
          />
          <p className="mt-4 max-w-md text-sm text-muted">{t.footer.about}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t.footer.links}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link
                href={localePath(locale, "catalog")}
                className="hover:text-ink"
              >
                {t.nav.catalog}
              </Link>
            </li>
            <li>
              <Link
                href={localePath(locale, "industries")}
                className="hover:text-ink"
              >
                {t.nav.industries}
              </Link>
            </li>
            <li>
              <Link
                href={localePath(locale, "about")}
                className="hover:text-ink"
              >
                {t.nav.about}
              </Link>
            </li>
            <li>
              <Link
                href={localePath(locale, "patterns")}
                className="hover:text-ink"
              >
                {t.nav.patterns}
              </Link>
            </li>
            <li>
              <Link
                href={localePath(locale, "case-study")}
                className="hover:text-ink"
              >
                Case study
              </Link>
            </li>
            <li>
              <Link
                href={localePath(locale, "privacy")}
                className="hover:text-ink"
              >
                {t.footer.privacy}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t.footer.contact}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <a
                href={tel(company.office.phones[0])}
                className="hover:text-ink"
              >
                {company.office.phones[0]}
              </a>
            </li>
            <li>
              <a
                href={tel(company.factory.phones[0])}
                className="hover:text-ink"
              >
                {company.factory.phones[0]}
              </a>
            </li>
            <li>
              <a href={`mailto:${company.email}`} className="hover:text-ink">
                {company.email}
              </a>
            </li>
            <li>{company.factory.address[locale]}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>{t.footer.legal}</p>
          <p>{t.footer.madeBy}</p>
        </div>
      </div>
    </footer>
  );
}
