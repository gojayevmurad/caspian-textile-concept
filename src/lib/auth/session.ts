import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from ".";

export type Role = "admin" | "demo_viewer" | "customer";
export const ADMIN_PANEL_ROLES: readonly Role[] = ["admin", "demo_viewer"];

export async function getSession() {
  const requestHeaders = await headers();
  if (!process.env.DATABASE_URL) return null;
  return auth().api.getSession({ headers: requestHeaders });
}

export async function requireSession() {
  const session = await getSession();
  if (!session || !session.user.emailVerified) redirect("/sign-in");
  return session;
}

export function roleOf(
  session: { user: { role?: unknown } } | null,
): Role | null {
  const role = session?.user.role;
  return role === "admin" || role === "demo_viewer" || role === "customer"
    ? role
    : null;
}

/** Page guard: redirects anonymous users to sign-in and other roles to the home page. */
export async function requireRole(roles: readonly Role[]) {
  const session = await requireSession();
  const role = roleOf(session);
  if (!role || !roles.includes(role)) redirect("/");
  return { session, role };
}

export class ForbiddenError extends Error {
  readonly status: number;
  constructor(status = 403, message = "Forbidden") {
    super(message);
    this.status = status;
  }
}

/**
 * Mutation guard for Server Actions and Route Handlers. Only real admins may write;
 * the read-only demo account and everyone else get 403. Never rely on UI hiding.
 */
export async function requireWriter() {
  const session = await getSession();
  if (!session || !session.user.emailVerified)
    throw new ForbiddenError(401, "Unauthorized");
  if (roleOf(session) !== "admin")
    throw new ForbiddenError(403, "This account is read-only");
  return session;
}
