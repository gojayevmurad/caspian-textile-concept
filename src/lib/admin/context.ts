import "server-only";
import { ADMIN_PANEL_ROLES, requireRole } from "@/src/lib/auth/session";

/** Every admin page calls this (layouts are not an authorization boundary). */
export async function adminContext() {
  const { session, role } = await requireRole(ADMIN_PANEL_ROLES);
  return { user: session.user, role, readOnly: role !== "admin" };
}

/** Masks personal data for the read-only demo account. */
export function mask(value: string | null | undefined, readOnly: boolean) {
  if (!value) return value ?? "";
  if (!readOnly) return value;
  if (value.includes("@")) {
    const [u, d] = value.split("@");
    return `${u.slice(0, 1)}***@${d.replace(/^[^.]+/, (m) => m.slice(0, 1) + "***")}`;
  }
  if (/\d{5,}/.test(value.replace(/\D/g, "")))
    return value.replace(/\d(?=(?:\D*\d){3})/g, "•");
  return value.slice(0, 1) + "•••";
}
