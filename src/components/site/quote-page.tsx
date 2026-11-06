import { Suspense } from "react";
import type { Locale } from "@/src/lib/i18n/config";
import { localePath } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { colorNames } from "@/src/lib/catalog/taxonomy";
import { QuoteForm } from "./quote-form";

export function QuotePage({
  locale,
  kind,
}: {
  locale: Locale;
  kind: "quote" | "sample";
}) {
  const t = getDictionary(locale);
  const colorLabels = Object.fromEntries(
    Object.entries(colorNames).map(([k, v]) => [k, v[locale]]),
  );
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {kind === "quote" ? t.quote.title : t.quote.sampleTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        {kind === "quote" ? t.quote.lead : t.quote.sampleLead}
      </p>
      <div className="mt-8">
        <Suspense>
          <QuoteForm
            locale={locale}
            labels={t.quote}
            colorLabels={colorLabels}
            catalogHref={localePath(locale, "catalog")}
            kind={kind}
          />
        </Suspense>
      </div>
    </div>
  );
}
