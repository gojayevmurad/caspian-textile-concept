import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./admin.css";
import { adminContext } from "@/src/lib/admin/context";
import { AdminNav } from "@/src/components/admin/nav";
import { AdminSignOut } from "@/src/components/admin/sign-out";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
});
export const metadata: Metadata = {
  title: { default: "Admin · Caspian Textile", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, readOnly } = await adminContext();
  return (
    <html lang="az" className={inter.variable}>
      <body className="font-sans">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-brand-800 p-4 md:flex">
            <a
              href="/admin"
              className="mb-6 flex items-center gap-2 rounded-lg bg-white px-3 py-2"
            >
              <img
                src="/brand/logo.webp"
                alt="Caspian Textile"
                width={53}
                height={48}
                className="h-8 w-auto"
              />
              <span className="text-xs font-semibold text-brand">Admin</span>
            </a>
            <AdminNav />
            <div className="mt-auto border-t border-white/10 pt-4">
              <p className="truncate px-3 text-xs text-white/60">
                {user.email}
              </p>
              <p className="px-3 text-xs text-white/40">{role}</p>
              <AdminSignOut />
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            {readOnly && (
              <div
                role="note"
                className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950"
              >
                <strong>Demo — yalnız baxış rejimi.</strong> Bütün dəyişiklik
                əməliyyatları serverdə bloklanır (HTTP 403). Şəxsi məlumatlar
                maskalanıb.
              </div>
            )}
            <div className="border-b border-line bg-white px-4 py-3 md:hidden">
              <details>
                <summary className="cursor-pointer text-sm font-semibold">
                  Menyu
                </summary>
                <div className="mt-3 rounded-xl bg-brand-800 p-3">
                  <AdminNav />
                </div>
              </details>
            </div>
            <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
