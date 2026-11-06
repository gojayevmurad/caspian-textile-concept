import { redirect } from "next/navigation";
import { requireSession, roleOf } from "@/src/lib/auth/session";

// Post-login landing: operators go to the admin panel, everyone else to the site.
export default async function Page() {
  const session = await requireSession();
  const role = roleOf(session);
  redirect(role === "admin" || role === "demo_viewer" ? "/admin" : "/");
}
