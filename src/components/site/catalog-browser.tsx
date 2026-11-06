"use client";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { CategoryView, ProductSummary } from "@/src/lib/catalog/queries";
import type { Locale } from "@/src/lib/i18n/config";
import { colorNames } from "@/src/lib/catalog/taxonomy";
import { byRecommended } from "@/src/lib/catalog/rank";
import { ProductCard, type CardLabels } from "./product-card";

type Labels = {
  filters: string;
  industry: string;
  type: string;
  feature: string;
  color: string;
  all: string;
  clear: string;
  results: string;
  noResults: string;
  sort: string;
  sortFeatured: string;
  sortName: string;
  sortNew: string;
  loadMore: string;
  showFilters: string;
  apply: string;
  close: string;
};
const PAGE = 24;
const FACETS = ["industry", "type", "feature", "color"] as const;
type Facet = (typeof FACETS)[number];

export function CatalogBrowser({
  products,
  categories,
  locale,
  labels,
  card,
  fixed,
}: {
  products: ProductSummary[];
  categories: CategoryView[];
  locale: Locale;
  labels: Labels;
  card: CardLabels;
  /** Facet locked by the page (e.g. an industry landing page). */
  fixed?: { facet: Facet; value: string };
}) {
  // SSR renders the unfiltered list (crawlable, no layout shift); URL filters apply after mount.
  const [params, setParams] = useState(() => new URLSearchParams());
  useEffect(() => {
    const read = () => setParams(new URLSearchParams(window.location.search));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    const out = {} as Record<Facet, string[]>;
    for (const f of FACETS)
      out[f] = (params.get(f) ?? "").split(",").filter(Boolean);
    if (fixed) out[fixed.facet] = [fixed.value];
    return out;
  }, [params, fixed]);
  const sort = params.get("sort") ?? "featured";

  const matches = (p: ProductSummary, except?: Facet) =>
    FACETS.every((f) => {
      if (f === except || !selected[f].length) return true;
      if (f === "color")
        return selected.color.some((c) => p.colors.includes(c));
      return selected[f].some((v) => p.categories.includes(`${f}:${v}`));
    });

  const filtered = useMemo(() => {
    const list = products.filter((p) => matches(p));
    if (sort === "featured") list.sort(byRecommended);
    if (sort === "name")
      list.sort((a, b) => a.name.localeCompare(b.name, locale));
    else if (sort === "new")
      list.sort(
        (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id,
      );
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, selected, sort, locale]);

  const facetOptions = (f: Facet) => {
    const base = products.filter((p) => matches(p, f));
    if (f === "color") {
      const counts = new Map<string, number>();
      base.forEach((p) =>
        p.colors.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1)),
      );
      return [...counts]
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({
          key,
          name: colorNames[key]?.[locale] ?? key,
          count,
        }));
    }
    return categories
      .filter((c) => c.kind === f)
      .map((c) => ({
        key: c.key,
        name: c.name,
        count: base.filter((p) => p.categories.includes(`${f}:${c.key}`))
          .length,
      }))
      .filter((o) => o.count > 0 || selected[f].includes(o.key));
  };

  const update = (next: URLSearchParams) => {
    setLimit(PAGE);
    const qs = next.toString();
    // Instant client-side filtering: update the URL (shareable) without a server round-trip.
    window.history.replaceState(
      window.history.state,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
    setParams(next);
  };
  const toggle = (f: Facet, key: string) => {
    const next = new URLSearchParams(params);
    const values = new Set(selected[f]);
    if (values.has(key)) values.delete(key);
    else values.add(key);
    if (values.size) next.set(f, [...values].join(","));
    else next.delete(f);
    update(next);
  };
  const clear = () =>
    update(new URLSearchParams(sort !== "featured" ? { sort } : {}));
  const activeCount = FACETS.reduce(
    (a, f) => a + (f === fixed?.facet ? 0 : selected[f].length),
    0,
  );

  const filterPanel = (
    <div className="space-y-6">
      {FACETS.filter((f) => f !== fixed?.facet).map((f) => {
        const options = facetOptions(f);
        if (!options.length) return null;
        return (
          <fieldset key={f}>
            <legend className="mb-2 text-sm font-semibold">{labels[f]}</legend>
            <ul className="space-y-1">
              {options.map((o) => (
                <li key={o.key}>
                  <label className="flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-surface">
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--color-brand)]"
                      checked={selected[f].includes(o.key)}
                      onChange={() => toggle(f, o.key)}
                    />
                    {f === "color" && (
                      <span
                        className="size-3.5 rounded-full ring-1 ring-line"
                        style={{ backgroundColor: colorNames[o.key]?.hex }}
                        aria-hidden
                      />
                    )}
                    <span className="flex-1">{o.name}</span>
                    <span className="text-xs text-muted">{o.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        );
      })}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clear}
          className="text-sm font-semibold text-brand hover:underline"
        >
          {labels.clear}
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block" aria-label={labels.filters}>
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
          {filterPanel}
        </div>
      </aside>
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-ghost lg:hidden"
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="size-4" aria-hidden />{" "}
            {labels.showFilters}
            {activeCount > 0 && (
              <span className="rounded-full bg-brand px-1.5 text-xs text-white">
                {activeCount}
              </span>
            )}
          </button>
          <p className="text-sm text-muted" aria-live="polite">
            {labels.results.replace("{n}", String(filtered.length))}
          </p>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-muted">{labels.sort}</span>
            <select
              className="input min-h-9 w-auto py-1"
              value={sort}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                if (e.target.value === "featured") next.delete("sort");
                else next.set("sort", e.target.value);
                update(next);
              }}
            >
              <option value="featured">{labels.sortFeatured}</option>
              <option value="name">{labels.sortName}</option>
              <option value="new">{labels.sortNew}</option>
            </select>
          </label>
        </div>
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
            {labels.noResults}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {filtered.slice(0, limit).map((p, i) => (
              <li key={p.id} className="flex">
                <ProductCard
                  product={p}
                  locale={locale}
                  labels={card}
                  priority={i < 4}
                  headingLevel={2}
                />
              </li>
            ))}
          </ul>
        )}
        {filtered.length > limit && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setLimit(limit + PAGE)}
              className="btn-ghost"
            >
              {labels.loadMore} ({filtered.length - limit})
            </button>
          </div>
        )}
      </div>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={labels.filters}
          className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-semibold">{labels.filters}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex size-11 items-center justify-center"
              aria-label={labels.close}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{filterPanel}</div>
          <div className="border-t border-line p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-primary w-full"
            >
              {labels.apply} ·{" "}
              {labels.results.replace("{n}", String(filtered.length))}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
