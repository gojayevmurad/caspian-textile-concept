# Verification report — Caspian Textile concept

Verified locally on 6 November 2026 (Baku, macOS, Docker PostgreSQL 18.6). Template-level results from 16 October 2026 are in git history.

| Check | Result |
|---|---|
| Strict TypeScript (`next typegen && tsc`) | PASS |
| ESLint | PASS (0 errors; 14 warnings: intentional `<img>`/`<picture>` usage) |
| Unit tests (Vitest) | 114 passed — routing/i18n, HTML cleanup, colour/size normalization, upload sniffing, RFQ validation, demo masking, role guards (`requireWriter` 403 for `demo_viewer`/`customer`, 401 anonymous) |
| Integration tests | 12 passed, 2 skipped (template webhook/billing/analytics suites against isolated `_test` DB) |
| Playwright E2E | 11 passed — az default + language switch keeps page, legacy 301 in one hop + 410, catalogue → product → basket → RFQ, typo-tolerant search, no overflow at 360 px (4 pages), admin auth, **demo bypass attempt rejected server-side with DB unchanged**, admin edit + audit log |
| Production build | PASS (`next build`, standalone) |
| Legacy import | 135 products, 165 source translations, 235 AI drafts, 292 media (1752 variants, 28 MB), 203 redirects (301) + 36 Gone (410) |
| Cold-visit benchmark (local prod build) | see `data/benchmarks/after-local.json` vs `baseline.json` |
| Lighthouse 12.8.2 mobile (local) | Accessibility 100, Best Practices 100, Performance 79–90 (simulated throttling, varies with machine load), SEO 69 only because the demo is `noindex` |
| Security headers | CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP; HSTS at Caddy |

## How the "after" numbers were obtained
`node scripts/bench.mjs` against `next start` on localhost (same profiles as the baseline: mobile Slow 4G + 4× CPU, desktop unthrottled; RUNS=3 median). Local runs have **no network latency**, so TTFB is not comparable to the baseline; FCP/LCP/CLS/requests/bytes are. The production run (Hetzner + Cloudflare, measured from Baku) must replace these before the numbers are used publicly: save it as `data/benchmarks/after-production.json`.

## NOT VERIFIED
- Production deployment: Hetzner VPS, central Caddy route, Cloudflare proxy/cache rules, Baku PoP (`cf-ray`), TLS, public `/api/health`.
- GitHub Actions runs (Quality, Production), GHCR publishing, ARM64 image build with these changes.
- Resend delivery of RFQ notifications (`NOTIFY_EMAIL`), PostHog Web Vitals, Sentry.
- Polar sandbox checkout for digital patterns (no sandbox keys configured).
- Claude API translation button (no `ANTHROPIC_API_KEY` configured).
- Company review of AI translations; certification/standard data (absent in source).
- What Googlebot receives from the old site (the 409 interstitial may whitelist it).
- Screen-reader walkthrough (automated Lighthouse/axe-core checks only).
