// Locale + localized URL configuration shared by the proxy, pages, sitemap and importer.
// Keep this file free of server-only imports.
export const locales = ["az", "en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "az";

export const isLocale = (v: string | undefined | null): v is Locale =>
  !!v && (locales as readonly string[]).includes(v);

export const localeNames: Record<Locale, string> = {
  az: "Azərbaycan",
  en: "English",
  ru: "Русский",
};
export const htmlLang: Record<Locale, string> = {
  az: "az",
  en: "en",
  ru: "ru",
};
export const ogLocale: Record<Locale, string> = {
  az: "az_AZ",
  en: "en_US",
  ru: "ru_RU",
};

/** Internal route segment (folder under app/[lang]) → localized public segment. */
export const routeSegments = {
  catalog: { az: "kataloq", en: "catalog", ru: "katalog" },
  product: { az: "mehsul", en: "product", ru: "tovar" },
  industries: { az: "senayeler", en: "industries", ru: "otrasli" },
  about: { az: "haqqimizda", en: "about", ru: "o-kompanii" },
  contact: { az: "elaqe", en: "contact", ru: "kontakty" },
  quote: { az: "sorgu", en: "quote", ru: "zapros" },
  sample: { az: "numune", en: "sample", ru: "obrazec" },
  search: { az: "axtaris", en: "search", ru: "poisk" },
  patterns: { az: "lekalolar", en: "patterns", ru: "lekala" },
  "case-study": { az: "case-study", en: "case-study", ru: "case-study" },
  privacy: { az: "mexfilik", en: "privacy", ru: "konfidencialnost" },
  offline: { az: "offline", en: "offline", ru: "offline" },
} as const satisfies Record<string, Record<Locale, string>>;
export type RouteKey = keyof typeof routeSegments;

const reverse: Record<Locale, Map<string, RouteKey>> = {
  az: new Map(),
  en: new Map(),
  ru: new Map(),
};
for (const [key, byLocale] of Object.entries(routeSegments) as [
  RouteKey,
  Record<Locale, string>,
][])
  for (const l of locales) reverse[l].set(byLocale[l], key);

export function internalSegment(
  locale: Locale,
  publicSegment: string,
): RouteKey | undefined {
  return reverse[locale].get(publicSegment);
}

/** Public URL path for a route in a locale. `az` has no prefix. */
export function localePath(
  locale: Locale,
  key?: RouteKey,
  ...rest: (string | number)[]
): string {
  const parts = [locale === defaultLocale ? "" : locale];
  if (key) parts.push(routeSegments[key][locale]);
  for (const r of rest) parts.push(encodeURIComponent(String(r)));
  const path = parts.filter(Boolean).join("/");
  return "/" + path;
}

/** Translate a public path into the internal `/{lang}/{segment}/...` path used by the App Router. */
export function toInternalPath(
  pathname: string,
):
  | { locale: Locale; internal: string; canonicalRedirect?: undefined }
  | { canonicalRedirect: string; locale?: undefined; internal?: undefined } {
  const segs = pathname.split("/").filter(Boolean);
  let locale: Locale = defaultLocale;
  if (segs[0] === defaultLocale) {
    // /az/... is not canonical: the default locale lives at the root.
    return { canonicalRedirect: "/" + segs.slice(1).join("/") };
  }
  if (isLocale(segs[0])) locale = segs.shift() as Locale;
  if (segs.length) {
    const key = internalSegment(locale, segs[0]);
    if (key) segs[0] = key;
    else return { locale, internal: `/${locale}/__unknown/${segs.join("/")}` };
  }
  return { locale, internal: "/" + [locale, ...segs].join("/") };
}

const azMap: Record<string, string> = {
  ə: "e",
  ı: "i",
  ö: "o",
  ü: "u",
  ğ: "g",
  ş: "sh",
  ç: "ch",
  i̇: "i",
};
const ruMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

/** ASCII slug with Azerbaijani and Russian transliteration. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[əıöüğşç]|i̇/g, (c) => azMap[c] ?? c)
    .replace(/[а-яё]/g, (c) => ruMap[c] ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Search folding: lowercase, Azerbaijani letters → ASCII, diacritics removed (users often type without them). */
export function foldForSearch(input: string): string {
  return input
    .toLowerCase()
    .replace(/ə/g, "e")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
