"use client";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useQuote } from "./quote-store";

export function QuoteBadge({ href, label }: { href: string; label: string }) {
  const items = useQuote();
  return (
    <Link
      href={href}
      className="relative inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface"
      aria-label={`${label} (${items.length})`}
    >
      <ClipboardList className="size-5" aria-hidden />
      {items.length > 0 && (
        <span className="absolute top-1 right-1 min-w-5 rounded-full bg-hivis-700 px-1 text-center text-[11px] leading-5 font-bold text-white">
          {items.length}
        </span>
      )}
    </Link>
  );
}
