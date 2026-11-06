import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowDown, ArrowUp, ExternalLink, Trash2 } from "lucide-react";
import { adminContext } from "@/src/lib/admin/context";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import {
  aiDraftTranslation,
  moveProductMedia,
  removeProductMedia,
  saveProduct,
  uploadProductMedia,
} from "@/src/lib/admin/actions/products";
import { Badge, Denied, PageHeader, Saved } from "@/src/components/admin/ui";
import { colorNames } from "@/src/lib/catalog/taxonomy";
import { localePath, locales, type Locale } from "@/src/lib/i18n/config";
import type { MediaVariant } from "@/src/lib/media/process";
import { getEnv } from "@/src/config/env";

export const metadata = { title: "Məhsulu redaktə et" };
const localeLabel: Record<Locale, string> = {
  az: "Azərbaycan",
  en: "English",
  ru: "Русский",
};
const errors: Record<string, string> = {
  "slug-az": "AZ slug artıq istifadə olunur.",
  "slug-en": "EN slug artıq istifadə olunur.",
  "slug-ru": "RU slug artıq istifadə olunur.",
  "too-large": "Fayl 8 MB-dan böyükdür.",
  type: "Yalnız PNG, JPG, WebP və ya AVIF.",
  "ai-not-configured":
    "AI tərcümə konfiqurasiya olunmayıb (ANTHROPIC_API_KEY) və ya model cavab vermədi.",
};

export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { readOnly } = await adminContext();
  const { id } = await params;
  const sp = await searchParams;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();
  const [product] = await db()
    .select()
    .from(s.product)
    .where(eq(s.product.id, productId));
  if (!product) notFound();
  const [translations, cats, chosen, media] = await Promise.all([
    db()
      .select()
      .from(s.productTranslation)
      .where(eq(s.productTranslation.productId, productId)),
    db()
      .select({ c: s.category, t: s.categoryTranslation })
      .from(s.category)
      .innerJoin(
        s.categoryTranslation,
        eq(s.categoryTranslation.categoryId, s.category.id),
      )
      .where(eq(s.categoryTranslation.locale, "az"))
      .orderBy(asc(s.category.position)),
    db()
      .select({ id: s.productCategory.categoryId })
      .from(s.productCategory)
      .where(eq(s.productCategory.productId, productId)),
    db()
      .select({ pm: s.productMedia, m: s.media })
      .from(s.productMedia)
      .innerJoin(s.media, eq(s.media.id, s.productMedia.mediaId))
      .where(eq(s.productMedia.productId, productId))
      .orderBy(asc(s.productMedia.position)),
  ]);
  const t = Object.fromEntries(
    translations.map((x) => [x.locale, x]),
  ) as Record<Locale, (typeof translations)[number]>;
  const selected = new Set(chosen.map((c) => c.id));
  const aiEnabled = Boolean(getEnv().ANTHROPIC_API_KEY);
  const kinds = [
    ["industry", "Sənayelər"],
    ["type", "Məhsul növü"],
    ["feature", "Xüsusiyyətlər"],
  ] as const;

  return (
    <>
      <PageHeader
        title={t.az?.name ?? product.sku}
        description={`${product.sku} · son dəyişiklik ${product.updatedAt.toISOString().slice(0, 16).replace("T", " ")}`}
        actions={
          product.status === "published" &&
          t.az && (
            <a
              href={localePath("az", "product", t.az.slug)}
              target="_blank"
              className="btn-ghost"
            >
              <ExternalLink className="size-4" aria-hidden /> Saytda bax
            </a>
          )
        }
      />
      <Denied show={sp.denied === "1"} />
      <Saved show={sp.saved === "1"} />
      {sp.error && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {errors[sp.error] ?? sp.error}
        </p>
      )}

      <form action={saveProduct} className="space-y-6">
        <input type="hidden" name="id" value={product.id} />
        <fieldset disabled={readOnly} className="space-y-6">
          <section className="card grid gap-4 p-5 md:grid-cols-3">
            <label className="block">
              <span className="label">Status</span>
              <select
                name="status"
                defaultValue={product.status}
                className="input"
              >
                <option value="published">Dərc olunub</option>
                <option value="draft">Qaralama</option>
                <option value="archived">Arxiv</option>
              </select>
            </label>
            <label className="block">
              <span className="label">Qiymət (AZN, “-dan”)</span>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.priceAmount ?? ""}
                className="input"
              />
            </label>
            <label className="block">
              <span className="label">Brend</span>
              <input
                name="brand"
                defaultValue={product.brand ?? ""}
                className="input"
              />
            </label>
            <label className="block">
              <span className="label">
                Ölçülər (vergüllə; boşdursa növə görə)
              </span>
              <input
                name="sizes"
                defaultValue={product.sizes.join(", ")}
                placeholder="S, M, L, XL"
                className="input"
              />
            </label>
            <label className="block">
              <span className="label">Standartlar (yalnız təsdiqlənmiş)</span>
              <input
                name="standards"
                defaultValue={product.standards.join(", ")}
                placeholder="EN ISO 20471"
                className="input"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="label">Min. sifariş</span>
                <input
                  name="minOrder"
                  type="number"
                  min="0"
                  defaultValue={product.minOrder ?? ""}
                  className="input"
                />
              </label>
              <label className="block">
                <span className="label">İstehsal (gün)</span>
                <input
                  name="leadTimeDays"
                  type="number"
                  min="0"
                  defaultValue={product.leadTimeDays ?? ""}
                  className="input"
                />
              </label>
            </div>
            <fieldset className="md:col-span-2">
              <legend className="label">Rənglər</legend>
              <div className="flex flex-wrap gap-2">
                {Object.entries(colorNames).map(([key, c]) => (
                  <label key={key} className="chip cursor-pointer">
                    <input
                      type="checkbox"
                      name="colors"
                      value={key}
                      defaultChecked={product.colors.includes(key)}
                      className="accent-[var(--color-brand)]"
                    />
                    <span
                      className="size-3 rounded-full ring-1 ring-line"
                      style={{ backgroundColor: c.hex }}
                    />{" "}
                    {c.az}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product.featured}
                className="accent-[var(--color-brand)]"
              />{" "}
              Seçilmiş məhsul
            </label>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold">Kateqoriyalar</h2>
            <div className="mt-3 grid gap-6 md:grid-cols-3">
              {kinds.map(([kind, label]) => (
                <fieldset key={kind}>
                  <legend className="mb-2 text-sm font-semibold text-muted">
                    {label}
                  </legend>
                  <div className="space-y-1">
                    {cats
                      .filter((c) => c.c.kind === kind)
                      .map(({ c, t: ct }) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            name="categories"
                            value={c.id}
                            defaultChecked={selected.has(c.id)}
                            className="accent-[var(--color-brand)]"
                          />{" "}
                          {ct.name}
                        </label>
                      ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>

          {locales.map((l) => {
            const tr = t[l];
            if (!tr) return null;
            return (
              <details key={l} open={l === "az"} className="card p-5">
                <summary className="flex cursor-pointer items-center gap-3 font-semibold">
                  {localeLabel[l]} <Badge status={tr.status} />
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="label">Ad</span>
                    <input
                      name={`${l}.name`}
                      defaultValue={tr.name}
                      required
                      className="input"
                    />
                  </label>
                  <label className="block">
                    <span className="label">Slug (URL)</span>
                    <input
                      name={`${l}.slug`}
                      defaultValue={tr.slug}
                      className="input font-mono"
                    />
                  </label>
                  <label className="block">
                    <span className="label">Tərcümə statusu</span>
                    <select
                      name={`${l}.status`}
                      defaultValue={tr.status}
                      className="input"
                    >
                      <option value="source">Orijinal</option>
                      <option value="approved">Təsdiqlənib</option>
                      <option value="ai_draft">AI qaralama</option>
                      <option value="untranslated">Tərcümə yoxdur</option>
                    </select>
                  </label>
                  <label className="block md:col-span-2">
                    <span className="label">Qısa təsvir</span>
                    <textarea
                      name={`${l}.shortDescription`}
                      defaultValue={tr.shortDescription}
                      rows={3}
                      className="input py-2"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="label">
                      Ətraflı təsvir (HTML: p, ul, li, h3, strong, em — qalanı
                      silinir)
                    </span>
                    <textarea
                      name={`${l}.descriptionHtml`}
                      defaultValue={tr.descriptionHtml}
                      rows={8}
                      className="input py-2 font-mono text-xs"
                    />
                  </label>
                  <label className="block">
                    <span className="label">
                      SEO title ({(tr.seoTitle ?? "").length}/70)
                    </span>
                    <input
                      name={`${l}.seoTitle`}
                      defaultValue={tr.seoTitle ?? ""}
                      maxLength={70}
                      className="input"
                    />
                  </label>
                  <label className="block">
                    <span className="label">
                      SEO description ({(tr.seoDescription ?? "").length}/170)
                    </span>
                    <input
                      name={`${l}.seoDescription`}
                      defaultValue={tr.seoDescription ?? ""}
                      maxLength={170}
                      className="input"
                    />
                  </label>
                  <div
                    className="rounded-xl bg-surface p-3 text-sm md:col-span-2"
                    aria-label="Google nəticə önizləməsi"
                  >
                    <p className="truncate text-[#1a0dab]">
                      {tr.seoTitle || `${tr.name} (${product.sku})`} · Caspian
                      Textile
                    </p>
                    <p className="text-xs text-green-800">
                      caspian.muradgojayev.com
                      {localePath(l, "product", tr.slug)}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted">
                      {tr.seoDescription || tr.shortDescription.slice(0, 160)}
                    </p>
                  </div>
                </div>
              </details>
            );
          })}
          <div className="sticky bottom-0 -mx-4 border-t border-line bg-white/90 px-4 py-3 backdrop-blur">
            <button className="btn-primary">Yadda saxla və dərc et</button>
          </div>
        </fieldset>
      </form>

      {(["az", "ru"] as const).map((l) => (
        <form
          key={l}
          action={aiDraftTranslation}
          className="mt-3 inline-block pr-2"
        >
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="locale" value={l} />
          <button
            disabled={readOnly || !aiEnabled}
            className="btn-ghost"
            title={aiEnabled ? "" : "ANTHROPIC_API_KEY konfiqurasiya olunmayıb"}
          >
            AI ilə {l.toUpperCase()} qaralaması yarat
          </button>
        </form>
      ))}

      <section id="media" className="card mt-6 p-5">
        <h2 className="font-semibold">Şəkillər</h2>
        <p className="text-xs text-muted">
          Yükləmədə avtomatik AVIF + WebP (360–1600px), blur placeholder və EXIF
          təmizlənməsi.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {media.map(({ m }, i) => {
            const v = (m.variants as MediaVariant[]).find(
              (x) => x.format === "webp" && x.width <= 360,
            );
            const total = (m.variants as MediaVariant[]).reduce(
              (a, x) => a + x.bytes,
              0,
            );
            return (
              <li key={m.id} className="rounded-xl border border-line p-2">
                {v && (
                  <img
                    src={`/media/${v.path}`}
                    alt=""
                    className="aspect-square w-full rounded-lg bg-surface object-contain mix-blend-multiply"
                  />
                )}
                <p className="mt-1 truncate text-xs text-muted">
                  {m.width}×{m.height} · {(total / 1024).toFixed(0)} KB (bütün
                  variantlar)
                </p>
                <div className="mt-1 flex gap-1">
                  {[
                    ["up", ArrowUp, i === 0],
                    ["down", ArrowDown, i === media.length - 1],
                  ].map(([dir, Icon, disabled]) => (
                    <form key={String(dir)} action={moveProductMedia}>
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="mediaId" value={m.id} />
                      <input type="hidden" name="dir" value={String(dir)} />
                      <button
                        disabled={readOnly || Boolean(disabled)}
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-line disabled:opacity-30"
                        aria-label={dir === "up" ? "Yuxarı" : "Aşağı"}
                      >
                        {(() => {
                          const I = Icon as typeof ArrowUp;
                          return <I className="size-4" aria-hidden />;
                        })()}
                      </button>
                    </form>
                  ))}
                  <form action={removeProductMedia} className="ml-auto">
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="mediaId" value={m.id} />
                    <button
                      disabled={readOnly}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-line text-red-700 disabled:opacity-30"
                      aria-label="Sil"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
        <form
          action={uploadProductMedia}
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="id" value={product.id} />
          <input
            type="file"
            name="files"
            multiple
            accept="image/png,image/jpeg,image/webp,image/avif"
            disabled={readOnly}
            className="text-sm"
          />
          <button disabled={readOnly} className="btn-ghost">
            Yüklə
          </button>
        </form>
      </section>
      <p className="mt-6 text-sm">
        <Link href="/admin/products" className="text-brand hover:underline">
          ← Bütün məhsullar
        </Link>
      </p>
    </>
  );
}
