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

/** Deterministic (no Intl): identical output on server and client, so no hydration mismatch. */
export function formatPrice(_locale: Locale, amount: number, currency = "AZN") {
  const n = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return currency === "AZN" ? `${n} ₼` : `${n} ${currency}`;
}
