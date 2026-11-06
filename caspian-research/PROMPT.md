# Build prompt — Caspian Textile concept rebuild (Next.js, from `gojayevmurad/nextjs-boilerplate`)

> Paste everything below the line into a fresh Claude Code session started in an empty folder.
> Put the `caspian-research/` folder (this file, `AUDIT.md`, `data/`, `bench/`) next to the new repo, or copy it into `research/` inside it.

---

## 0. Role and outcome

You are a senior full-stack engineer. Build a **concept rebuild of caspiantextile.com** that a job applicant (Murad Gojayev) will send to Caspian Textile MMC as a portfolio link for their **Full-stack Developer** vacancy. The result must be a working, deployed product, not a mockup:

1. A fast, multilingual (az / en / ru), installable (PWA), SPA-feeling **public site** with the company's real catalogue (same products, same images, same texts — cleaned up).
2. A real **admin panel / CMS** (products, categories, industries, RFQs, content, SEO, redirects) with a **read-only demo account** that recruiters can log into.
3. A **B2B flow**: quote basket → RFQ with per-size/colour quantities → logo upload & preview → admin inbox with status pipeline; sample request; PDF spec sheets and PDF catalogue.
4. A **`/case-study` page** that proves, with measured numbers, what changed versus the current site, and maps every vacancy requirement to where it is demonstrated.
5. A final **application message in Azerbaijani** (see §12).

Everything must be honest: no invented certifications, testimonials, clients, stock levels or metrics. Anything not verified is labelled **NOT VERIFIED**.

## 1. Read first (mandatory, in this order)

1. `research/AUDIT.md` — the audit of the current site with evidence. Every problem listed there must be either fixed or explicitly justified in `DECISIONS.md`.
2. Create the repo from the template: `gh repo create gojayevmurad/caspian-textile-concept --private --template gojayevmurad/nextjs-boilerplate --clone` (ask before making it public; it will be made public at the end so the company can read the code).
3. In the new repo read **AGENTS.md, INIT_PROMPT.md, START_NEW_SAAS.md, ARCHITECTURE.md, SECURITY.md, BILLING.md, ANALYTICS.md, DEPLOYMENT.md, VERIFICATION.md, README.md**. Follow them. AGENTS.md says this Next.js version (16.4.x) has breaking changes: read the relevant guides in `node_modules/next/dist/docs/` before writing routing, caching, metadata, i18n, image or middleware/proxy code. Do not code from memory.
4. Initialise with `pnpm setup -- --name "Caspian Textile (concept)" --slug caspian-textile --domain caspian.muradgojayev.com --repository gojayevmurad/caspian-textile-concept --description "Concept rebuild of caspiantextile.com" --color '<brand blue sampled from data/screenshots>'`. Never hand-copy secrets.
5. Keep the template's architecture: one App Router app, one PostgreSQL DB, Drizzle migrations reviewed as SQL, Better Auth, Pino, Sentry, consent-gated PostHog, Docker standalone ARM64 image, central Caddy, GHCR digests, manual/protected deploy modes. Put new code inside the existing boundaries (`src/lib/*`, `app/*`).

### Deliberate deviations from the template (document each in `DECISIONS.md` and update `SECURITY.md` / `ARCHITECTURE.md`)
- **Roles.** The template has "no RBAC". Add the smallest possible role model: `user.role ∈ {admin, demo_viewer, customer}` (one column + check constraint + index). One server helper `requireRole(...)` used by every admin page **and** every admin mutation/route handler. Layouts/nav are not authorization.
- **Demo login.** SECURITY.md says "no production demo login". Here it is a product requirement, so implement it safely: a `demo_viewer` account created by an explicit operator script (`pnpm admin:create-demo`, never a migration/seed that runs automatically), credentials shown only on `/case-study` and in the application message, **every write path returns 403 for demo_viewer server-side** (covered by tests), a persistent "Demo — read-only" banner, rate-limited login, sessions short-lived, no access to user emails/PII (mask them), no access to settings/secrets/users list. Admin uploads/edits are impossible for the demo user.
- **Billing.** Polar's acceptable-use policy **forbids physical goods** and purely human-delivered services, so Polar must NOT be used to sell uniforms. Keep the template's Polar sandbox integration, but attach it to a genuinely digital product line that fits the company: *digital sewing patterns / tech-packs from the company's design & construction bureau* (PDF/DXF download delivered automatically after payment). Build a `PaymentProvider` boundary so a local card acquirer (e.g. a Baku bank / local PSP) or Stripe can be added later for physical orders. On the case-study page explain this honestly: "global card payments for digital products via Polar (sandbox); physical B2B orders go through RFQ/invoice". Never mark a payment successful from a return URL (the template already enforces this).

## 2. Inputs you have

`research/data/` (scraped with Apify from the live site, real browser, 2026-11-06):
- `products.normalized.json` — products grouped by SKU with `translations.{az,en,ru}` (name, slug, short description, description HTML, categories, sourceUrl), images (with `local` paths), price (AZN), attributes (Color/Size/Brand), variations, and an `issues` array (missing/untranslated translations).
- `categories.json` (per language), `attributes.json`, `pages.json` (About/Contact/etc. text per language), `raw/site-data.json` (full Store API + WP API dumps, sitemaps, robots), `raw/rendered-pages.json` (rendered text, headings, meta, JSON-LD, nav links of key pages), `image-map.json` (source URL → local file).
- `images/` — original uploads (mostly 300–700 KB PNGs). `screenshots/` — desktop & mobile full-page captures of the current site (design reference: keep brand colours/logo, improve everything else).
- **Do not commit `research/data/images`, `research/data/raw` or screenshots** (≈200 MB, and the images belong to the company). Add them to `.gitignore`; the importer reads them from the local path and, for deployment, the processed media is copied to the VPS volume by an explicit operator step (`pnpm media:sync`, rsync over SSH, ask before running). Commit only `AUDIT.md`, `bench/`, and small JSON fixtures needed by tests.
- `research/bench/bench.mjs` + `baseline.json` — cold-visit benchmark of the current site (real Chrome, fresh profile, mobile Slow-4G+4×CPU and desktop). **Use the same script, same pages, same profiles, same machine location for the "after" numbers.** Do not hammer the old site: it rate-limits repeated automated visits (a second run got only the 409 page). Reuse `baseline.json`; if you must re-measure the old site, do one `RUNS=3` pass and note the date. `baseline-fastdns.json` isolates the `.local` CSS effect (home FCP 7.0 s → 4.2 s mobile when that host fails fast).

Company facts (from the vacancy page and the current Contact/About pages; use, don't embellish):
- Head office: Jafar Jabbarli St 44, Caspian Plaza, 3rd block, office 506, Baku · +994 12 311 39 49 · +994 50 523 50 00 · info@caspiantextile.com
- Factory: Lökbatan, Qobu Park 3, bina 25, Baku (lat 40.342921, lng 49.752713) · +994 12 545 20 63/64 · +994 50 582 50 00
- Own sewing factory with cutting, sewing, dyeing, embroidery, ironing and packing shops plus a model design & construction bureau; custom models developed with special software. Workwear, uniforms and PPE for construction/heavy industry, logistics, hospitality, healthcare, education, emergency services, corporate.
- The current Contact page states the company has served SOCAR and Pasha Holding. You may show this only as quoted from the company's own site, without logos, and the admin must be able to remove it.
- Catalogue reality (from `products.normalized.json`): **135 unique products, 116 of them exist only in English**; only 16 have an Azerbaijani and 18 a Russian version; 12 are complete in all three languages. One product has no image (placeholder on the live site). Prices exist in AZN for 134 products.

## 3. Data import (`pnpm import:legacy`)

Write an idempotent importer (`scripts/import-legacy.ts`) that reads `research/data` and fills the DB:
- Group by SKU (already done in the normalized file); **one product, three translations**. 116 of 135 products have only English text, so an az-default site would otherwise show English everywhere. Fill the gaps with **AI drafts**: you (the agent) write az/ru translations of names, short descriptions and descriptions into `research/translations.draft.json` (keep product/brand names and SKUs untouched, use correct Azerbaijani industry terms), import them with `translation_status = 'ai_draft'`, show a small "AI tərcüməsi" / "AI-перевод" badge on the public page, and list them in an admin "Translation review" queue where an admin approves or edits them (status → `approved`). Never present AI drafts as company-approved text.
- Decode HTML entities (`&#8211;` etc.), strip Elementor/WordPress inline styles from descriptions, convert to sanitized rich text.
- Map legacy categories to two taxonomies: **Industries** (construction & heavy industry, logistics & transport, hospitality & catering, healthcare & medicine, education & school, emergency & rescue, corporate & administrative, PPE) and **Product types** (coveralls, jackets, vests, shirts/polos, boots, gloves, respirators, helmets…). Keep `legacy_url` per product/category for redirects.
- Images: process every original with `sharp` into AVIF + WebP at 320/640/960/1280/1600 widths, generate a tiny blur placeholder (base64) and dominant colour, store dimensions. Originals are not served. Store processed media on a persistent Docker volume (`/data/media`), served by a cached route (`/media/...`, `Cache-Control: public, max-age=31536000, immutable`, content-hashed filenames). The same pipeline runs for admin uploads.
- Produce `research/import-report.md`: counts per language, gaps, duplicates, missing images.

## 4. Public site — requirements

**Routing & i18n.** `az` is the default locale (Azerbaijani company, Azerbaijani market) at `/`, with `/en` and `/ru`. Localised slugs. `hreflang` (az, en, ru, x-default) and self-canonicals on every page. Language switcher keeps the user on the equivalent page. All UI strings in message files; no hard-coded text.

**Pages.** Home; Industries (index + each industry); Catalogue with faceted filtering (industry, type, colour, size, brand, in-stock) reflected in the URL (shareable, SSR'd, crawlable for the main facets only — `noindex,follow` for combinations); Product detail (gallery with zoom, colour swatches, size table, specs, care, downloads, "add to quote", related products, compare up to 4); Quote basket; RFQ form; Sample request; Logo customisation preview; About / Factory (production chain: design bureau → cutting → sewing → dyeing → embroidery → ironing → packing, as a visual timeline using real photos where available); Contact (map, hours, click-to-call, WhatsApp click-to-chat, form); Digital patterns shop (Polar sandbox); Search (instant, typo-tolerant, all three languages — PostgreSQL full-text + `pg_trgm`, no external service); 404/500 localised; Privacy/Terms placeholders clearly marked as drafts; `/case-study`.

**B2B practices from global leaders** (Portwest, Engelbert Strauss, Red Kap, Carhartt Company Gear, Cintas — see AUDIT.md §9). Implement:
- Quote basket instead of a consumer checkout; per-line quantity matrix (size × colour), target date, company details, VAT/VÖEN field, file attachments.
- Logo upload with live placement preview (chest-left/right, back, sleeve) on the product image, saved with the RFQ; note "final proof approved before embroidery".
- Product downloads: auto-generated **PDF spec sheet** per product and language; **PDF catalogue** per industry and full catalogue (generated server-side, cached, regenerated on content change).
- Size guide component; care-instruction icons.
- **Standards/certifications field** (EN ISO 20471, EN ISO 11612, EN 343, …) as structured, filterable data with badges — but **leave it empty** for imported products unless the source data states it. Admin can fill it. Never invent compliance.
- Bulk-order hint ("Price on request for 50+ pcs"), lead-time field, minimum-order field (admin-editable, empty by default).
- Sticky mobile CTA ("Qiymət təklifi al"), WhatsApp button, phone.

**UX & SPA feel.** App Router client navigation with prefetch, View Transitions for page changes, optimistic quote-basket updates, skeletons only where data is truly dynamic, no layout shift (reserved image boxes from stored dimensions). Mobile-first; test at 360, 390, 768, 1024, 1440. Zoom must be allowed (the current site disables it — accessibility failure). Dark mode optional; light default.

**Accessibility.** WCAG 2.2 AA: one `h1` per page (the current home page has none), logical heading order, alt text for every image (generate from product name + colour when missing, editable in admin), visible focus, keyboard-operable menus/gallery/filters, colour contrast ≥ 4.5:1, form errors announced. Automated axe checks in Playwright.

## 5. Performance budget (fail CI if exceeded)

Measured on the home, catalogue and a product page with `bench.mjs` (mobile Slow-4G, 4× CPU) and Lighthouse CI:
- LCP ≤ 2.0 s mobile (target < 1.5 s), CLS ≤ 0.05, INP/TBT green, TTFB from Baku ≤ 200 ms for cached HTML.
- First-load JS ≤ 120 KB gzip on public pages; zero jQuery; no slider libraries; no render-blocking third-party CSS.
- Home page total transfer ≤ 700 KB on first visit (the current site ships 6.3 MB on mobile / 10.8 MB on desktop in 123–133 requests; FCP ≈ 7 s, LCP 31 s on mobile Slow 4G, CLS up to 1.03 on product pages — see `bench/baseline.json`).
- Self-host fonts with `next/font` (subset latin + latin-ext + cyrillic for az/ru; only the weights actually used).
- Lighthouse ≥ 95 in all four categories on mobile.
- Server Components by default; client components only for interactivity. Static generation / ISR for catalogue and product pages with on-demand revalidation (`revalidateTag`) when the admin edits content.

## 6. Hosting, CDN and the "server is in the US" problem

Current state (see AUDIT.md): Bluehost shared hosting in **Phoenix, USA**, no CDN in front of the main domain, ~212 ms RTT from Baku, plus a JavaScript cookie interstitial that returns HTTP 409 on every first request. Target:
- App on the owner's **Hetzner VPS (EU)**, ARM64 image, deployed with the template's pipeline (GHCR digest, `deploy.sh`, central Caddy). Domain **`caspian.muradgojayev.com`** on Cloudflare, **proxied** (orange cloud), SSL mode **Full (strict)**, HTTP/3, Brotli, Tiered Cache.
- Cloudflare has PoPs in Baku, so cache public HTML and media at the edge: Cache Rules for `/media/*` and `/_next/static/*` (immutable, 1 year), public pages with `s-maxage` + `stale-while-revalidate` and **bypass when an auth cookie is present** or path starts with `/admin`, `/api`. Purge by URL/tag from the admin "publish" action (Cloudflare API token stored as a server secret, scoped to cache purge only).
- **No JS challenge interstitial.** Bot protection via Cloudflare's managed rules / rate limiting on `/api/*` and auth endpoints only. Search engines and AI crawlers must receive full SSR HTML with HTTP 200.
- Measure: TTFB and LCP from Baku before/after (`bench.mjs`), and record the `cf-ray` PoP code (should be a Baku colo) in the case study. Do not claim a PoP you did not observe.
- Do not touch DNS/Cloudflare/VPS without the owner's explicit go-ahead at that step; prepare the exact changes and ask.

## 7. PWA

Web App Manifest (name, short_name, az/en/ru, theme colour, maskable icons generated from the logo), service worker (verify a Next 16-compatible approach in the docs — e.g. Serwist if it supports this version, otherwise a small hand-written SW): precache the app shell and offline page, stale-while-revalidate for catalogue/product HTML and `/media`, network-only for `/admin`, `/api/auth`, checkout. Offline: browse previously viewed products, keep the quote basket in IndexedDB, queue RFQ submission with Background Sync and show its state. Install prompt UX on mobile. Lighthouse PWA/installability checks pass.

## 8. SEO and GEO (generative-engine optimisation)

The demo must be **`noindex`** (it is not the company's site) — implement everything production-ready behind `SITE_INDEXABLE=false` (adds `X-Robots-Tag: noindex, nofollow`, robots meta, `Disallow: /`). With the flag on, everything below must be correct:
- Per-locale titles/descriptions (admin-editable, length-checked), OG/Twitter tags, **dynamic OG images** per product/industry (`opengraph-image`), canonical + hreflang, localized XML sitemaps (with image entries and `lastmod`) and a sitemap index, clean `robots.txt`.
- JSON-LD: `Organization` + `LocalBusiness`/`ClothingStore`-appropriate type with address, geo, phone, opening hours (only if known); `WebSite` + `SearchAction`; `Product` (name, sku, image, brand, description, `offers` only when a real price exists, `availability`); `BreadcrumbList`; `FAQPage` where real FAQs exist. Validate with the Schema.org validator rules in tests.
- **301 redirect map** from every legacy URL (`/product/*`, `/product-category/*`, `/az/*`, `/ru/*`, `/shop/?pdr-flr=*`, About/Contact slugs) to the new URLs, stored in DB and editable in admin ("Redirects"). This is what makes a migration safe for existing Google rankings.
- Remove the theme demo blog posts (e.g. "Summer 2019 fashion trends", "Top 10 red carpet styles") — do not import them. Replace with real, admin-authored content types: industry guides, care guides, "how to choose FR workwear" — create the content model and 2–3 clearly marked draft examples, not fake facts.
- GEO: a correct `/llms.txt` (and `/llms-full.txt`) generated from the DB (company summary, industries, product types, contact, links), clean semantic HTML, fact blocks on About (founded, location, capabilities) only from verified sources, `robots.txt` that explicitly allows major AI crawlers when indexable. Server-rendered content for every crawler (no JS gate).
- Core Web Vitals RUM: send web-vitals to PostHog (consent-gated, as in the template) and show p75 in the admin dashboard.

## 9. Admin panel (`/admin`)

Server-protected (`requireRole`), responsive, fast. Modules:
- **Dashboard**: RFQs by status, new this week, top requested products, translation-gap count, p75 Web Vitals, last deploys (read from env/build info).
- **Products**: list with keyset pagination (per ARCHITECTURE.md), search/filter, create/edit with **az/en/ru tabs**, rich text, images (drag-drop upload → sharp pipeline, reorder, alt text per language), variants (size/colour), standards, industries/types, SEO fields with live SERP preview, publish/unpublish (triggers revalidation + CDN purge), "needs translation" queue.
- **Categories / Industries / Attributes** CRUD with translations.
- **RFQs & sample requests**: inbox, detail with quantity matrix and logo preview, status pipeline (new → in review → quoted → won/lost), internal notes, assignee, CSV export, email notification via Resend (in the demo deployment, notifications go **only** to the applicant's own address — never to Caspian Textile).
- **Content**: home page blocks (hero, industries strip, featured products, factory timeline), About, Contact info, FAQs — a simple block-based CMS, no page builder.
- **Redirects**, **Media library**, **Users** (admin only; hidden from demo), **Audit log** (who changed what, when).
- **Public REST API** `/api/v1` (products, categories, industries; read-only, cached, rate-limited) with an **OpenAPI 3.1** spec and a docs page — this also shows the API is ready for a future React Native app.

## 10. Quality, testing and CI

Extend the template's pipeline (typecheck, lint, unit, integration with isolated `_test` DB, Playwright E2E, build) with:
- Unit: importer normalisation, slug/locale routing, redirect resolution, price/quantity matrix validation, role guard.
- Integration: every admin mutation rejects `demo_viewer` (403) and anonymous users; RFQ submission with file upload limits/MIME sniffing; revalidation hooks.
- E2E: browse → filter → product → add to quote → RFQ submit (az & ru); language switch keeps page; demo login sees read-only admin; offline basket persists; axe accessibility on key pages.
- Lighthouse CI (mobile) with the budgets in §5 on PRs; bundle-size check.
- Security: CSP with nonces (template notes it as product-specific — implement and test it with Polar, PostHog, Sentry, Cloudflare), HSTS at the proxy, upload scanning limits, rate limits on RFQ/auth, `security.txt`.
- Update `VERIFICATION.md` with real results and a **NOT VERIFIED** list.

## 11. Ethics / legal guard-rails (non-negotiable)

- Persistent top banner on every public page (all three languages): "Konsept demo — Caspian Textile-ın rəsmi saytı deyil. Müraciət məqsədilə hazırlanıb." with a link to `/case-study`.
- `noindex` everywhere (see §8), no Google Search Console submission, no ads, no real payments (Polar **sandbox** only), no emails to the company or its customers from the system.
- Product images, logo and texts are used only for this demonstration; footer note: "Bütün brend materialları Caspian Textile MMC-yə məxsusdur; tələb olunarsa demo dərhal silinəcək."
- Do not scrape again or load anything from caspiantextile.com at runtime.

## 12. Final deliverables

1. Deployed site at `https://caspian.muradgojayev.com` (after the owner approves DNS/VPS steps), admin at `/admin`, demo credentials created by the operator script.
2. Public GitHub repo with README (Azerbaijani + English summary, architecture diagram, how to run), `DECISIONS.md`, updated `VERIFICATION.md`, `research/AUDIT.md`, `research/import-report.md`.
3. Re-run `bench.mjs` against the new site (same pages, profiles and location; RUNS=5) → `research/bench/after.json`; run Lighthouse on both where possible (the old site blocks Lighthouse with HTTP 409 — state that as a finding, not a missing number).
4. **`/case-study` page** (az, with en toggle): problem → evidence → fix → result table (old vs new: interstitial, TTFB, FCP, LCP, CLS, transfer size, requests, render-blocking resources, Lighthouse scores, server RTT from Baku, PWA yes/no, hreflang/sitemap/JSON-LD/llms.txt status, accessibility issues), architecture diagram, **vacancy requirement → evidence** table (Next.js/React responsive; backend/API/DB/integrations; testing & deployment & support; speed & usability; HTML/CSS/JS; REST/Git; server/cloud deploy; TypeScript; CMS/admin; technical SEO & performance; Docker/CI/CD/automated tests; React Native → "API + OpenAPI ready, PWA installable"; Python/Django → mention honestly only if actually used), demo login box, and "what I would do on the real site in the first 30 days" (migration plan with redirects, staging, content freeze, rollback).
5. `research/APPLICATION_MESSAGE.md` — **email in Azerbaijani**, subject exactly `Full-stack Developer`, to be sent by the applicant (do not send it yourself). Structure:
   - 2-sentence intro (who, what was built and why — "mövcud saytınızı analiz edib konsept yenidən qurulma hazırladım").
   - Link + demo admin login + GitHub link.
   - "Nə dəyişdi" — 5–7 bullets with **measured** before → after numbers from `baseline.json`/`after.json` (no rounding up, no invented numbers).
   - "Tapdığım əsas problemlər" — pick the 4–5 strongest from AUDIT.md and confirm each still holds on the live site the day you write the message: US shared hosting (Phoenix) without CDN, ~212 ms RTT from Baku; HTTP 409 JS interstitial on every first visit that also blocks Lighthouse and non-JS crawlers; render-blocking CSS from a non-existent dev host (`castexuniforma25.local`) that delays first paint by seconds on Apple devices; multi-MB pages with 100+ requests; 86% of products only in English while the az/ru home pages are titled "Home 4"/"Главная 4"; stale `llms.txt` pointing to a Bluehost staging site; 12 theme demo/lorem-ipsum blog posts in the sitemap; zoom disabled; no H1 on key pages; broken Google Maps embed. Tone: constructive, no blame ("bunlar tez düzəldilə bilən şeylərdir").
   - "Qlobal bazara hazırlıq" — multilingual SEO (hreflang, localized sitemaps, JSON-LD), GEO (`llms.txt`, SSR for AI crawlers), edge CDN with a Baku PoP, Polar integration for **digital** products with worldwide card payments (sandbox) + provider boundary for physical orders.
   - Vacancy mapping in one compact list; what I was responsible for (everything — per the vacancy's portfolio instruction).
   - Polite close, phone/email placeholders for the applicant to fill.
   - ≤ 300 words in the body; a longer version can live on `/case-study`.

Work in small, reviewed commits on feature branches with PRs. Before any action that touches the VPS, DNS, Cloudflare, GitHub visibility or sends email, stop and ask the owner. Report progress per section and keep a running `NOT VERIFIED` list.
