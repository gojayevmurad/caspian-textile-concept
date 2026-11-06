import { desc, eq } from "drizzle-orm";
import { getSession, roleOf } from "@/src/lib/auth/session";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { mask } from "@/src/lib/admin/context";

const csv = (v: unknown) => {
  const str = String(v ?? "");
  // Neutralize spreadsheet formula injection and quote every cell.
  return `"${(/^[=+\-@]/.test(str) ? `'${str}` : str).replace(/"/g, '""')}"`;
};

export async function GET(request: Request) {
  const session = await getSession();
  const role = roleOf(session);
  if (role !== "admin" && role !== "demo_viewer")
    return new Response("Forbidden", { status: 403 });
  const readOnly = role !== "admin";
  const status = new URL(request.url).searchParams.get("status");
  const rows = await db()
    .select()
    .from(s.rfq)
    .where(status ? eq(s.rfq.status, status) : undefined)
    .orderBy(desc(s.rfq.createdAt));
  const items = await db().select().from(s.rfqItem);
  const header = [
    "number",
    "kind",
    "status",
    "created_at",
    "company",
    "contact",
    "email",
    "phone",
    "tax_id",
    "country",
    "target_date",
    "items",
    "total_qty",
  ];
  const lines = rows.map((r) => {
    const its = items.filter((i) => i.rfqId === r.id);
    return [
      `RFQ-${String(r.number).padStart(4, "0")}`,
      r.kind,
      r.status,
      r.createdAt.toISOString(),
      mask(r.company, readOnly),
      mask(r.contactName, readOnly),
      mask(r.email, readOnly),
      mask(r.phone, readOnly),
      mask(r.taxId, readOnly),
      r.country,
      r.targetDate,
      its.map((i) => `${i.sku}×${i.totalQty}`).join("; "),
      its.reduce((a, i) => a + i.totalQty, 0),
    ]
      .map(csv)
      .join(",");
  });
  return new Response("﻿" + [header.join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rfqs-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
