import { desc } from "drizzle-orm";
import { adminContext } from "@/src/lib/admin/context";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { addRedirect, deleteRedirect } from "@/src/lib/admin/actions/misc";
import { Denied, PageHeader, Saved } from "@/src/components/admin/ui";

export const metadata = { title: "Redirect-lər" };

export default async function Redirects({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { readOnly } = await adminContext();
  const sp = await searchParams;
  const rows = await db()
    .select()
    .from(s.redirect)
    .orderBy(desc(s.redirect.hits), desc(s.redirect.id))
    .limit(500);
  return (
    <>
      <PageHeader
        title="Redirect-lər"
        description="Köhnə WordPress URL-ləri (az/en/ru) → yeni URL-lər. Miqrasiyada Google sıralamalarını qorumaq üçün 301; demo blog yazıları üçün 410."
      />
      <Denied show={sp.denied === "1"} />
      <Saved show={sp.saved === "1"} />
      <form action={addRedirect} className="card mb-4 p-4">
        <fieldset
          disabled={readOnly}
          className="grid gap-2 md:grid-cols-[1fr_1fr_120px_auto]"
        >
          <input
            name="fromPath"
            required
            placeholder="/kohne-url"
            className="input font-mono"
            aria-label="Köhnə yol"
          />
          <input
            name="toPath"
            placeholder="/yeni-url (410 üçün boş)"
            className="input font-mono"
            aria-label="Yeni yol"
          />
          <select name="statusCode" className="input" aria-label="Status">
            <option>301</option>
            <option>308</option>
            <option>302</option>
            <option>410</option>
          </select>
          <button className="btn-primary">Əlavə et</button>
        </fieldset>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Köhnə</th>
              <th className="th">Yeni</th>
              <th className="th">Kod</th>
              <th className="th">Keçid</th>
              <th className="th">Mənbə</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="td max-w-xs truncate font-mono text-xs">
                  {r.fromPath}
                </td>
                <td className="td max-w-xs truncate font-mono text-xs">
                  {r.toPath || "—"}
                </td>
                <td className="td">{r.statusCode}</td>
                <td className="td">{r.hits}</td>
                <td className="td text-xs text-muted">{r.source}</td>
                <td className="td">
                  <form action={deleteRedirect}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      disabled={readOnly}
                      className="text-xs text-red-700 hover:underline disabled:opacity-30"
                    >
                      Sil
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
