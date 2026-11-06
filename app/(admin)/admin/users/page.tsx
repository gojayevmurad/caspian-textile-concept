import { asc } from "drizzle-orm";
import { adminContext, mask } from "@/src/lib/admin/context";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { PageHeader } from "@/src/components/admin/ui";

export const metadata = { title: "İstifadəçilər" };

export default async function Users() {
  const { readOnly } = await adminContext();
  if (readOnly)
    return (
      <>
        <PageHeader title="İstifadəçilər" />
        <p className="card p-6 text-sm text-muted">
          Bu bölmə yalnız admin üçündür — demo hesab istifadəçi siyahısını
          görmür.
        </p>
      </>
    );
  const rows = await db()
    .select({
      id: s.user.id,
      email: s.user.email,
      name: s.user.name,
      role: s.user.role,
      createdAt: s.user.createdAt,
    })
    .from(s.user)
    .orderBy(asc(s.user.createdAt));
  return (
    <>
      <PageHeader
        title="İstifadəçilər"
        description="Hesablar yalnız operator skripti ilə yaradılır (pnpm admin:user / admin:create-demo). Açıq qeydiyyat bağlıdır."
      />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">E-poçt</th>
              <th className="th">Ad</th>
              <th className="th">Rol</th>
              <th className="th">Yaradılıb</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="td">{mask(u.email, readOnly)}</td>
                <td className="td">{readOnly ? mask(u.name, true) : u.name}</td>
                <td className="td">
                  <span className="chip">{u.role}</span>
                </td>
                <td className="td text-xs text-muted">
                  {u.createdAt.toISOString().slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted">
        Rollar: <code>admin</code> — tam hüquq; <code>demo_viewer</code> —
        yalnız baxış (bütün yazma əməliyyatları serverdə 403);{" "}
        <code>customer</code> — gələcək müştəri portalı üçün.
      </p>
    </>
  );
}
