import type { Metadata } from "next";
import { locales, ogLocale, type Locale } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";

export const siteUrl = () =>
  (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
export const indexable = () => process.env.SITE_INDEXABLE === "true";

type Input = {
  locale: Locale;
  title: string;
  description: string;
  /** Path of this page in every locale it exists in (e.g. { az: "/kataloq", en: "/en/catalog" }). */
  paths: Partial<Record<Locale, string>>;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
};

export function buildMetadata({
  locale,
  title,
  description,
  paths,
  image,
  type = "website",
  noindex,
}: Input): Metadata {
  const t = getDictionary(locale);
  const languages: Record<string, string> = {};
  for (const l of locales) if (paths[l]) languages[l] = paths[l]!;
  if (paths.az) languages["x-default"] = paths.az;
  const index = indexable() && !noindex;
  return {
    metadataBase: new URL(siteUrl()),
    title,
    description,
    alternates: { canonical: paths[locale], languages },
    openGraph: {
      type,
      title,
      description,
      url: paths[locale],
      siteName: t.meta.siteName,
      locale: ogLocale[locale],
      alternateLocale: locales
        .filter((l) => l !== locale && paths[l])
        .map((l) => ogLocale[l]),
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
    robots: index
      ? { index: true, follow: true, "max-image-preview": "large" }
      : { index: false, follow: false },
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped cannot break out of the script element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
