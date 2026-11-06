import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { adminContext, mask } from "@/src/lib/admin/context";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { Badge, PageHeader, Stat } from "@/src/components/admin/ui";
import { getEnv } from "@/src/config/env";

export const metadata = { title: "İdarə paneli" };

export default async function Dashboard() {
  const { readOnly } = await adminContext();
  const env = getEnv();
  const [counts] = await db()
    .select({
      published: sql<number>`(select count(*)::int from ${s.product} where status = 'published')`,
      drafts: sql<number>`(select count(*)::int from ${s.product} where status = 'draft')`,
      media: sql<number>`(select count(*)::int from ${s.media})`,
      mediaBytes: sql<number>`(select coalesce(sum((v->>'bytes')::bigint), 0)::bigint from ${s.media}, jsonb_array_elements(${s.media.variants}) v)`,
      aiDrafts: sql<number>`(select count(*)::int from ${s.productTranslation} where status = 'ai_draft')`,
      untranslated: sql<number>`(select count(*)::int from ${s.productTranslation} where status = 'untranslated')`,
      rfqNew: sql<number>`(select count(*)::int from ${s.rfq} where status = 'new')`,
      rfqWeek: sql<number>`(select count(*)::int from ${s.rfq} where created_at > now() - interval '7 days')`,
      rfqTotal: sql<number>`(select count(*)::int from ${s.rfq})`,
      redirects: sql<number>`(select count(*)::int from ${s.redirect})`,
      redirectHits: sql<number>`(select coalesce(sum(hits), 0)::int from ${s.redirect})`,
    })
    .from(sql`(select 1) as one`);
  const byStatus = await db()
    .select({ status: s.rfq.status, n: sql<number>`count(*)::int` })
    .from(s.rfq)
    .groupBy(s.rfq.status);
  const top = await db()
    .select({
      sku: s.rfqItem.sku,
      name: s.rfqItem.name,
      qty: sql<number>`sum(${s.rfqItem.totalQty})::int`,
      n: sql<number>`count(*)::int`,
    })
    .from(s.rfqItem)
    .groupBy(s.rfqItem.sku, s.rfqItem.name)
    .orderBy(desc(sql`sum(${s.rfqItem.totalQty})`))
    .limit(5);
  const recent = await db()
    .select()
    .from(s.rfq)
    .orderBy(desc(s.rfq.createdAt))
    .limit(5);
  const topRedirects = await db()
    .select()
    .from(s.redirect)
    .where(sql`${s.redirect.hits} > 0`)
    .orderBy(desc(s.redirect.hits))
    .limit(5);

  return (
    <>
      <PageHeader
        title="İdarə paneli"
        description="Kataloq, tərcümə və B2B sorğularının vəziyyəti."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Dərc olunmuş məhsul"
          value={counts.published}
          href="/admin/products"
          hint={`${counts.drafts} qaralama`}
        />
        <Stat
          label="Yeni sorğular"
          value={counts.rfqNew}
          href="/admin/rfqs?status=new"
          hint={`Bu həftə: ${counts.rfqWeek} · cəmi ${counts.rfqTotal}`}
        />
        <Stat
          label="Tərcümə növbəsi"
          value={counts.aiDrafts + counts.untranslated}
          href="/admin/translations"
          hint={`${counts.aiDrafts} AI qaralama · ${counts.untranslated} tərcüməsiz`}
        />
        <Stat
          label="Media"
          value={counts.media}
          hint={`${(Number(counts.mediaBytes) / 1e6).toFixed(1)} MB (AVIF+WebP, bütün ölçülər)`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="font-semibold">Sorğu pipeline</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {["new", "in_review", "quoted", "won", "lost"].map((st) => (
              <li key={st}>
                <Link
                  href={`/admin/rfqs?status=${st}`}
                  className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm hover:border-brand"
                >
                  <Badge status={st} />{" "}
                  <span className="font-semibold">
                    {byStatus.find((b) => b.status === st)?.n ?? 0}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-sm font-semibold">Son sorğular</h3>
          <ul className="mt-2 divide-y divide-line text-sm">
            {recent.length === 0 && (
              <li className="py-2 text-muted">Hələ sorğu yoxdur.</li>
            )}
            {recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 py-2"
              >
                <Link
                  href={`/admin/rfqs/${r.id}`}
                  className="font-medium hover:text-brand"
                >
                  RFQ-{String(r.number).padStart(4, "0")} ·{" "}
                  {mask(r.company, readOnly)}
                </Link>
                <Badge status={r.status} />
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-4">
          <h2 className="font-semibold">Ən çox soruşulan məhsullar</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {top.length === 0 && (
              <li className="py-2 text-muted">Data yoxdur.</li>
            )}
            {top.map((t) => (
              <li key={t.sku} className="flex justify-between gap-2 py-2">
                <span>
                  {t.name} <span className="text-xs text-muted">{t.sku}</span>
                </span>
                <span className="font-semibold">{t.qty} əd.</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-sm font-semibold">
            Köhnə URL redirect-ləri
          </h3>
          <p className="text-xs text-muted">
            {counts.redirects} qayda · {counts.redirectHits} keçid
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {topRedirects.map((r) => (
              <li key={r.id} className="truncate">
                <code>{r.fromPath}</code> → <code>{r.toPath || "410"}</code> (
                {r.hits})
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card mt-6 p-4 text-sm">
        <h2 className="font-semibold">İnteqrasiyalar</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            [
              "Axtarış sistemi indeksləməsi",
              env.SITE_INDEXABLE === "true" ? "Aktiv" : "Bağlı (demo: noindex)",
            ],
            [
              "Cloudflare cache purge",
              env.CLOUDFLARE_API_TOKEN
                ? "Konfiqurasiya olunub"
                : "Konfiqurasiya olunmayıb",
            ],
            [
              "E-poçt bildirişləri",
              env.EMAIL_MODE === "send" && env.NOTIFY_EMAIL
                ? "Aktiv (yalnız demo sahibinə)"
                : "Preview rejimi",
            ],
            [
              "Polar ödənişləri (rəqəmsal məhsullar)",
              env.POLAR_ACCESS_TOKEN
                ? `Konfiqurasiya olunub (${env.POLAR_ENVIRONMENT})`
                : "Konfiqurasiya olunmayıb",
            ],
            [
              "AI tərcümə (Claude API)",
              env.ANTHROPIC_API_KEY
                ? `Aktiv (${env.ANTHROPIC_MODEL})`
                : "Konfiqurasiya olunmayıb",
            ],
            [
              "Web Vitals (PostHog, razılıqla)",
              process.env.NEXT_PUBLIC_POSTHOG_KEY
                ? "Aktiv"
                : "Konfiqurasiya olunmayıb",
            ],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between gap-4 rounded-lg bg-surface px-3 py-2"
            >
              <dt className="text-muted">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
