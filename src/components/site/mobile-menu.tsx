"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileMenu({
  links,
  openLabel,
  closeLabel,
  cta,
}: {
  links: { href: string; label: string }[];
  openLabel: string;
  closeLabel: string;
  cta: { href: string; label: string };
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? closeLabel : openLabel}
        className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface"
      >
        {open ? (
          <X className="size-5" aria-hidden />
        ) : (
          <Menu className="size-5" aria-hidden />
        )}
      </button>
      {open && (
        <div
          id="mobile-nav"
          className="fixed inset-x-0 top-[var(--header-h,104px)] bottom-0 z-40 overflow-y-auto bg-white px-4 pt-4 pb-10"
        >
          <ul className="divide-y divide-line">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block py-4 text-lg font-semibold"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={cta.href}
            onClick={() => setOpen(false)}
            className="btn-primary mt-6 w-full"
          >
            {cta.label}
          </Link>
        </div>
      )}
    </div>
  );
}
