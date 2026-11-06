import Link from "next/link";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { adminContext } from "@/src/lib/admin/context";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { Badge, PageHeader } from "@/src/components/admin/ui";
import type { MediaVariant } from "@/src/lib/media/process";

export const metadata = { title: "Məhsullar" };
const PAGE = 30;

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { readOnly } = await adminContext();
  const sp = await searchParams;
  const q = sp.q?.trim();
  const status = sp.status;
  const after = sp.after?.split("_"); // keyset cursor: "<epochMs>_<id>"
  const where: SQL[] = [];
  if (q)
    where.push(
      or(
        ilike(s.product.sku, `%${q}%`),
        sql`exists (select 1 from ${s.productTranslation} t where t.product_id = "product"."id" and t.name ilike ${"%" + q + "%"})`,
      )!,
    );
  if (status) where.push(eq(s.product.status, status));
  if (after?.length === 2)
    where.push(
      sql`(${s.product.createdAt}, ${s.product.id}) < (to_timestamp(${Number(after[0]) / 1000}), ${Number(after[1])})`,
    );
  const rows = await db()
    .select({
      p: s.product,
      az: sql<string>`(select name from ${s.productTranslation} where product_id = "product"."id" and locale = 'az')`,
      azStatus: sql<string>`(select status from ${s.productTranslation} where product_id = "product"."id" and locale = 'az')`,
      ruStatus: sql<string>`(select status from ${s.productTranslation} where product_id = "product"."id" and locale = 'ru')`,
      variants: sql<
        MediaVariant[] | null
      >`(select m.variants from ${s.productMedia} pm join ${s.media} m on m.id = pm.media_id where pm.product_id = "product"."id" order by pm.position limit 1)`,
    })
    .from(s.product)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(s.product.createdAt), desc(s.product.id))
    .limit(PAGE + 1);
  const page = rows.slice(0, PAGE);
  const last = page.at(-1);
  const next =
    rows.length > PAGE && last
      ? `${last.p.createdAt.getTime()}_${last.p.id}`
      : null;
  const qs = (extra: Record<string, string>) =>
    new URLSearchParams({
      ...(q ? { q } : {}),
      ...(status ? { status } : {}),
      ...extra,
    }).toString();

  return (
    <>
      <PageHeader
        title="Məhsullar"
        description="Kataloqu idarə et: mətnlər (az/en/ru), şəkillər, kateqoriyalar, SEO."
        actions={
          !readOnly && (
            <Link href="/admin/products/new" className="btn-primary">
              + Yeni məhsul
            </Link>
          )
        }
      />
      <form className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Ad və ya artikul…"
          className="input max-w-xs"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="input w-auto"
        >
          <option value="">Bütün statuslar</option>
          <option value="published">Dərc olunub</option>
          <option value="draft">Qaralama</option>
          <option value="archived">Arxiv</option>
        </select>
        <button className="btn-ghost">Filtr</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th w-14" />
              <th className="th">Ad (az)</th>
              <th className="th">Artikul</th>
              <th className="th">Status</th>
              <th className="th">AZ</th>
              <th className="th">RU</th>
              <th className="th">Qiymət</th>
            </tr>
          </thead>
          <tbody>
            {page.map(({ p, az, azStatus, ruStatus, variants }) => {
              const thumb = variants?.find(
                (v) => v.format === "webp" && v.width <= 360,
              )?.path;
              return (
                <tr key={p.id} className="hover:bg-surface">
                  <td className="td">
                    {thumb ? (
                      <img
                        src={`/media/${thumb}`}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 rounded-lg bg-surface object-contain mix-blend-multiply"
                      />
                    ) : (
                      <span className="block size-10 rounded-lg bg-surface" />
                    )}
                  </td>
                  <td className="td">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {az}
                    </Link>
                  </td>
                  <td className="td font-mono text-xs">{p.sku}</td>
                  <td className="td">
                    <Badge status={p.status} />
                  </td>
                  <td className="td">
                    <Badge status={azStatus} />
                  </td>
                  <td className="td">
                    <Badge status={ruStatus} />
                  </td>
                  <td className="td">
                    {p.priceAmount
                      ? `${Number(p.priceAmount)} ${p.currency}`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between text-sm">
        <Link
          href={`/admin/products?${qs({})}`}
          className="text-brand hover:underline"
        >
          « Əvvələ
        </Link>
        {next && (
          <Link
            href={`/admin/products?${qs({ after: next })}`}
            className="text-brand hover:underline"
          >
            Növbəti »
          </Link>
        )}
      </div>
    </>
  );
}
