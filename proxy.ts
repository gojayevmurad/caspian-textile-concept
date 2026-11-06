import { NextResponse, type NextRequest } from "next/server";
import { toInternalPath } from "@/src/lib/i18n/config";
import { recordHit, resolveLegacy } from "@/src/lib/redirects/table";

// Everything that is not a public, localized page is served as-is.
const PASSTHROUGH =
  /^\/(?:_next|api|media|admin|sign-in|forgot-password|reset-password|verify-email|settings|billing|dashboard|monitoring)(?:\/|$)/;
const FILE = /\.[a-z0-9]{2,5}$/i;

function withRobots(res: NextResponse) {
  if (process.env.SITE_INDEXABLE !== "true")
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

function gone() {
  return withRobots(
    new NextResponse(
      '<!doctype html><html lang="az"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>410</title><body style="font-family:system-ui;padding:48px;max-width:640px;margin:auto"><h1>410 — Bu səhifə silinib</h1><p>This page has been permanently removed.</p><p><a href="/">caspian-textile → ana səhifə</a></p></body></html>',
      {
        status: 410,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      },
    ),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PASSTHROUGH.test(pathname)) return withRobots(NextResponse.next());
  if (FILE.test(pathname) && !pathname.startsWith("/product"))
    return NextResponse.next();

  const resolved = toInternalPath(pathname);
  if (resolved.canonicalRedirect !== undefined) {
    // /az/... (legacy WPML prefix or non-canonical default locale) → try legacy map first.
    const legacy = await resolveLegacy(pathname);
    if (legacy) return legacyResponse(request, legacy);
    const url = request.nextUrl.clone();
    url.pathname = resolved.canonicalRedirect || "/";
    return withRobots(NextResponse.redirect(url, 308));
  }
  if (resolved.internal.includes("/__unknown/")) {
    const legacy = await resolveLegacy(pathname);
    if (legacy) return legacyResponse(request, legacy);
    const url = request.nextUrl.clone();
    url.pathname = `/${resolved.locale}/x-404`;
    return withRobots(NextResponse.rewrite(url));
  }
  const url = request.nextUrl.clone();
  url.pathname = resolved.internal;
  url.search = search;
  const res = NextResponse.rewrite(url);
  res.headers.set("Content-Language", resolved.locale);
  return withRobots(res);
}

function legacyResponse(
  request: NextRequest,
  legacy: { to: string; status: number; id?: number },
) {
  if (legacy.id) recordHit(legacy.id);
  if (legacy.status === 410 || !legacy.to) return gone();
  const target = new URL(legacy.to, request.nextUrl.origin);
  return withRobots(
    NextResponse.redirect(target, legacy.status === 302 ? 302 : 301),
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|robots.txt|sitemap.xml|llms.txt|llms-full.txt).*)",
  ],
};
