import type { Locale } from "@/src/lib/i18n/config";

/** Demo digital products (patterns/tech-packs). Clearly labelled as examples on the page. */
export const patternProducts: {
  key: string;
  names: Record<Locale, string>;
  formats: string;
  sizes: string;
}[] = [
  {
    key: "workwear-set",
    names: {
      az: "İki hissəli iş dəsti lekalosu",
      en: "Two-piece workwear set pattern",
      ru: "Лекала рабочего комплекта из двух предметов",
    },
    formats: "PDF + DXF",
    sizes: "XS–4XL",
  },
  {
    key: "coverall",
    names: {
      az: "Kombinezon lekalosu",
      en: "Coverall pattern",
      ru: "Лекала комбинезона",
    },
    formats: "PDF + DXF",
    sizes: "S–3XL",
  },
  {
    key: "chef-jacket",
    names: {
      az: "Aşpaz gödəkçəsi tech-pack",
      en: "Chef jacket tech-pack",
      ru: "Tech-pack поварского кителя",
    },
    formats: "PDF",
    sizes: "XS–3XL",
  },
];

export function patternProductIds(
  raw: string | undefined,
): Record<string, string> {
  try {
    const parsed = JSON.parse(raw || "{}");
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}
