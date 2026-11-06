import Link from "next/link";
import { Search } from "lucide-react";
import type { Locale } from "@/src/lib/i18n/config";
import { localePath } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";
import { QuoteBadge } from "./quote-badge";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const links = [
    { href: localePath(locale, "catalog"), label: t.nav.catalog },
    { href: localePath(locale, "industries"), label: t.nav.industries },
    { href: localePath(locale, "about"), label: t.nav.about },
    { href: localePath(locale, "patterns"), label: t.nav.patterns },
    { href: localePath(locale, "contact"), label: t.nav.contact },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-x flex h-16 items-center gap-3">
        <Link
          href={localePath(locale)}
          className="mr-2 flex shrink-0 items-center gap-2"
          aria-label={`${t.meta.siteName} — ${t.nav.home}`}
        >
          <img
            src="/brand/logo.webp"
            alt=""
            width={106}
            height={96}
            className="h-10 w-auto"
          />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1 text-sm font-medium">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="rounded-full px-3 py-2 text-ink/80 hover:bg-surface hover:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href={localePath(locale, "search")}
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface"
            aria-label={t.nav.search}
          >
            <Search className="size-5" aria-hidden />
          </Link>
          <QuoteBadge href={localePath(locale, "quote")} label={t.nav.quote} />
          <div className="hidden sm:block">
            <LanguageSwitcher current={locale} label={t.nav.language} />
          </div>
          <Link
            href={localePath(locale, "quote")}
            className="btn-primary ml-2 hidden lg:inline-flex"
          >
            {t.nav.getQuote}
          </Link>
          <MobileMenu
            links={links}
            openLabel={t.nav.menu}
            closeLabel={t.nav.close}
            cta={{ href: localePath(locale, "quote"), label: t.nav.getQuote }}
          />
        </div>
      </div>
      <div className="container-x flex justify-end pb-2 sm:hidden">
        <LanguageSwitcher current={locale} label={t.nav.language} />
      </div>
    </header>
  );
}
