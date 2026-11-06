import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import "./site.css";
import { htmlLang, isLocale, locales } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { SiteHeader } from "@/src/components/site/site-header";
import { SiteFooter } from "@/src/components/site/site-footer";
import { DemoBanner } from "@/src/components/site/demo-banner";
import { siteUrl, indexable } from "@/src/lib/seo/metadata";
import { ServiceWorker } from "@/src/components/site/service-worker";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const revalidate = 3600;
export async function generateStaticParams() {
  // Rendered on first request and cached (ISR); builds need no database.
  return [];
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${t.meta.siteName} — ${t.meta.tagline}`,
      template: `%s · ${t.meta.siteName}`,
    },
    description: t.meta.description,
    applicationName: t.meta.siteName,
    manifest:
      lang === "az"
        ? "/manifest.webmanifest"
        : `/manifest.webmanifest?lang=${lang}`,
    robots: indexable() ? undefined : { index: false, follow: false },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#2b2d4f",
  width: "device-width",
  initialScale: 1,
  // Zoom stays enabled (the old site disabled it — WCAG 1.4.4).
};

export default async function SiteLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <html lang={htmlLang[lang]} className={inter.variable}>
      <body className="font-sans">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-brand px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          {t.nav.skip}
        </a>
        <DemoBanner locale={lang} />
        <SiteHeader locale={lang} />
        <main id="main">{children}</main>
        <SiteFooter locale={lang} />
        <ServiceWorker />
      </body>
    </html>
  );
}

export const dynamicParams = true;
