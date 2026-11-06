"use client";
import { useSyncExternalStore } from "react";

export type QuoteLine = {
  size: string | null;
  color: string | null;
  qty: number;
};
export type QuoteItem = {
  productId: number;
  sku: string;
  name: string;
  href: string;
  image?: string;
  colors: string[];
  sizes: string[];
  lines: QuoteLine[];
};

const KEY = "ct-quote-v1";
const listeners = new Set<() => void>();
let cache: QuoteItem[] | null = null;

function read(): QuoteItem[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as QuoteItem[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}
function write(items: QuoteItem[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  listeners.forEach((l) => l());
}
const EMPTY: QuoteItem[] = [];

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

export function useQuote() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}

export const quote = {
  add(item: Omit<QuoteItem, "lines">, line: QuoteLine) {
    const items = [...read()];
    const i = items.findIndex((x) => x.productId === item.productId);
    if (i === -1) items.push({ ...item, lines: [line] });
    else {
      const existing = items[i];
      const j = existing.lines.findIndex(
        (l) => l.size === line.size && l.color === line.color,
      );
      const lines = [...existing.lines];
      if (j === -1) lines.push(line);
      else lines[j] = { ...lines[j], qty: lines[j].qty + line.qty };
      items[i] = { ...existing, lines };
    }
    write(items);
  },
  setLines(productId: number, lines: QuoteLine[]) {
    write(read().map((x) => (x.productId === productId ? { ...x, lines } : x)));
  },
  remove(productId: number) {
    write(read().filter((x) => x.productId !== productId));
  },
  clear() {
    write([]);
  },
};

export const totalQty = (items: QuoteItem[]) =>
  items.reduce((a, i) => a + i.lines.reduce((b, l) => b + (l.qty || 0), 0), 0);
