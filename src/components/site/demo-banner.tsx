import Link from "next/link";
import type { Locale } from "@/src/lib/i18n/config";
import { localePath } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";

export function DemoBanner({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <div role="note" className="bg-brand-800 text-white">
      <p className="container-x flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-xs sm:text-sm">
        <span>{t.demo.banner}</span>
        <Link
          href={localePath(locale, "case-study")}
          className="font-semibold text-[#ffb27d] underline underline-offset-2 hover:text-white"
        >
          {t.demo.more}
        </Link>
      </p>
    </div>
  );
}
