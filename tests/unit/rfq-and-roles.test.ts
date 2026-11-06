import { describe, it, expect, vi, beforeEach } from "vitest";
import { rfqPayloadSchema } from "@/src/lib/rfq/schema";
import { mask } from "@/src/lib/admin/context";

const valid = {
  kind: "quote",
  locale: "az",
  company: "ACME",
  contactName: "Ali",
  email: "ali@example.com",
  phone: "+994 50 000 00 00",
  consent: true,
  items: [{ productId: 1, lines: [{ size: "L", color: "blue", qty: 10 }] }],
};

describe("RFQ payload validation", () => {
  it("accepts a valid quote", () =>
    expect(rfqPayloadSchema.safeParse(valid).success).toBe(true));
  it("rejects a filled honeypot", () =>
    expect(
      rfqPayloadSchema.safeParse({ ...valid, website: "spam" }).success,
    ).toBe(false));
  it("requires consent", () =>
    expect(
      rfqPayloadSchema.safeParse({ ...valid, consent: false }).success,
    ).toBe(false));
  it("rejects absurd quantities and empty baskets", () => {
    expect(
      rfqPayloadSchema.safeParse({
        ...valid,
        items: [{ productId: 1, lines: [{ size: "L", color: null, qty: 0 }] }],
      }).success,
    ).toBe(false);
    expect(rfqPayloadSchema.safeParse({ ...valid, items: [] }).success).toBe(
      false,
    );
  });
  it("accepts a sample request by SKU", () =>
    expect(
      rfqPayloadSchema.safeParse({
        ...valid,
        kind: "sample",
        items: [],
        skus: ["KOM-4-WP-340"],
      }).success,
    ).toBe(true));
});

describe("demo masking", () => {
  it("masks email and phone for read-only users only", () => {
    expect(mask("ali@example.com", true)).toBe("a***@e***.com");
    expect(mask("+994 50 123 45 67", true)).not.toContain("123");
    expect(mask("ali@example.com", false)).toBe("ali@example.com");
  });
});

// --- Role guard: the demo account must never be able to write -------------------------
const getSessionMock = vi.fn();
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock("@/src/lib/auth", () => ({
  auth: () => ({ api: { getSession: getSessionMock } }),
}));

describe("requireWriter", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://unused";
    getSessionMock.mockReset();
  });
  const session = (role: string, emailVerified = true) => ({
    user: { id: "u", email: "x@y.z", emailVerified, role },
  });

  it("allows admins", async () => {
    const { requireWriter } = await import("@/src/lib/auth/session");
    getSessionMock.mockResolvedValue(session("admin"));
    await expect(requireWriter()).resolves.toBeTruthy();
  });
  it.each(["demo_viewer", "customer"])("rejects %s with 403", async (role) => {
    const { requireWriter, ForbiddenError } =
      await import("@/src/lib/auth/session");
    getSessionMock.mockResolvedValue(session(role));
    const err = await requireWriter().catch((e) => e);
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.status).toBe(403);
  });
  it("rejects anonymous and unverified users with 401", async () => {
    const { requireWriter } = await import("@/src/lib/auth/session");
    getSessionMock.mockResolvedValue(null);
    expect((await requireWriter().catch((e) => e)).status).toBe(401);
    getSessionMock.mockResolvedValue(session("admin", false));
    expect((await requireWriter().catch((e) => e)).status).toBe(401);
  });
  it("redirects non-panel roles away from admin pages", async () => {
    const { requireRole, ADMIN_PANEL_ROLES } =
      await import("@/src/lib/auth/session");
    getSessionMock.mockResolvedValue(session("customer"));
    await expect(requireRole(ADMIN_PANEL_ROLES)).rejects.toThrow("REDIRECT:/");
    getSessionMock.mockResolvedValue(session("demo_viewer"));
    await expect(requireRole(ADMIN_PANEL_ROLES)).resolves.toMatchObject({
      role: "demo_viewer",
    });
  });
});
