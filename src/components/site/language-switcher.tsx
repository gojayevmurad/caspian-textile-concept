"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/src/lib/i18n/config";

const labels: Record<Locale, string> = { az: "AZ", en: "EN", ru: "RU" };
const homes: Record<Locale, string> = { az: "/", en: "/en", ru: "/ru" };

/** Reads the page's own hreflang alternates, so product/category slugs map correctly per language. */
export function LanguageSwitcher({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const pathname = usePathname();
  const [links, setLinks] = useState<Record<Locale, string>>(homes);
  useEffect(() => {
    const next = { ...homes };
    document
      .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')
      .forEach((l) => {
        const lang = l.hreflang as Locale;
        if (lang in next)
          next[lang] = new URL(l.href).pathname + new URL(l.href).search;
      });
    setLinks(next);
  }, [pathname]);
  return (
    <nav
      aria-label={label}
      className="flex items-center rounded-full border border-line p-0.5 text-xs font-semibold"
    >
      {(Object.keys(labels) as Locale[]).map((l) => (
        <a
          key={l}
          href={links[l]}
          hrefLang={l}
          lang={l}
          aria-current={l === current ? "true" : undefined}
          className={`rounded-full px-2.5 py-1.5 ${l === current ? "bg-brand text-white" : "text-muted hover:text-ink"}`}
        >
          {labels[l]}
        </a>
      ))}
    </nav>
  );
}
