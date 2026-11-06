/* Caspian Textile concept — service worker (hand-written, no build step).
   - /_next/static and /media: cache-first (content-hashed, immutable)
   - page navigations: network-first with a short timeout, then cached copy, then offline page
   - admin, auth and API: never cached */
const VERSION = "ct-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const OFFLINE = { az: "/offline", en: "/en/offline", ru: "/ru/offline" };
const PRECACHE = [
  ...Object.values(OFFLINE),
  "/brand/logo.webp",
  "/brand/icon-192.png",
];
const NEVER =
  /^\/(api|admin|sign-in|settings|billing|dashboard|forgot-password|reset-password|verify-email)(\/|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const lang = (path) =>
  path.startsWith("/en") ? "en" : path.startsWith("/ru") ? "ru" : "az";

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - max)))
    await cache.delete(k);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || NEVER.test(url.pathname)) return;

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/media/") ||
    url.pathname.startsWith("/brand/")
  ) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGES);
        try {
          const res = await Promise.race([
            fetch(req),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 3500),
            ),
          ]);
          if (res.ok) {
            cache.put(req, res.clone());
            trimCache(PAGES, 60);
          }
          return res;
        } catch {
          return (
            (await cache.match(req)) ||
            (await caches.match(OFFLINE[lang(url.pathname)])) ||
            Response.error()
          );
        }
      })(),
    );
  }
});
