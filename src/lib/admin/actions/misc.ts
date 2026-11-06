"use server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { mutate } from "@/src/lib/admin/mutation";
import { locales, slugify } from "@/src/lib/i18n/config";

export async function saveCategory(formData: FormData) {
  const id = Number(formData.get("id"));
  const back = "/admin/categories";
  await mutate(
    {
      action: "category.update",
      entity: "category",
      entityId: id,
      catalog: true,
      redirects: true,
      back,
    },
    async () => {
      for (const l of locales) {
        const name = z
          .string()
          .trim()
          .min(1)
          .max(120)
          .parse(formData.get(`${l}.name`));
        const description = z
          .string()
          .trim()
          .max(600)
          .parse(formData.get(`${l}.description`) ?? "");
        await db()
          .update(s.categoryTranslation)
          .set({ name, slug: slugify(name), description: description || null })
          .where(
            and(
              eq(s.categoryTranslation.categoryId, id),
              eq(s.categoryTranslation.locale, l),
            ),
          );
      }
      return { diff: { id } };
    },
  );
  redirect(`${back}?saved=1#cat-${id}`);
}

const pathSchema = z.string().trim().startsWith("/").max(400);

export async function addRedirect(formData: FormData) {
  const back = "/admin/redirects";
  await mutate(
    { action: "redirect.create", entity: "redirect", redirects: true, back },
    async () => {
      const fromPath =
        pathSchema.parse(formData.get("fromPath")).replace(/\/+$/, "") || "/";
      const statusCode = z.coerce
        .number()
        .pipe(
          z.union([
            z.literal(301),
            z.literal(302),
            z.literal(308),
            z.literal(410),
          ]),
        )
        .parse(formData.get("statusCode"));
      const toPath =
        statusCode === 410 ? "" : pathSchema.parse(formData.get("toPath"));
      const [row] = await db()
        .insert(s.redirect)
        .values({ fromPath, toPath, statusCode, source: "manual" })
        .onConflictDoUpdate({
          target: s.redirect.fromPath,
          set: { toPath, statusCode },
        })
        .returning({ id: s.redirect.id });
      return { entityId: row.id, diff: { fromPath, toPath, statusCode } };
    },
  );
  redirect(`${back}?saved=1`);
}

export async function deleteRedirect(formData: FormData) {
  const id = Number(formData.get("id"));
  const back = "/admin/redirects";
  await mutate(
    {
      action: "redirect.delete",
      entity: "redirect",
      entityId: id,
      redirects: true,
      back,
    },
    async () => {
      await db().delete(s.redirect).where(eq(s.redirect.id, id));
      return {};
    },
  );
  redirect(`${back}?saved=1`);
}
