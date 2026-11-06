"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import az from "@/src/lib/i18n/dictionaries/az";
import en from "@/src/lib/i18n/dictionaries/en";
import ru from "@/src/lib/i18n/dictionaries/ru";
import { isLocale, localePath } from "@/src/lib/i18n/config";

const strings = {
  az: { ...az.common, home: az.nav.home, catalog: az.nav.catalog },
  en: { ...en.common, home: en.nav.home, catalog: en.nav.catalog },
  ru: { ...ru.common, home: ru.nav.home, catalog: ru.nav.catalog },
};

export default function NotFound() {
  const params = useParams<{ lang?: string }>();
  const locale = isLocale(params?.lang) ? params.lang : "az";
  const t = strings[locale];
  return (
    <section className="container-x py-24 text-center">
      <p className="text-sm font-semibold text-hivis-700">404</p>
      <h1 className="mt-2 text-3xl font-bold">{t.notFound}</h1>
      <p className="mt-3 text-muted">{t.notFoundText}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href={localePath(locale)} className="btn-primary">
          {t.home}
        </Link>
        <Link href={localePath(locale, "catalog")} className="btn-ghost">
          {t.catalog}
        </Link>
      </div>
    </section>
  );
}
