import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  isLocale,
  localePath,
  locales,
  type Locale,
} from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { buildMetadata } from "@/src/lib/seo/metadata";

export const revalidate = 86400;
const text = {
  az: [
    "Bu, konsept demo üçün qaralama məxfilik qeydidir və hüquqi baxışdan keçməyib.",
    "Sorğu formasında göndərdiyiniz məlumatlar (şirkət, əlaqə, e-poçt, telefon, loqo) yalnız sorğuya cavab vermək üçün saxlanılır. Demo rejimində məlumatlar şirkətə ötürülmür.",
    "Analitika yalnız açıq razılığınızdan sonra işləyir. Sorğu səbəti brauzerinizin yaddaşında saxlanılır.",
  ],
  en: [
    "This is a draft privacy note for the concept demo and has not been legally reviewed.",
    "Data you send through the request form (company, contact, email, phone, logo) is stored only to answer the request. In demo mode it is never forwarded to the company.",
    "Analytics runs only after explicit consent. The quote basket is stored in your browser.",
  ],
  ru: [
    "Это черновик уведомления о конфиденциальности для концепт-демо; юридическая проверка не проводилась.",
    "Данные из формы запроса (компания, контакт, почта, телефон, логотип) хранятся только для ответа на запрос. В демо-режиме они не передаются компании.",
    "Аналитика работает только после явного согласия. Корзина запроса хранится в вашем браузере.",
  ],
};

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return buildMetadata({
    locale: lang,
    title: t.footer.privacy,
    description: text[lang][0],
    paths: Object.fromEntries(
      locales.map((l) => [l, localePath(l, "privacy")]),
    ) as Record<Locale, string>,
    noindex: true,
  });
}

export default async function Privacy({
  params,
}: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="text-3xl font-bold">{t.footer.privacy}</h1>
      {text[lang].map((p) => (
        <p key={p} className="mt-4 leading-relaxed text-muted">
          {p}
        </p>
      ))}
    </div>
  );
}
