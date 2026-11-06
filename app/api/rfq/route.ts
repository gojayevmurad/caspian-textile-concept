import { createHash, randomUUID } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { getEnv } from "@/src/config/env";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { sameOrigin } from "@/src/lib/security/validation";
import { withRequestLogging } from "@/src/lib/security/request";
import { rfqPayloadSchema } from "@/src/lib/rfq/schema";
import { notifyNewRfq } from "@/src/lib/rfq/notify";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  processImage,
  sniffImageType,
} from "@/src/lib/media/process";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function handler(request: Request) {
  const env = getEnv();
  if (!sameOrigin(request, env.APP_URL)) return json({ error: "origin" }, 403);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_UPLOAD_BYTES + 200_000)
    return json({ error: "too_large" }, 413);

  const ip =
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "local";
  const ipHash = createHash("sha256")
    .update(ip + (env.BETTER_AUTH_SECRET || "dev"))
    .digest("hex")
    .slice(0, 32);
  const [{ recent }] = await db()
    .select({ recent: sql<number>`count(*)::int` })
    .from(s.rfq)
    .where(
      and(
        eq(s.rfq.ipHash, ipHash),
        gt(s.rfq.createdAt, sql`now() - interval '1 hour'`),
      ),
    );
  if (recent >= 5) return json({ error: "rate_limited" }, 429);

  const form = await request.formData();
  let payload;
  try {
    payload = rfqPayloadSchema.parse(
      JSON.parse(String(form.get("payload") || "{}")),
    );
  } catch {
    return json({ error: "invalid" }, 400);
  }

  let logoMediaId: number | null = null;
  const logo = form.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > MAX_UPLOAD_BYTES)
      return json({ error: "logo_too_large" }, 413);
    const buf = Buffer.from(await logo.arrayBuffer());
    const type = sniffImageType(buf);
    if (!type || !(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(type))
      return json({ error: "logo_type" }, 415);
    const m = await processImage(buf, { maxWidth: 1080 });
    const [row] = await db()
      .insert(s.media)
      .values({
        hash: m.hash,
        originalName: logo.name.slice(0, 120),
        width: m.width,
        height: m.height,
        color: m.color,
        blur: m.blur,
        variants: m.variants,
        alt: {},
      })
      .onConflictDoUpdate({
        target: s.media.hash,
        set: { originalName: logo.name.slice(0, 120) },
      })
      .returning({ id: s.media.id });
    logoMediaId = row.id;
  }

  // Resolve products server-side; never trust names/SKUs from the client.
  const ids = payload.items.map((i) => i.productId);
  const skus = payload.skus ?? [];
  const products =
    ids.length || skus.length
      ? await db()
          .select({
            id: s.product.id,
            sku: s.product.sku,
            name: s.productTranslation.name,
          })
          .from(s.product)
          .innerJoin(
            s.productTranslation,
            and(
              eq(s.productTranslation.productId, s.product.id),
              eq(s.productTranslation.locale, "en"),
            ),
          )
          .where(
            sql`${s.product.id} in (${sql.join(
              [...ids, -1].map((i) => sql`${i}`),
              sql`, `,
            )}) or ${s.product.sku} in (${sql.join(
              [...skus, ""].map((k) => sql`${k}`),
              sql`, `,
            )})`,
          )
      : [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const items = [
    ...payload.items
      .filter((i) => byId.has(i.productId) && i.lines.length)
      .map((i) => ({ product: byId.get(i.productId)!, lines: i.lines })),
    ...products
      .filter((p) => skus.includes(p.sku) && !ids.includes(p.id))
      .map((p) => ({
        product: p,
        lines: [{ size: null, color: null, qty: 1 }],
      })),
  ];
  if (!items.length) return json({ error: "no_products" }, 400);

  const id = randomUUID();
  const { number } = await db().transaction(async (tx) => {
    const [row] = await tx
      .insert(s.rfq)
      .values({
        id,
        kind: payload.kind,
        locale: payload.locale,
        company: payload.company,
        contactName: payload.contactName,
        email: payload.email,
        phone: payload.phone,
        taxId: payload.taxId,
        country: payload.country,
        targetDate: payload.targetDate,
        message: payload.message,
        logoMediaId,
        branding: payload.branding ?? null,
        ipHash,
      })
      .returning({ number: s.rfq.number });
    await tx.insert(s.rfqItem).values(
      items.map((i) => ({
        rfqId: id,
        productId: i.product.id,
        sku: i.product.sku,
        name: i.product.name,
        matrix: i.lines,
        totalQty: i.lines.reduce((a, l) => a + l.qty, 0),
      })),
    );
    return row;
  });
  await notifyNewRfq({
    number,
    kind: payload.kind,
    company: payload.company,
    items: items.length,
    totalQty: items.reduce(
      (a, i) => a + i.lines.reduce((b, l) => b + l.qty, 0),
      0,
    ),
  }).catch(() => {});
  return json({ number: `RFQ-${String(number).padStart(4, "0")}` }, 201);
}

export const POST = withRequestLogging(handler, "rfq.create");
