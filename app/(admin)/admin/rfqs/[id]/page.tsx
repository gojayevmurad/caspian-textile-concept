import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { adminContext, mask } from "@/src/lib/admin/context";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { updateRfq } from "@/src/lib/admin/actions/rfqs";
import { Badge, Denied, PageHeader, Saved } from "@/src/components/admin/ui";
import { colorNames } from "@/src/lib/catalog/taxonomy";
import type { MediaVariant } from "@/src/lib/media/process";

export const metadata = { title: "Sorğu" };
const placements: Record<string, { x: number; y: number; label: string }> = {
  "chest-left": { x: 62, y: 30, label: "Sinə (sol)" },
  "chest-right": { x: 38, y: 30, label: "Sinə (sağ)" },
  back: { x: 50, y: 34, label: "Kürək" },
  sleeve: { x: 20, y: 38, label: "Qol" },
};

export default async function RfqDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { readOnly } = await adminContext();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [r] = await db().select().from(s.rfq).where(eq(s.rfq.id, id));
  if (!r) notFound();
  const items = await db()
    .select()
    .from(s.rfqItem)
    .where(eq(s.rfqItem.rfqId, id));
  const [logo] = r.logoMediaId
    ? await db().select().from(s.media).where(eq(s.media.id, r.logoMediaId))
    : [];
  const logoPath = logo
    ? (logo.variants as MediaVariant[]).find((v) => v.format === "webp")?.path
    : null;
  const firstProductImage = items[0]?.productId
    ? (
        await db()
          .select({ m: s.media })
          .from(s.productMedia)
          .innerJoin(s.media, eq(s.media.id, s.productMedia.mediaId))
          .where(eq(s.productMedia.productId, items[0].productId))
          .orderBy(s.productMedia.position)
          .limit(1)
      )[0]?.m
    : null;
  const productPath = firstProductImage
    ? (firstProductImage.variants as MediaVariant[]).find(
        (v) => v.format === "webp" && v.width >= 720,
      )?.path
    : null;
  const branding = r.branding as {
    placement: string;
    method: string;
    scale: number;
  } | null;
  const total = items.reduce((a, i) => a + i.totalQty, 0);

  return (
    <>
      <PageHeader
        title={`RFQ-${String(r.number).padStart(4, "0")}`}
        description={`${r.kind === "sample" ? "Nümunə sorğusu" : "Qiymət təklifi sorğusu"} · ${r.createdAt.toISOString().slice(0, 16).replace("T", " ")} · dil: ${r.locale}`}
        actions={<Badge status={r.status} />}
      />
      <Denied show={sp.denied === "1"} />
      <Saved show={sp.saved === "1"} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold">Məhsullar · cəmi {total} əd.</h2>
            {items.map((i) => (
              <div key={i.id} className="mt-4">
                <p className="text-sm font-medium">
                  {i.productId ? (
                    <Link
                      href={`/admin/products/${i.productId}`}
                      className="hover:text-brand"
                    >
                      {i.name}
                    </Link>
                  ) : (
                    i.name
                  )}{" "}
                  <span className="font-mono text-xs text-muted">{i.sku}</span>
                </p>
                <table className="mt-2 w-full text-sm">
                  <thead>
                    <tr>
                      <th className="th">Ölçü</th>
                      <th className="th">Rəng</th>
                      <th className="th text-right">Say</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      i.matrix as {
                        size: string | null;
                        color: string | null;
                        qty: number;
                      }[]
                    ).map((l, k) => (
                      <tr key={k}>
                        <td className="td">{l.size ?? "—"}</td>
                        <td className="td">
                          {l.color ? (colorNames[l.color]?.az ?? l.color) : "—"}
                        </td>
                        <td className="td text-right font-semibold">{l.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
          {branding && (
            <section className="card p-5">
              <h2 className="font-semibold">Brendinq</h2>
              <p className="text-sm text-muted">
                {placements[branding.placement]?.label} ·{" "}
                {branding.method === "embroidery" ? "tikmə" : "çap"} · ölçü{" "}
                {branding.scale}%
              </p>
              <div className="relative mt-3 aspect-square max-w-xs overflow-hidden rounded-xl bg-surface">
                {productPath && (
                  <img
                    src={`/media/${productPath}`}
                    alt=""
                    className="size-full object-contain p-2 mix-blend-multiply"
                  />
                )}
                {logoPath && (
                  <img
                    src={`/media/${logoPath}`}
                    alt="Müştəri loqosu"
                    className="absolute -translate-x-1/2 -translate-y-1/2 object-contain"
                    style={{
                      left: `${placements[branding.placement]?.x ?? 50}%`,
                      top: `${placements[branding.placement]?.y ?? 30}%`,
                      width: `${branding.scale}%`,
                    }}
                  />
                )}
              </div>
              {logoPath && !readOnly && (
                <a
                  href={`/media/${logoPath}`}
                  className="mt-2 inline-block text-sm text-brand hover:underline"
                >
                  Loqonu yüklə
                </a>
              )}
            </section>
          )}
        </div>
        <div className="space-y-6">
          <section className="card p-5 text-sm">
            <h2 className="font-semibold">Müştəri</h2>
            <dl className="mt-3 space-y-2">
              {[
                ["Şirkət", mask(r.company, readOnly)],
                ["Əlaqədar şəxs", mask(r.contactName, readOnly)],
                ["E-poçt", mask(r.email, readOnly)],
                ["Telefon", mask(r.phone, readOnly)],
                ["VÖEN", mask(r.taxId, readOnly) || "—"],
                ["Ölkə", r.country || "—"],
                ["İstənilən tarix", r.targetDate || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {r.message && (
              <p className="mt-4 rounded-xl bg-surface p-3 whitespace-pre-wrap">
                {readOnly ? "•••" : r.message}
              </p>
            )}
          </section>
          <form action={updateRfq} className="card space-y-3 p-5">
            <input type="hidden" name="id" value={r.id} />
            <fieldset disabled={readOnly} className="space-y-3">
              <label className="block">
                <span className="label">Status</span>
                <select name="status" defaultValue={r.status} className="input">
                  <option value="new">Yeni</option>
                  <option value="in_review">Baxılır</option>
                  <option value="quoted">Təklif göndərilib</option>
                  <option value="won">Qazanıldı</option>
                  <option value="lost">İtirildi</option>
                </select>
              </label>
              <label className="block">
                <span className="label">Məsul şəxs</span>
                <input
                  name="assignee"
                  defaultValue={r.assignee ?? ""}
                  className="input"
                />
              </label>
              <label className="block">
                <span className="label">Daxili qeyd</span>
                <textarea
                  name="internalNotes"
                  defaultValue={r.internalNotes ?? ""}
                  rows={4}
                  className="input py-2"
                />
              </label>
              <button className="btn-primary w-full">Yadda saxla</button>
            </fieldset>
          </form>
        </div>
      </div>
    </>
  );
}
