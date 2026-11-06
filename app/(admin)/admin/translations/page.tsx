import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { adminContext } from "@/src/lib/admin/context";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { approveTranslations } from "@/src/lib/admin/actions/products";
import { Badge, Denied, PageHeader, Saved } from "@/src/components/admin/ui";

export const metadata = { title: "Tərcümələr" };

export default async function Translations({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { readOnly } = await adminContext();
  const sp = await searchParams;
  const locale = sp.locale === "ru" ? "ru" : "az";
  const rows = await db()
    .select({ t: s.productTranslation, sku: s.product.sku })
    .from(s.productTranslation)
    .innerJoin(s.product, eq(s.product.id, s.productTranslation.productId))
    .where(
      and(
        eq(s.productTranslation.locale, locale),
        inArray(s.productTranslation.status, ["ai_draft", "untranslated"]),
      ),
    )
    .orderBy(asc(s.product.position))
    .limit(200);
  const en = await db()
    .select({
      id: s.productTranslation.productId,
      name: s.productTranslation.name,
    })
    .from(s.productTranslation)
    .where(eq(s.productTranslation.locale, "en"));
  const enName = new Map(en.map((e) => [e.id, e.name]));
  return (
    <>
      <PageHeader
        title="Tərcümə növbəsi"
        description="Köhnə saytda məhsulların 86%-i yalnız ingiliscə idi. AI qaralamaları burada yoxlanılır və təsdiqlənir; təsdiqlənənlər saytda “AI tərcüməsi” nişanı olmadan göstərilir."
      />
      <Denied show={sp.denied === "1"} />
      <Saved show={sp.saved === "1"} />
      <nav className="mb-4 flex gap-2 text-sm">
        {(["az", "ru"] as const).map((l) => (
          <Link
            key={l}
            href={`/admin/translations?locale=${l}`}
            className={`rounded-full px-3 py-1 ring-1 ${locale === l ? "bg-brand text-white ring-brand" : "ring-line"}`}
          >
            {l.toUpperCase()}
          </Link>
        ))}
      </nav>
      <form action={approveTranslations}>
        <input
          type="hidden"
          name="back"
          value={`/admin/translations?locale=${locale}`}
        />
        <fieldset disabled={readOnly}>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th w-8" />
                  <th className="th">Mənbə (EN)</th>
                  <th className="th">{locale.toUpperCase()} qaralama</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ t, sku }) => (
                  <tr key={t.productId} className="align-top hover:bg-surface">
                    <td className="td">
                      {t.status === "ai_draft" && (
                        <input
                          type="checkbox"
                          name="key"
                          value={`${t.productId}:${locale}`}
                          aria-label={`Təsdiqlə: ${t.name}`}
                          className="accent-[var(--color-brand)]"
                        />
                      )}
                    </td>
                    <td className="td">
                      <Link
                        href={`/admin/products/${t.productId}`}
                        className="font-medium hover:text-brand"
                      >
                        {enName.get(t.productId)}
                      </Link>
                      <p className="font-mono text-xs text-muted">{sku}</p>
                    </td>
                    <td className="td">
                      <p className="font-medium">{t.name}</p>
                      <p className="line-clamp-2 text-xs text-muted">
                        {t.shortDescription}
                      </p>
                    </td>
                    <td className="td">
                      <Badge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sticky bottom-0 mt-4 flex items-center gap-3 border-t border-line bg-surface/90 py-3 backdrop-blur">
            <button className="btn-primary">Seçilənləri təsdiqlə</button>
            <span className="text-xs text-muted">
              {rows.length} qeyd növbədə
            </span>
          </div>
        </fieldset>
      </form>
    </>
  );
}
