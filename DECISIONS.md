# Decisions

Deliberate deviations from the template and notable trade-offs. Each entry: decision → why → consequence.

## 1. Minimal roles instead of "no RBAC"
`user.role ∈ {admin, demo_viewer, customer}` (check constraint + index), exposed to Better Auth as a non-input additional field. `requireRole()` guards every admin page; `requireWriter()` guards every mutation (Server Actions via `mutate()`, route handlers). Layouts and disabled forms are UX only. **Tested:** unit (guard) and E2E (demo removes `disabled` and submits the real action → redirect `?denied=1`, DB unchanged).

## 2. Read-only demo login (template SECURITY.md says "no production demo login")
It is a product requirement here (recruiters must explore the admin). Safe form: created only by the operator script (`pnpm admin:create-demo`), never a seed/migration; all writes rejected server-side; PII masked (emails, phones, company names, messages); users page hidden; credentials shown only on `/case-study` via `DEMO_LOGIN`. Public sign-up is disabled (`disableSignUp: true`).

## 3. Polar only for digital products
Polar's acceptable-use policy excludes physical goods and purely human services, so uniforms are **not** sold via Polar. The template's Polar integration is reused for a clearly labelled demo line of digital patterns/tech-packs (guest checkout, files delivered by Polar's file-download benefit). Physical orders go through RFQ → quote → invoice. A local acquirer or Stripe can be added behind the same provider boundary.

## 4. ISR + CDN instead of nonce-based CSP
A nonce CSP makes every page dynamic (`Cache-Control: private`) and defeats ISR and Cloudflare edge caching — the main fix for the "server in the US, no CDN" problem. We ship a source-restricting CSP (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, restricted `connect-src`/`form-action`) with `'unsafe-inline'` for scripts/styles. Risk is limited: no user-supplied HTML is rendered except product descriptions, which are sanitized on import and on every admin save (allow-list `p ul ol li h3 strong em br`, no attributes).

## 5. Default locale `az` at the root; localized segments via `proxy.ts`
`/kataloq`, `/en/catalog`, `/ru/katalog` are rewritten to `app/[lang]/catalog`. `/az/...` redirects (308) to the root form. Unknown first segments are checked against the redirect table (legacy WordPress URLs) before a localized 404. Trailing slashes are handled in the proxy (`skipTrailingSlashRedirect`) so legacy URLs resolve in **one** 301 hop.

## 6. Pre-generated media instead of `next/image` optimization
Images are processed once (import/upload) into content-hashed AVIF + WebP at 360/720/1080/1600 px with blur placeholder and stored dimensions; served by `/media/*` with `immutable` caching. No runtime image optimizer, no CPU spikes on the VPS, perfect CDN cacheability. `<picture>` is used deliberately (lint warns about `<img>`).

## 7. Client-side catalogue filtering
The catalogue (134 products) is small: the page is statically rendered with all products (crawlable, no layout shift) and filters run in the browser, updating the URL with `history.replaceState` (shareable, instant, no server round-trip). Industry landing pages are separate static routes for SEO. `useSearchParams` is avoided on public pages because it forces client-side rendering of the boundary (measured CLS 0.39 → 0 after the change).

## 8. AI draft translations, never silent
116 of 135 products existed only in English. Drafts (name + summary) for az/ru are stored with `status = 'ai_draft'`, badged on the site ("AI tərcüməsi — yoxlanılır") and queued in **Admin → Translations** for approval. Long descriptions stay in English (marked with `lang="en"`) until reviewed. Optional admin button drafts full translations with the Claude API (`ANTHROPIC_API_KEY`).

## 9. Taxonomy split
The old site mixed industries, product types and properties in one category tree across languages. Imported into three kinds: `industry` (navigation + landing pages), `type`, `feature` (filters). Legacy slugs of all languages are kept on the category for redirects.

## 10. Demo is `noindex`
`SITE_INDEXABLE=false` adds `X-Robots-Tag: noindex, nofollow`, robots meta and `Disallow: /`. Everything SEO-related (hreflang, sitemaps, JSON-LD, `llms.txt`) is production-ready behind the flag. Lighthouse SEO therefore reports `is-crawlable` as failing (expected).

## 11. Deterministic formatting on shared components
Prices are formatted without `Intl` in components that render on both server and client (Node and browser ICU differ → React hydration error #418 was observed in Lighthouse).

## 12. Cache keys include the database identity
`unstable_cache` keys contain a hash of `DATABASE_URL`, so dev/test/prod data in `.next/cache` can never be mixed (found by E2E against the isolated test database).
