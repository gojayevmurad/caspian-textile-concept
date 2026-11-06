import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { SiteHeader } from "@/src/components/site-header";
import { AuthForm } from "@/src/components/auth-form";
export default async function Page() {
  await connection();
  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <div className="auth-card">
          <span className="overline">CASPIAN TEXTILE · ADMIN</span>
          <h1>Admin panelə giriş</h1>
          <p>
            Demo hesab məlumatları case-study səhifəsində və müraciət məktubunda
            verilib.
          </p>
          <Suspense fallback={<p>Loading form…</p>}>
            <AuthForm
              mode="sign-in"
              google={Boolean(process.env.GOOGLE_CLIENT_ID)}
            />
          </Suspense>
        </div>
        <p className="auth-legal">
          <Link href="/">← Sayta qayıt</Link> ·{" "}
          <Link href="/mexfilik">Məxfilik</Link>
        </p>
      </main>
    </>
  );
}
