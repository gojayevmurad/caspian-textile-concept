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
| Production benchmark (Baku → Cloudflare GYD → Hetzner) | `data/benchmarks/after-production.json`: home mobile FCP/LCP 1.13 s (old 7.0/31.1 s), desktop TTFB 43 ms (old 1.79 s), CLS 0–0.012 (old up to 1.03), 556 KB / 28 requests (old 6.3 MB / 123) |
| Edge caching | `cf-cache-status: HIT` for HTML (ISR) and `/media`, TTFB 30–38 ms from Baku; `/admin` DYNAMIC; `cf-ray` suffix `GYD` (Baku) |
| Lighthouse 12.8.2 mobile (local) | Accessibility 100, Best Practices 100, Performance 79–90 (simulated throttling, varies with machine load), SEO 69 only because the demo is `noindex` |
| Security headers | CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP; HSTS at Caddy |

## How the "after" numbers were obtained
`node scripts/bench.mjs` against `next start` on localhost (same profiles as the baseline: mobile Slow 4G + 4× CPU, desktop unthrottled; RUNS=3 median). Local runs have **no network latency**, so TTFB is not comparable to the baseline; FCP/LCP/CLS/requests/bytes are. The production run (Hetzner + Cloudflare, measured from Baku) must replace these before the numbers are used publicly: save it as `data/benchmarks/after-production.json`.

## NOT VERIFIED
- GitHub Actions runs (Quality, Production) and GHCR publishing: this deployment builds the ARM64 image on the server (`deploy/deploy-local.sh`), like the other projects on the host.
- Production transfer is ~120 KB larger than local because Cloudflare injects its own scripts (zone-level features); not optimized here.
- Resend delivery of RFQ notifications (`NOTIFY_EMAIL`), PostHog Web Vitals, Sentry.
- Polar sandbox checkout for digital patterns (no sandbox keys configured).
- Claude API translation button (no `ANTHROPIC_API_KEY` configured).
- Company review of AI translations; certification/standard data (absent in source).
- What Googlebot receives from the old site (the 409 interstitial may whitelist it).
- Screen-reader walkthrough (automated Lighthouse/axe-core checks only).
