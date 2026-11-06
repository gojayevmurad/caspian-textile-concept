import { desc, eq } from "drizzle-orm";
import { adminContext, mask } from "@/src/lib/admin/context";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { PageHeader } from "@/src/components/admin/ui";

export const metadata = { title: "Audit log" };

export default async function Audit() {
  const { readOnly } = await adminContext();
  const rows = await db()
    .select({ a: s.auditLog, email: s.user.email })
    .from(s.auditLog)
    .leftJoin(s.user, eq(s.user.id, s.auditLog.userId))
    .orderBy(desc(s.auditLog.createdAt))
    .limit(200);
  return (
    <>
      <PageHeader
        title="Audit log"
        description="Hər admin dəyişikliyi kim, nə vaxt, nəyi dəyişdi — server tərəfində qeydə alınır."
      />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Vaxt</th>
              <th className="th">İstifadəçi</th>
              <th className="th">Əməliyyat</th>
              <th className="th">Obyekt</th>
              <th className="th">Fərq</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="td text-center text-muted">
                  Hələ dəyişiklik yoxdur.
                </td>
              </tr>
            )}
            {rows.map(({ a, email }) => (
              <tr key={a.id} className="align-top">
                <td className="td text-xs whitespace-nowrap text-muted">
                  {a.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                </td>
                <td className="td text-xs">{mask(email, readOnly)}</td>
                <td className="td font-mono text-xs">{a.action}</td>
                <td className="td font-mono text-xs">
                  {a.entity}#{a.entityId}
                </td>
                <td className="td max-w-sm truncate font-mono text-xs text-muted">
                  {a.diff ? JSON.stringify(a.diff) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
