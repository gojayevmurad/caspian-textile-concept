import "server-only";
import { Resend } from "resend";
import { getEnv } from "@/src/config/env";
import { logger } from "@/src/lib/logger";

/** Notifies the demo owner only (NOTIFY_EMAIL). Never emails the company or the requester in demo mode. */
export async function notifyNewRfq(rfq: {
  number: number;
  kind: string;
  company: string;
  totalQty: number;
  items: number;
}) {
  const env = getEnv();
  if (env.EMAIL_MODE !== "send" || !env.NOTIFY_EMAIL || !env.RESEND_API_KEY) {
    logger.info(
      { rfq: rfq.number, kind: rfq.kind },
      "RFQ received (notification preview only)",
    );
    return;
  }
  const subject = `RFQ-${rfq.number}: ${rfq.company} — ${rfq.totalQty} pcs`;
  const result = await new Resend(env.RESEND_API_KEY).emails.send({
    from: env.EMAIL_FROM,
    to: env.NOTIFY_EMAIL,
    subject,
    text: `New ${rfq.kind} request RFQ-${rfq.number}\nCompany: ${rfq.company}\nProducts: ${rfq.items}\nTotal quantity: ${rfq.totalQty}\n\nOpen ${env.APP_URL}/admin/rfqs`,
  });
  if (result.error)
    logger.warn({ code: result.error.name }, "RFQ notification failed");
}
