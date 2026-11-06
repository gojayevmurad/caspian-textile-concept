import { isLocale, localePath } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";

export function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang");
  const locale = isLocale(lang) ? lang : "az";
  const t = getDictionary(locale);
  const manifest = {
    id: "/",
    name: `${t.meta.siteName} — ${t.meta.tagline}`,
    short_name: t.meta.siteName,
    description: t.meta.description,
    lang: locale,
    start_url:
      localePath(locale) + (locale === "az" ? "?source=pwa" : "?source=pwa"),
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2b2d4f",
    categories: ["business", "shopping"],
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/brand/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: t.nav.catalog, url: localePath(locale, "catalog") },
      { name: t.nav.quote, url: localePath(locale, "quote") },
      { name: t.nav.search, url: localePath(locale, "search") },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
