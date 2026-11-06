"use server";
import { and, eq, inArray, max, ne, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { mutate } from "@/src/lib/admin/mutation";
import { locales, slugify, type Locale } from "@/src/lib/i18n/config";
import { colorNames } from "@/src/lib/catalog/taxonomy";
import { htmlToText } from "@/src/lib/catalog/clean-html";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  processImage,
  sniffImageType,
} from "@/src/lib/media/process";
import { translateDraft } from "@/src/lib/admin/ai";

const list = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 40);
const intOrNull = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return v === null || v === "" || !Number.isFinite(n)
    ? null
    : Math.max(0, Math.round(n));
};
const cleanHtml = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: ["p", "ul", "ol", "li", "strong", "em", "h3", "br"],
    allowedAttributes: {},
  });

const translationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(90),
  shortDescription: z.string().trim().max(1200),
  descriptionHtml: z.string().max(40_000),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
  status: z.enum(["source", "ai_draft", "approved", "untranslated"]),
});

export async function saveProduct(formData: FormData) {
  const id = Number(formData.get("id"));
  const back = `/admin/products/${id}`;
  await mutate(
    {
      action: "product.update",
      entity: "product",
      entityId: id,
      catalog: true,
      back,
    },
    async () => {
      const status = z
        .enum(["draft", "published", "archived"])
        .parse(formData.get("status"));
      const price = String(formData.get("price") ?? "").trim();
      const colors = formData
        .getAll("colors")
        .map(String)
        .filter((c) => c in colorNames);
      const categoryIds = formData
        .getAll("categories")
        .map(Number)
        .filter(Number.isInteger);
      const translations = Object.fromEntries(
        locales.map((l) => [
          l,
          translationSchema.parse({
            name: formData.get(`${l}.name`),
            slug: formData.get(`${l}.slug`) || "",
            shortDescription: formData.get(`${l}.shortDescription`) ?? "",
            descriptionHtml: formData.get(`${l}.descriptionHtml`) ?? "",
            seoTitle: formData.get(`${l}.seoTitle`) || undefined,
            seoDescription: formData.get(`${l}.seoDescription`) || undefined,
            status: formData.get(`${l}.status`),
          }),
        ]),
      ) as Record<Locale, z.infer<typeof translationSchema>>;

      // Slug uniqueness per locale (friendly error instead of a constraint violation).
      for (const l of locales) {
        const slug = slugify(translations[l].slug || translations[l].name);
        translations[l].slug = slug;
        const [clash] = await db()
          .select({ id: s.productTranslation.productId })
          .from(s.productTranslation)
          .where(
            and(
              eq(s.productTranslation.locale, l),
              eq(s.productTranslation.slug, slug),
              ne(s.productTranslation.productId, id),
            ),
          );
        if (clash) redirect(`${back}?error=slug-${l}`);
      }

      await db().transaction(async (tx) => {
        await tx
          .update(s.product)
          .set({
            status,
            brand: String(formData.get("brand") ?? "").trim() || null,
            priceAmount:
              price && Number.isFinite(Number(price))
                ? Number(price).toFixed(2)
                : null,
            colors,
            sizes: list(formData.get("sizes")),
            standards: list(formData.get("standards")),
            minOrder: intOrNull(formData.get("minOrder")),
            leadTimeDays: intOrNull(formData.get("leadTimeDays")),
            featured: formData.get("featured") === "on",
            updatedAt: new Date(),
          })
          .where(eq(s.product.id, id));
        for (const l of locales) {
          const t = translations[l];
          const descriptionHtml = cleanHtml(t.descriptionHtml);
          await tx
            .update(s.productTranslation)
            .set({
              name: t.name,
              slug: t.slug,
              shortDescription: t.shortDescription,
              descriptionHtml,
              seoTitle: t.seoTitle ?? null,
              seoDescription: t.seoDescription ?? null,
              status: t.status,
              searchText: [
                t.name,
                t.shortDescription,
                htmlToText(descriptionHtml).slice(0, 600),
              ]
                .join(" ")
                .toLowerCase(),
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(s.productTranslation.productId, id),
                eq(s.productTranslation.locale, l),
              ),
            );
        }
        await tx
          .delete(s.productCategory)
          .where(eq(s.productCategory.productId, id));
        if (categoryIds.length)
          await tx
            .insert(s.productCategory)
            .values(
              categoryIds.map((categoryId) => ({ productId: id, categoryId })),
            );
      });
      return {
        diff: {
          status,
          colors,
          categories: categoryIds.length,
          translations: Object.fromEntries(
            locales.map((l) => [l, translations[l].status]),
          ),
        },
      };
    },
  );
  redirect(`${back}?saved=1`);
}

export async function createProduct(formData: FormData) {
  const sku = z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/)
    .parse(formData.get("sku"));
  const name = z.string().trim().min(2).max(200).parse(formData.get("name"));
  const result = await mutate(
    {
      action: "product.create",
      entity: "product",
      catalog: true,
      back: "/admin/products/new",
    },
    async () => {
      const [exists] = await db()
        .select({ id: s.product.id })
        .from(s.product)
        .where(eq(s.product.sku, sku));
      if (exists) redirect("/admin/products/new?error=sku");
      const [row] = await db()
        .insert(s.product)
        .values({ sku, status: "draft" })
        .returning({ id: s.product.id });
      await db()
        .insert(s.productTranslation)
        .values(
          locales.map((l) => ({
            productId: row.id,
            locale: l,
            name,
            slug: `${slugify(name)}-${slugify(sku)}`,
            status:
              l === "en" ? ("source" as const) : ("untranslated" as const),
            searchText: `${name} ${sku}`.toLowerCase(),
          })),
        );
      return { entityId: row.id, id: row.id, diff: { sku, name } };
    },
  );
  redirect(`/admin/products/${result.id}?saved=1`);
}

export async function uploadProductMedia(formData: FormData) {
  const id = Number(formData.get("id"));
  const back = `/admin/products/${id}`;
  await mutate(
    {
      action: "product.media.upload",
      entity: "product",
      entityId: id,
      catalog: true,
      back,
    },
    async () => {
      const files = formData
        .getAll("files")
        .filter((f): f is File => f instanceof File && f.size > 0)
        .slice(0, 10);
      const [{ pos }] = await db()
        .select({ pos: max(s.productMedia.position) })
        .from(s.productMedia)
        .where(eq(s.productMedia.productId, id));
      let position = (pos ?? -1) + 1;
      const [en] = await db()
        .select({ name: s.productTranslation.name })
        .from(s.productTranslation)
        .where(
          and(
            eq(s.productTranslation.productId, id),
            eq(s.productTranslation.locale, "en"),
          ),
        );
      for (const file of files) {
        if (file.size > MAX_UPLOAD_BYTES) redirect(`${back}?error=too-large`);
        const buf = Buffer.from(await file.arrayBuffer());
        const type = sniffImageType(buf);
        if (
          !type ||
          !(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(type)
        )
          redirect(`${back}?error=type`);
        const m = await processImage(buf);
        const [media] = await db()
          .insert(s.media)
          .values({
            hash: m.hash,
            originalName: file.name.slice(0, 120),
            width: m.width,
            height: m.height,
            color: m.color,
            blur: m.blur,
            variants: m.variants,
            alt: { az: en?.name, en: en?.name, ru: en?.name },
          })
          .onConflictDoUpdate({
            target: s.media.hash,
            set: { originalName: file.name.slice(0, 120) },
          })
          .returning({ id: s.media.id });
        await db()
          .insert(s.productMedia)
          .values({ productId: id, mediaId: media.id, position: position++ })
          .onConflictDoNothing();
      }
      return { diff: { uploaded: files.length } };
    },
  );
  redirect(`${back}?saved=1#media`);
}

export async function moveProductMedia(formData: FormData) {
  const id = Number(formData.get("id"));
  const mediaId = Number(formData.get("mediaId"));
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const back = `/admin/products/${id}`;
  await mutate(
    {
      action: "product.media.reorder",
      entity: "product",
      entityId: id,
      catalog: true,
      back,
    },
    async () => {
      const rows = await db()
        .select()
        .from(s.productMedia)
        .where(eq(s.productMedia.productId, id))
        .orderBy(s.productMedia.position);
      const i = rows.findIndex((r) => r.mediaId === mediaId);
      const j = i + dir;
      if (i >= 0 && j >= 0 && j < rows.length) {
        [rows[i], rows[j]] = [rows[j], rows[i]];
        await db().transaction(async (tx) => {
          for (const [pos, r] of rows.entries())
            await tx
              .update(s.productMedia)
              .set({ position: pos })
              .where(
                and(
                  eq(s.productMedia.productId, id),
                  eq(s.productMedia.mediaId, r.mediaId),
                ),
              );
        });
      }
      return { diff: { mediaId, dir } };
    },
  );
  redirect(`${back}#media`);
}

export async function removeProductMedia(formData: FormData) {
  const id = Number(formData.get("id"));
  const mediaId = Number(formData.get("mediaId"));
  const back = `/admin/products/${id}`;
  await mutate(
    {
      action: "product.media.remove",
      entity: "product",
      entityId: id,
      catalog: true,
      back,
    },
    async () => {
      await db()
        .delete(s.productMedia)
        .where(
          and(
            eq(s.productMedia.productId, id),
            eq(s.productMedia.mediaId, mediaId),
          ),
        );
      return { diff: { mediaId } };
    },
  );
  redirect(`${back}#media`);
}

export async function approveTranslations(formData: FormData) {
  const keys = formData.getAll("key").map(String); // "productId:locale"
  const back = String(formData.get("back") || "/admin/translations");
  await mutate(
    {
      action: "translation.approve",
      entity: "product_translation",
      entityId: keys.length,
      catalog: true,
      back,
    },
    async () => {
      for (const k of keys.slice(0, 200)) {
        const [pid, locale] = k.split(":");
        await db()
          .update(s.productTranslation)
          .set({ status: "approved", updatedAt: new Date() })
          .where(
            and(
              eq(s.productTranslation.productId, Number(pid)),
              eq(s.productTranslation.locale, locale),
              inArray(s.productTranslation.status, ["ai_draft", "source"]),
            ),
          );
      }
      return { diff: { approved: keys.length } };
    },
  );
  redirect(`${back}${back.includes("?") ? "&" : "?"}saved=1`);
}

export async function aiDraftTranslation(formData: FormData) {
  const id = Number(formData.get("id"));
  const locale = z.enum(["az", "ru"]).parse(formData.get("locale"));
  const back = `/admin/products/${id}`;
  await mutate(
    {
      action: "translation.ai_draft",
      entity: "product_translation",
      entityId: `${id}:${locale}`,
      catalog: true,
      back,
    },
    async () => {
      const [en] = await db()
        .select()
        .from(s.productTranslation)
        .where(
          and(
            eq(s.productTranslation.productId, id),
            eq(s.productTranslation.locale, "en"),
          ),
        );
      if (!en) redirect(`${back}?error=no-source`);
      const draft = await translateDraft(locale, {
        name: en.name,
        summary: en.shortDescription,
        html: en.descriptionHtml,
      });
      if (!draft) redirect(`${back}?error=ai-not-configured`);
      await db()
        .update(s.productTranslation)
        .set({
          name: draft.name,
          shortDescription: draft.summary,
          descriptionHtml: cleanHtml(draft.html),
          status: "ai_draft",
          searchText: sql`lower(${draft.name} || ' ' || ${draft.summary})`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(s.productTranslation.productId, id),
            eq(s.productTranslation.locale, locale),
          ),
        );
      return { diff: { locale } };
    },
  );
  redirect(`${back}?saved=1`);
}
