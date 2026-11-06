import Link from "next/link";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { adminContext, mask } from "@/src/lib/admin/context";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { Badge, PageHeader } from "@/src/components/admin/ui";

export const metadata = { title: "Sorğular" };
const PAGE = 30;

export default async function Rfqs({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { readOnly } = await adminContext();
  const sp = await searchParams;
  const where: SQL[] = [];
  if (sp.status) where.push(eq(s.rfq.status, sp.status));
  if (sp.kind) where.push(eq(s.rfq.kind, sp.kind));
  const after = sp.after?.split("_");
  if (after?.length === 2)
    where.push(
      sql`(${s.rfq.createdAt}, ${s.rfq.id}) < (to_timestamp(${Number(after[0]) / 1000}), ${after[1]})`,
    );
  const rows = await db()
    .select({
      r: s.rfq,
      qty: sql<number>`(select coalesce(sum(total_qty),0)::int from ${s.rfqItem} where rfq_id = "rfq"."id")`,
      items: sql<number>`(select count(*)::int from ${s.rfqItem} where rfq_id = "rfq"."id")`,
    })
    .from(s.rfq)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(s.rfq.createdAt), desc(s.rfq.id))
    .limit(PAGE + 1);
  const page = rows.slice(0, PAGE);
  const last = page.at(-1)?.r;
  const statuses = ["", "new", "in_review", "quoted", "won", "lost"];
  return (
    <>
      <PageHeader
        title="Sorğular (RFQ)"
        description="Qiymət təklifi və nümunə sorğuları."
        actions={
          <a
            href={`/admin/rfqs/export${sp.status ? `?status=${sp.status}` : ""}`}
            className="btn-ghost"
          >
            CSV ixrac
          </a>
        }
      />
      <nav className="mb-4 flex flex-wrap gap-2 text-sm">
        {statuses.map((st) => (
          <Link
            key={st}
            href={st ? `/admin/rfqs?status=${st}` : "/admin/rfqs"}
            className={`rounded-full px-3 py-1 ring-1 ${sp.status === st || (!sp.status && !st) ? "bg-brand text-white ring-brand" : "ring-line hover:ring-brand"}`}
          >
            {st ? <Badge status={st} /> : "Hamısı"}
          </Link>
        ))}
      </nav>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Nömrə</th>
              <th className="th">Növ</th>
              <th className="th">Şirkət</th>
              <th className="th">Əlaqə</th>
              <th className="th">Məhsul / say</th>
              <th className="th">Status</th>
              <th className="th">Tarix</th>
            </tr>
          </thead>
          <tbody>
            {page.length === 0 && (
              <tr>
                <td colSpan={7} className="td text-center text-muted">
                  Sorğu yoxdur. Saytda “Sorğu səbəti” ilə test sorğusu göndərə
                  bilərsiniz.
                </td>
              </tr>
            )}
            {page.map(({ r, qty, items }) => (
              <tr key={r.id} className="hover:bg-surface">
                <td className="td font-mono">
                  <Link
                    href={`/admin/rfqs/${r.id}`}
                    className="font-semibold text-brand hover:underline"
                  >
                    RFQ-{String(r.number).padStart(4, "0")}
                  </Link>
                </td>
                <td className="td">
                  {r.kind === "sample" ? "Nümunə" : "Təklif"}
                </td>
                <td className="td">{mask(r.company, readOnly)}</td>
                <td className="td">{mask(r.email, readOnly)}</td>
                <td className="td">
                  {items} / {qty} əd.
                </td>
                <td className="td">
                  <Badge status={r.status} />
                </td>
                <td className="td text-xs text-muted">
                  {r.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > PAGE && last && (
        <p className="mt-4 text-right text-sm">
          <Link
            href={`/admin/rfqs?${new URLSearchParams({ ...(sp.status ? { status: sp.status } : {}), after: `${last.createdAt.getTime()}_${last.id}` })}`}
            className="text-brand hover:underline"
          >
            Növbəti »
          </Link>
        </p>
      )}
    </>
  );
}
