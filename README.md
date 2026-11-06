# Caspian Textile — concept rebuild

> **Konsept demo.** Bu, Caspian Textile MMC-nin rəsmi saytı deyil. Layihə Full-stack Developer vakansiyasına müraciət üçün hazırlanıb. Bütün brend materialları Caspian Textile MMC-yə məxsusdur, tələb olunarsa demo dərhal silinəcək.

caspiantextile.com saytının sıfırdan yenidən qurulmasıdır. Eyni məhsullar, şəkillər və mətnlərdən istifadə olunub. Layihəyə daxildir:

- sürətli, çoxdilli (az/en/ru) və quraşdırıla bilən (PWA) public sayt;
- öz admin paneli (CMS) və B2B sorğu axını;
- texniki SEO/GEO;
- ölçülə bilən "əvvəl → sonra" müqayisəsi (`/case-study`).

**English summary.** A from-scratch rebuild of caspiantextile.com on a Next.js 16 template:

- localized public site (az default, en, ru), ISR + edge caching, PWA;
- custom admin panel with a read-only demo role;
- B2B quote/RFQ flow with logo preview, PDF spec sheets;
- public REST API with OpenAPI;
- technical SEO/GEO (hreflang sitemap, JSON-LD, `llms.txt`, 301 map from the old WordPress URLs).

## Nəticələr (lokal production build, real Chrome, eyni skript)

| | Köhnə sayt | Yeni sayt |
|---|---|---|
| Ana səhifə, mobil Slow 4G: FCP / LCP | 7.0 s / 31.1 s | 0.76 s / 0.76 s |
| Məhsul səhifəsi CLS (desktop) | 1.03 | 0 |
| Ana səhifənin transfer həcmi (mobil) | 6.3 MB, 123 sorğu | 436 KB, 24 sorğu |
| Render-blocking resurs | 17–18 | 1 |
| Lighthouse (mobil, lokal) | ölçülə bilmir (HTTP 409) | Accessibility 100, Best Practices 100, Performance 79–90 |

Xam data: `data/benchmarks/*.json`. Skript: `scripts/bench.mjs`. Production ölçmələri deploy-dan sonra `after-production.json` faylına yazılacaq və case study səhifəsi onları avtomatik istifadə edəcək.

## Struktur

```text
app/[lang]/        Public sayt (root layout: html lang, header, footer, demo banner)
app/(admin)/admin  Admin panel (öz root layout-u; hər səhifə requireRole çağırır)
app/(platform)/    Template-dən qalan auth/settings səhifələri
app/api/           RFQ, axtarış, PDF, REST v1, Polar, auth, webhooks
proxy.ts           Dil rewrite-ı, köhnə URL redirect-ləri (301/410), noindex başlığı
src/lib/catalog    Sorğular (unstable_cache + "catalog" tag), taksonomiya, HTML təmizləmə
src/lib/media      sharp pipeline (AVIF/WebP, blur, EXIF təmizləmə), OG kartları
src/lib/admin      Rol konteksti, mutate() (403 + audit + cache + CDN purge), server actions
scripts/           import-legacy, admin-user, bench, catalog-dump, brand-assets
data/              translations.draft.json (AI qaralamalar), benchmarks
```

## Lokal işə salma

```sh
corepack enable && pnpm install --frozen-lockfile
pnpm setup -- --name "Caspian Textile" --slug caspian-textile --domain caspian.muradgojayev.com --repository gojayevmurad/caspian-textile-concept --color '#2b2d4f'
docker compose --env-file .env.local up -d --wait db
pnpm db:migrate
LEGACY_DATA_DIR=caspian-research/data pnpm import:legacy     # məhsullar, şəkillər, redirect-lər
pnpm admin:user --email you@example.com --name "You"         # admin (parol bir dəfə göstərilir)
pnpm admin:create-demo --email demo@example.com              # read-only demo hesab
pnpm dev
```

`caspian-research/data` köhnə saytdan Apify ilə toplanmış datadır (~200 MB, şirkətə məxsus şəkillər). Repo-ya commit edilmir.

## Yoxlamalar

```sh
pnpm typecheck && pnpm lint && pnpm test
pnpm local:test-db && pnpm test:integration && pnpm test:e2e
node scripts/bench.mjs out.json <url> [url...]
```

E2E testləri demo hesabın UI bloklarını keçib server action göndərdiyi halı da yoxlayır: server dəyişikliyi rədd edir və DB dəyişmir.

## Deploy

Template-in pipeline-ı istifadə olunur: GHCR immutable digest, `deploy/deploy.sh`, mərkəzi Caddy (`deploy/Caddyfile.example`). Cloudflare proxy və Full (strict) TLS ilə işləyir. Media `MEDIA_PATH` bind mount-unda saxlanılır (uid 1001). Kataloq `scripts/catalog-dump.sh` ilə ötürülür. Ətraflı məlumat: [START_NEW_SAAS.md](START_NEW_SAAS.md), [DEPLOYMENT.md](DEPLOYMENT.md). Qərarlar: [DECISIONS.md](DECISIONS.md).
