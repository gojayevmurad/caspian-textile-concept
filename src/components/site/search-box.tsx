"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useQueryParam } from "./use-query-param";

type Result = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  image: string | null;
};

export function SearchBox({
  locale,
  productBase,
  labels,
}: {
  locale: string;
  productBase: string;
  labels: { placeholder: string; noResults: string; hint: string };
}) {
  const urlQ = useQueryParam("q");
  const [typed, setQ] = useState<string | null>(null);
  const q = typed ?? urlQ ?? "";
  const [results, setResults] = useState<Result[] | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?lang=${locale}&q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal },
        );
        setResults((await res.json()).results);
        window.history.replaceState(
          window.history.state,
          "",
          `?q=${encodeURIComponent(q)}`,
        );
      } catch {}
    }, 160);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q, locale]);
  return (
    <div>
      <label className="relative block">
        <span className="sr-only">{labels.placeholder}</span>
        <Search
          className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={labels.placeholder}
          className="input min-h-14 rounded-2xl pl-12 text-base"
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>
      <div aria-live="polite" className="mt-6">
        {results === null || q.trim().length < 2 ? (
          <p className="text-sm text-muted">{labels.hint}</p>
        ) : results.length === 0 ? (
          <p className="text-muted">{labels.noResults}</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  href={`${productBase}/${r.slug}`}
                  className="flex items-center gap-4 p-3 hover:bg-surface"
                >
                  {r.image ? (
                    <img
                      src={`/media/${r.image}`}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 rounded-xl bg-surface object-contain p-1 mix-blend-multiply"
                    />
                  ) : (
                    <span className="size-14 rounded-xl bg-surface" />
                  )}
                  <span>
                    <span className="block font-medium">{r.name}</span>
                    <span className="text-xs text-muted">{r.sku}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
