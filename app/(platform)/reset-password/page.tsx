import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/src/components/site-header";
import { AuthForm } from "@/src/components/auth-form";
export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <div className="auth-card">
          <span className="overline">YOUR NEXT CHAPTER</span>
          <h1>A fresh set of keys.</h1>
          <p>Choose a strong password for your account.</p>
          <Suspense fallback={<p>Loading form…</p>}>
            <AuthForm
              mode="reset-password"
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
