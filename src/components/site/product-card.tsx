import Link from "next/link";
import type { ProductSummary } from "@/src/lib/catalog/queries";
import { localePath, type Locale } from "@/src/lib/i18n/config";
import { formatPrice } from "@/src/lib/i18n";
import { colorNames } from "@/src/lib/catalog/taxonomy";
import { Picture } from "./picture";

export type CardLabels = {
  priceFrom: string;
  priceOnRequest: string;
  colors: string;
};

/** Shared by server pages and the client-side catalogue browser (no dictionary imports). */
export function ProductCard({
  product,
  locale,
  labels,
  priority = false,
  headingLevel = 3,
}: {
  product: ProductSummary;
  locale: Locale;
  labels: CardLabels;
  priority?: boolean;
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-shadow hover:shadow-lg hover:shadow-brand/5">
      <div className="aspect-square bg-surface p-4">
        <Picture
          media={product.image}
          sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 46vw"
          priority={priority}
          className="aspect-square mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
          {product.sku}
        </p>
        <H className="line-clamp-2 text-sm leading-snug font-semibold">
          <Link
            href={localePath(locale, "product", product.slug)}
            className="after:absolute after:inset-0"
          >
            {product.name}
          </Link>
        </H>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <p className="text-sm text-ink">
            {product.price
              ? labels.priceFrom.replace(
                  "{price}",
                  formatPrice(locale, product.price, product.currency),
                )
              : labels.priceOnRequest}
          </p>
          <ul className="flex -space-x-1" aria-label={labels.colors}>
            {product.colors.slice(0, 4).map((c) => (
              <li
                key={c}
                title={colorNames[c]?.[locale] ?? c}
                className="size-4 rounded-full border border-white ring-1 ring-line"
                style={{ backgroundColor: colorNames[c]?.hex ?? c }}
              />
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export const cardLabels = (t: {
  product: { priceFrom: string; priceOnRequest: string; colors: string };
}): CardLabels => ({
  priceFrom: t.product.priceFrom,
  priceOnRequest: t.product.priceOnRequest,
  colors: t.product.colors,
});
