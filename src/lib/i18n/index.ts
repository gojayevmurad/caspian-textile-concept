import az, { type Dictionary } from "./dictionaries/az";
import en from "./dictionaries/en";
import ru from "./dictionaries/ru";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { az, en, ru };
export type { Dictionary };
export const getDictionary = (locale: Locale): Dictionary =>
  dictionaries[locale];

/** Minimal "{name}" interpolation. */
export function format(
  template: string,
  vars: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

const numberLocales: Record<Locale, string> = {
  az: "az-AZ",
  en: "en-GB",
  ru: "ru-RU",
};
export function formatPrice(locale: Locale, amount: number, currency = "AZN") {
  try {
    return new Intl.NumberFormat(numberLocales[locale], {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
