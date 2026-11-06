"use client";
import type { Locale } from "@/src/lib/i18n/config";

const labels: Record<Locale, string> = { az: "AZ", en: "EN", ru: "RU" };
const homes: Record<Locale, string> = { az: "/", en: "/en", ru: "/ru" };

/** Uses the page's own hreflang alternates at click time, so localized slugs map correctly. */
export function LanguageSwitcher({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const go = (e: React.MouseEvent<HTMLAnchorElement>, l: Locale) => {
    const alt = document.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${l}"]`,
    );
    if (!alt) return; // fall back to the locale home (the href)
    e.preventDefault();
    const url = new URL(alt.href);
    window.location.assign(url.pathname + url.search);
  };
  return (
    <nav
      aria-label={label}
      className="flex items-center rounded-full border border-line p-0.5 text-xs font-semibold"
    >
      {(Object.keys(labels) as Locale[]).map((l) => (
        <a
          key={l}
          href={homes[l]}
          hrefLang={l}
          lang={l}
          onClick={(e) => go(e, l)}
          aria-current={l === current ? "true" : undefined}
          className={`rounded-full px-2.5 py-1.5 ${l === current ? "bg-brand text-white" : "text-muted hover:text-ink"}`}
        >
          {labels[l]}
        </a>
      ))}
    </nav>
  );
}
