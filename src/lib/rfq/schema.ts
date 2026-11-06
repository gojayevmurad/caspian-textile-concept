import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
export const rfqLineSchema = z.object({
  size: z.string().max(12).nullable(),
  color: z.string().max(24).nullable(),
  qty: z.number().int().min(1).max(100_000),
});
export const rfqPayloadSchema = z
  .object({
    kind: z.enum(["quote", "sample"]),
    locale: z.enum(["az", "en", "ru"]),
    company: text(160),
    contactName: text(120),
    email: z.email().max(200),
    phone: z
      .string()
      .trim()
      .min(5)
      .max(40)
      .regex(/^[+\d\s()-]+$/),
    taxId: z.string().trim().max(20).optional(),
    country: z.string().trim().max(80).optional(),
    targetDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    message: z.string().trim().max(2000).optional(),
    website: z.string().max(0).optional(), // honeypot must stay empty
    consent: z.literal(true),
    skus: z.array(z.string().trim().max(40)).max(20).optional(),
    items: z
      .array(
        z.object({
          productId: z.number().int().positive(),
          lines: z.array(rfqLineSchema).max(50),
        }),
      )
      .max(100),
    branding: z
      .object({
        placement: z.enum(["chest-left", "chest-right", "back", "sleeve"]),
        method: z.enum(["embroidery", "print"]),
        scale: z.number().min(5).max(60),
      })
      .optional(),
  })
  .refine(
    (v) =>
      v.kind === "quote"
        ? v.items.some((i) => i.lines.length)
        : (v.skus?.length ?? 0) > 0 || v.items.length > 0,
    { message: "No products" },
  );
export type RfqPayload = z.infer<typeof rfqPayloadSchema>;
