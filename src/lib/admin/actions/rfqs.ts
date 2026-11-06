"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/src/lib/db";
import * as s from "@/src/lib/db/schema";
import { mutate } from "@/src/lib/admin/mutation";

export async function updateRfq(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const back = `/admin/rfqs/${id}`;
  await mutate(
    { action: "rfq.update", entity: "rfq", entityId: id, back },
    async () => {
      const status = z
        .enum(["new", "in_review", "quoted", "won", "lost"])
        .parse(formData.get("status"));
      const internalNotes = z
        .string()
        .max(5000)
        .parse(formData.get("internalNotes") ?? "");
      const assignee = z
        .string()
        .max(120)
        .parse(formData.get("assignee") ?? "");
      await db()
        .update(s.rfq)
        .set({
          status,
          internalNotes,
          assignee: assignee || null,
          updatedAt: new Date(),
        })
        .where(eq(s.rfq.id, id));
      return { diff: { status, assignee } };
    },
  );
  redirect(`${back}?saved=1`);
}
