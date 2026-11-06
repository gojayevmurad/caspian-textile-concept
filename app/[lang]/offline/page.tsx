import { notFound } from "next/navigation";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { isLocale, localePath } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";

export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ lang: "az" }, { lang: "en" }, { lang: "ru" }];
}
export const metadata = { robots: { index: false } };

export default async function Offline({
  params,
}: PageProps<"/[lang]/offline">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <div className="container-x py-24 text-center">
      <WifiOff className="mx-auto size-10 text-muted" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold">{t.offline.title}</h1>
      <p className="mx-auto mt-2 max-w-md text-muted">{t.offline.text}</p>
      <Link href={localePath(lang, "quote")} className="btn-primary mt-8">
        {t.nav.quote}
      </Link>
    </div>
  );
}
