import "./[lang]/site.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "404", robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <html lang="az">
      <body className="flex min-h-screen items-center justify-center bg-surface p-6 font-sans">
        <main className="max-w-md text-center">
          <img
            src="/brand/logo.webp"
            alt="Caspian Textile"
            width={106}
            height={96}
            className="mx-auto h-14 w-auto"
          />
          <h1 className="mt-6 text-2xl font-bold">404</h1>
          <p className="mt-2 text-muted">
            Səhifə tapılmadı · Page not found · Страница не найдена
          </p>
          <a href="/" className="btn-primary mt-6">
            Ana səhifə
          </a>
        </main>
      </body>
    </html>
  );
}
