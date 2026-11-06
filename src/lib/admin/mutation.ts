import "server-only";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/src/lib/db";
import { auditLog } from "@/src/lib/db/schema";
import { ForbiddenError, requireWriter } from "@/src/lib/auth/session";
import { CATALOG_TAG } from "@/src/lib/catalog/queries";
import { invalidateRedirects } from "@/src/lib/redirects/table";
import { purgeCdn } from "./cdn";

type Options = {
  action: string;
  entity: string;
  entityId?: string | number;
  catalog?: boolean;
  redirects?: boolean;
  back: string;
};

/**
 * Wraps every admin write: server-side role check (demo_viewer → 403), audit log,
 * cache invalidation and CDN purge. Server Actions use this; UI hiding is never trusted.
 */
export async function mutate<T>(
  opts: Options,
  fn: (
    userId: string,
  ) => Promise<T & { diff?: unknown; entityId?: string | number }>,
) {
  let session;
  try {
    session = await requireWriter();
  } catch (e) {
    if (e instanceof ForbiddenError)
      redirect(`${opts.back}${opts.back.includes("?") ? "&" : "?"}denied=1`);
    throw e;
  }
  const result = await fn(session.user.id);
  await db()
    .insert(auditLog)
    .values({
      userId: session.user.id,
      action: opts.action,
      entity: opts.entity,
      entityId: String(result?.entityId ?? opts.entityId ?? ""),
      diff: (result?.diff as object) ?? null,
    });
  if (opts.catalog) {
    updateTag(CATALOG_TAG);
    await purgeCdn();
  }
  if (opts.redirects) invalidateRedirects();
  return result;
}
