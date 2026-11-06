import { asc, sql } from "drizzle-orm";
import { adminContext } from "@/src/lib/admin/context";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { saveCategory } from "@/src/lib/admin/actions/misc";
import { Denied, PageHeader, Saved } from "@/src/components/admin/ui";
import { locales } from "@/src/lib/i18n/config";

export const metadata = { title: "Kateqoriyalar" };
const kindLabel = {
  industry: "Sənaye",
  type: "Məhsul növü",
  feature: "Xüsusiyyət",
} as const;

export default async function Categories({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { readOnly } = await adminContext();
  const sp = await searchParams;
  const cats = await db()
    .select({
      c: s.category,
      n: sql<number>`(select count(*)::int from ${s.productCategory} where category_id = "category"."id")`,
    })
    .from(s.category)
    .orderBy(asc(s.category.position));
  const tr = await db().select().from(s.categoryTranslation);
  return (
    <>
      <PageHeader
        title="Kateqoriyalar"
        description="Köhnə saytın 57 qarışıq kateqoriyası 3 taksonomiyaya bölündü: sənaye, məhsul növü, xüsusiyyət (filtr). Adlar az/en/ru."
      />
      <Denied show={sp.denied === "1"} />
      <Saved show={sp.saved === "1"} />
      <div className="space-y-3">
        {cats.map(({ c, n }) => (
          <details key={c.id} id={`cat-${c.id}`} className="card p-4">
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
              <span className="chip">
                {kindLabel[c.kind as keyof typeof kindLabel]}
              </span>
              <span className="font-semibold">
                {
                  tr.find((t) => t.categoryId === c.id && t.locale === "az")
                    ?.name
                }
              </span>
              <span className="text-muted">{n} məhsul</span>
              <span className="ml-auto font-mono text-xs text-muted">
                köhnə slug: {c.legacySlugs.length}
              </span>
            </summary>
            <form action={saveCategory} className="mt-4">
              <input type="hidden" name="id" value={c.id} />
              <fieldset
                disabled={readOnly}
                className="grid gap-3 md:grid-cols-3"
              >
                {locales.map((l) => {
                  const t = tr.find(
                    (x) => x.categoryId === c.id && x.locale === l,
                  );
                  return (
                    <div key={l} className="space-y-2">
                      <label className="block">
                        <span className="label">{l.toUpperCase()} ad</span>
                        <input
                          name={`${l}.name`}
                          defaultValue={t?.name}
                          required
                          className="input"
                        />
                      </label>
                      <label className="block">
                        <span className="label">{l.toUpperCase()} təsvir</span>
                        <textarea
                          name={`${l}.description`}
                          defaultValue={t?.description ?? ""}
                          rows={2}
                          className="input py-2"
                        />
                      </label>
                    </div>
                  );
                })}
                <div className="md:col-span-3">
                  <button className="btn-primary">Yadda saxla</button>
                </div>
              </fieldset>
            </form>
          </details>
        ))}
      </div>
    </>
  );
}
