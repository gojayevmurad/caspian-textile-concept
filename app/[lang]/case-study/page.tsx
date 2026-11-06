import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import {
  isLocale,
  localePath,
  locales,
  type Locale,
} from "@/src/lib/i18n/config";
import { buildMetadata } from "@/src/lib/seo/metadata";
import { getBenchmarks, type Row } from "@/src/lib/case-study/data";

export const revalidate = 3600;

type Lang = "az" | "en";
const L = (locale: Locale): Lang => (locale === "az" ? "az" : "en");

const copy = {
  az: {
    title: "Case study: caspiantextile.com necə yenidən quruldu",
    lead: "Mövcud saytın texniki auditi, eyni məhsul və şəkillərlə sıfırdan yenidən qurulma və ölçülə bilən nəticələr. Bütün rəqəmlər eyni skriptlə, eyni yerdən (Bakı) ölçülüb.",
    demoTitle: "Admin paneli — demo giriş (yalnız baxış)",
    demoNote:
      "Demo hesab hər şeyi görür, amma heç nəyi dəyişə bilmir: bütün yazma əməliyyatları serverdə HTTP 403 ilə bloklanır, şəxsi məlumatlar maskalanır.",
    demoMissing: "Giriş məlumatları müraciət məktubunda verilib.",
    openAdmin: "Admin panelə keç",
    metrics: "Ölçmələr: əvvəl → sonra",
    method:
      "Metod: real Chrome, hər run üçün təmiz profil, keş söndürülüb, 3 run-ın medianı. Mobil: Slow 4G (150 ms, 1.6 Mbps) + CPU 4× yavaş. Vaxt ziyarətçinin URL-i açdığı andan hesablanır (köhnə saytın 409 interstitial-ı daxil).",
    afterLocal:
      "“Sonra” sütunu hazırda lokal production build-dən ölçülüb (şəbəkə gecikməsi yoxdur). Deploy-dan sonra Bakıdan Hetzner + Cloudflare üzərindən yenidən ölçüləcək.",
    afterProd:
      "“Sonra” sütunu production-da (Hetzner EU + Cloudflare, Bakı PoP) ölçülüb.",
    findings: "Tapılan problemlər və həllər",
    arch: "Arxitektura",
    vacancy: "Vakansiya tələbi → harada göstərilib",
    plan: "Real saytda ilk 30 gün",
    notVerified: "Yoxlanmayanlar (NOT VERIFIED)",
    page: { home: "Ana səhifə", catalog: "Kataloq", product: "Məhsul" },
  },
  en: {
    title: "Case study: rebuilding caspiantextile.com",
    lead: "A technical audit of the current site, a from-scratch rebuild with the same products and images, and measurable results. Every number was measured with the same script from the same place (Baku).",
    demoTitle: "Admin panel — demo login (read-only)",
    demoNote:
      "The demo account sees everything but cannot change anything: every write is rejected server-side with HTTP 403 and personal data is masked.",
    demoMissing: "Credentials are in the application email.",
    openAdmin: "Open the admin panel",
    metrics: "Measurements: before → after",
    method:
      "Method: real Chrome, fresh profile per run, cache disabled, median of 3 runs. Mobile: Slow 4G (150 ms, 1.6 Mbps) + 4× CPU slowdown. Timing starts when the visitor opens the URL (includes the old site's 409 interstitial).",
    afterLocal:
      "The “after” column currently comes from a local production build (no network latency). It will be re-measured from Baku over Hetzner + Cloudflare after deployment.",
    afterProd:
      "The “after” column was measured in production (Hetzner EU + Cloudflare, Baku PoP).",
    findings: "Problems found and how they were fixed",
    arch: "Architecture",
    vacancy: "Vacancy requirement → where it is demonstrated",
    plan: "First 30 days on the real site",
    notVerified: "Not verified",
    page: { home: "Home", catalog: "Catalogue", product: "Product" },
  },
};

const findings: Record<Lang, [string, string][]> = {
  az: [
    [
      "Server Phoenix-də (ABŞ), shared hosting, CDN yoxdur — Bakıdan RTT ≈ 212 ms",
      "Hetzner (Avropa) + Cloudflare proxy (Bakıda PoP); ISR səhifələri və media edge-də keşlənir",
    ],
    [
      "Hər ilk ziyarətdə HTTP 409 JS interstitial; Lighthouse və JS-siz crawler-lər məzmunu görmür",
      "Interstitial yoxdur; bütün səhifələr server-side render, botlara 200 + tam HTML; qoruma Cloudflare qaydaları ilə",
    ],
    [
      "Mövcud olmayan castexuniforma25.local domenindən render-blocking CSS (Apple cihazlarında FCP +3–4 s)",
      "Şriftlər next/font ilə self-host; render-blocking resurs: 1 (öz CSS)",
    ],
    [
      "6–11 MB, 110–140 sorğu, 76 JS faylı, jQuery + 3 slider kitabxanası",
      "Server Components; JS yalnız interaktiv hissələrdə; şəkillər AVIF/WebP, ölçüyə görə",
    ],
    [
      "Məhsul şəkilləri 300–700 KB PNG (230 px-də göstərilir)",
      "Hər şəkil üçün 360–1600 px AVIF/WebP + blur; 720 px ≈ 8–12 KB",
    ],
    [
      "Məhsul səhifəsində CLS 0.67–1.03",
      "Bütün şəkillərin ölçüsü öncədən saxlanılır, yer ayrılır",
    ],
    [
      "Məhsulların 86%-i yalnız ingiliscə; AZ ana səhifə title: “Home 4”",
      "az default dil; 235 AI tərcümə qaralaması admin təsdiqi ilə; lokallaşdırılmış URL-lər və hreflang",
    ],
    [
      "Köhnə llms.txt staging saytına (“Hello world!”) işarə edir; 12 demo blog yazısı sitemap-də",
      "llms.txt / llms-full.txt DB-dən canlı; demo yazılar 410 Gone; təmiz sitemap (450 URL, hreflang, şəkillər)",
    ],
    [
      "Zoom bağlıdır, H1 yoxdur, alt mətnlər yoxdur, Google Maps embed xətalı",
      "Zoom açıq, hər səhifədə bir H1, alt mətnlər DB-dən, xəritə — açarsız statik keçid",
    ],
    [
      "İstehlakçı səbəti; B2B axını yoxdur",
      "Sorğu səbəti (ölçü × rəng × say), loqo önizləməsi, nümunə sifarişi, PDF spesifikasiya, admin RFQ pipeline",
    ],
  ],
  en: [
    [
      "Server in Phoenix (USA), shared hosting, no CDN — ~212 ms RTT from Baku",
      "Hetzner (EU) + Cloudflare proxy (Baku PoP); ISR pages and media cached at the edge",
    ],
    [
      "HTTP 409 JS interstitial on every first visit; Lighthouse and non-JS crawlers get no content",
      "No interstitial; everything server-rendered, crawlers get 200 + full HTML; protection via Cloudflare rules",
    ],
    [
      "Render-blocking CSS from a non-existent host castexuniforma25.local (+3–4 s FCP on Apple devices)",
      "Fonts self-hosted via next/font; 1 render-blocking resource (own CSS)",
    ],
    [
      "6–11 MB, 110–140 requests, 76 JS files, jQuery + 3 slider libraries",
      "Server Components; JS only for interactive parts; AVIF/WebP images sized per viewport",
    ],
    [
      "Product images are 300–700 KB PNGs shown at 230 px",
      "360–1600 px AVIF/WebP variants + blur per image; 720 px ≈ 8–12 KB",
    ],
    [
      "CLS 0.67–1.03 on product pages",
      "All image dimensions stored and reserved",
    ],
    [
      "86% of products English-only; AZ home title is “Home 4”",
      "az is the default locale; 235 AI draft translations behind admin review; localized URLs + hreflang",
    ],
    [
      "Stale llms.txt points to a staging site (“Hello world!”); 12 demo blog posts in the sitemap",
      "llms.txt / llms-full.txt generated live from the DB; demo posts return 410; clean sitemap (450 URLs, hreflang, images)",
    ],
    [
      "Zoom disabled, no H1, missing alt text, broken Google Maps embed",
      "Zoom allowed, one H1 per page, alt text from DB, key-less static map link",
    ],
    [
      "Consumer cart; no B2B flow",
      "Quote basket (size × colour × qty), logo preview, sample request, PDF spec sheets, admin RFQ pipeline",
    ],
  ],
};

const vacancy: Record<Lang, [string, string][]> = {
  az: [
    [
      "Next.js və React ilə responsiv sayt",
      "Next.js 16 App Router, React 19, mobil-first; 3 dil, PWA",
    ],
    [
      "Backend, API, verilənlər bazası, xarici inteqrasiyalar",
      "PostgreSQL + Drizzle (miqrasiyalar), REST API v1 + OpenAPI, Polar, Resend, Cloudflare API, Claude API",
    ],
    [
      "Test, serverdə yerləşdirmə, dəstək",
      "Vitest (unit/integration), Playwright, Docker ARM64, GHCR, rollback skripti, health check",
    ],
    [
      "Mövcud saytların sürəti və istifadə rahatlığı",
      "Bu səhifədəki ölçmələr; kataloq filtrləri dərhal, sorğu səbəti oflayn işləyir",
    ],
    [
      "HTML, CSS, JavaScript",
      "Semantik HTML, Tailwind v4, WCAG 2.2 AA prinsipləri, view transitions",
    ],
    ["REST API, Git", "/api/v1, Git tarixçəsi kiçik commit-lərlə"],
    [
      "Server/bulud deploy",
      "Hetzner VPS + Caddy + Cloudflare; GitHub Actions ilə image digest deploy",
    ],
    ["TypeScript", "Strict TypeScript, Zod validasiya"],
    [
      "CMS və admin panel",
      "Öz admin paneli: məhsullar (az/en/ru), media, kateqoriyalar, RFQ, redirect-lər, audit log; demo rol",
    ],
    [
      "Texniki SEO və performans",
      "hreflang, lokallaşdırılmış sitemap, JSON-LD (Organization, Product, Breadcrumb), OG şəkilləri, 301 xəritəsi, llms.txt",
    ],
    [
      "Docker, CI/CD, avtomatlaşdırılmış testlər",
      "Multi-stage Docker, PR Quality workflow, immutable digest deploy",
    ],
    [
      "React Native",
      "Mobil tətbiq üçün hazır REST API + OpenAPI; sayt PWA kimi quraşdırılır",
    ],
    ["Python/Django", "Bu layihədə istifadə olunmayıb"],
  ],
  en: [
    [
      "Responsive sites with Next.js and React",
      "Next.js 16 App Router, React 19, mobile-first; 3 languages, PWA",
    ],
    [
      "Backend, APIs, databases, external integrations",
      "PostgreSQL + Drizzle (migrations), REST API v1 + OpenAPI, Polar, Resend, Cloudflare API, Claude API",
    ],
    [
      "Testing, deployment, support",
      "Vitest (unit/integration), Playwright, ARM64 Docker, GHCR, rollback script, health check",
    ],
    [
      "Speed and usability of existing sites",
      "The measurements on this page; instant catalogue filters, offline quote basket",
    ],
    [
      "HTML, CSS, JavaScript",
      "Semantic HTML, Tailwind v4, WCAG 2.2 AA principles, view transitions",
    ],
    ["REST APIs, Git", "/api/v1, small focused commits"],
    [
      "Server/cloud deployment",
      "Hetzner VPS + Caddy + Cloudflare; image-digest deploys via GitHub Actions",
    ],
    ["TypeScript", "Strict TypeScript, Zod validation"],
    [
      "CMS and admin panels",
      "Custom admin: products (az/en/ru), media, categories, RFQs, redirects, audit log; demo role",
    ],
    [
      "Technical SEO and performance",
      "hreflang, localized sitemap, JSON-LD (Organization, Product, Breadcrumb), OG images, 301 map, llms.txt",
    ],
    [
      "Docker, CI/CD, automated tests",
      "Multi-stage Docker, PR quality workflow, immutable digest deploys",
    ],
    [
      "React Native",
      "REST API + OpenAPI ready for a mobile app; the site installs as a PWA",
    ],
    ["Python/Django", "Not used in this project"],
  ],
};

const plan: Record<Lang, string[]> = {
  az: [
    "1-ci həftə: dərhal düzəlişlər mövcud saytda — .local CSS-i silmək, 409 interstitial-ı söndürmək, llms.txt-i düzəltmək, demo yazıları silmək, zoom-u açmaq.",
    "2-ci həftə: Cloudflare-i əsas domenə qoşmaq, staging mühiti, məzmun dondurulması, tərcümələrin şirkətlə yoxlanması.",
    "3-cü həftə: yeni sayta miqrasiya (301 xəritəsi hazırdır), Search Console, sitemap təqdimatı, rollback planı.",
    "4-cü həftə: real istifadəçi Web Vitals monitorinqi, RFQ axınının satış komandası ilə sınağı, admin təlimi.",
  ],
  en: [
    "Week 1: quick wins on the current site — remove the .local CSS, disable the 409 interstitial, fix llms.txt, delete demo posts, re-enable zoom.",
    "Week 2: put Cloudflare in front of the main domain, staging environment, content freeze, review translations with the company.",
    "Week 3: migrate to the new site (301 map is ready), Search Console, sitemap submission, rollback plan.",
    "Week 4: real-user Web Vitals monitoring, RFQ flow trial with the sales team, admin training.",
  ],
};

const notVerified: Record<Lang, string[]> = {
  az: [
    "Googlebot-un köhnə saytda nə gördüyü (409 yoxlaması Googlebot üçün istisna edilə bilər)",
    "Polar sandbox: checkout sessiyası və yönləndirmə işləyir; test kartı ilə tam ödəniş və faylın çatdırılması avtomatik yoxlanılmayıb",
    "AI tərcümələrinin şirkət tərəfindən təsdiqi",
    "Sertifikat/standart məlumatları (mənbədə yoxdur — boş saxlanılıb)",
  ],
  en: [
    "What Googlebot sees on the old site (the 409 check may exempt Googlebot)",
    "Polar sandbox: checkout session and redirect work; a full test-card payment and file delivery were not verified automatically",
    "Company review of the AI translations",
    "Certification/standard data (absent from the source — left empty)",
  ],
};

const fmt = (key: string, v: number | null | undefined) => {
  if (v == null) return "—";
  if (key === "cls") return v.toFixed(3);
  if (key.endsWith("KB"))
    return v >= 1024 ? `${(v / 1024).toFixed(1)} MB` : `${v} KB`;
  if (key.endsWith("Ms"))
    return v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${v} ms`;
  return String(v);
};
const metrics: [string, string][] = [
  ["ttfbMs", "TTFB"],
  ["fcpMs", "FCP"],
  ["lcpMs", "LCP"],
  ["cls", "CLS"],
  ["pageTransferKB", "Transfer"],
  ["pageRequests", "Requests"],
  ["renderBlocking", "Render-blocking"],
];

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/case-study">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const c = copy[L(lang)];
  return buildMetadata({
    locale: lang,
    title: c.title,
    description: c.lead,
    paths: Object.fromEntries(
      locales.map((l) => [l, localePath(l, "case-study")]),
    ) as Record<Locale, string>,
  });
}

function Table({ rows, c }: { rows: Row[]; c: (typeof copy)["az"] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-surface text-left text-xs text-muted uppercase">
          <tr>
            <th className="px-3 py-2">Page</th>
            {metrics.map(([, label]) => (
              <th key={label} className="px-3 py-2">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.page + r.profile} className="border-t border-line">
              <td className="px-3 py-2 font-medium">
                {c.page[r.page]}{" "}
                <span className="block text-xs text-muted">
                  {r.profile === "mobile-slow4g"
                    ? "mobile · Slow 4G"
                    : "desktop"}
                </span>
              </td>
              {metrics.map(([key]) => (
                <td key={key} className="px-3 py-2 tabular-nums">
                  <span className="text-muted line-through decoration-red-400">
                    {fmt(key, r.before[key])}
                  </span>
                  <span className="block font-semibold text-green-800">
                    {fmt(key, r.after?.[key])}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function CaseStudy({
  params,
}: PageProps<"/[lang]/case-study">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const l = L(lang);
  const c = copy[l];
  const bench = await getBenchmarks();
  const demo = process.env.DEMO_LOGIN?.split(":");
  return (
    <div className="container-x max-w-5xl py-12">
      <p className="text-sm font-semibold text-hivis-700">
        Case study · Murad Gojayev
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {c.title}
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-muted">{c.lead}</p>

      <section
        className="mt-8 rounded-3xl bg-brand p-6 text-white"
        aria-labelledby="demo"
      >
        <h2 id="demo" className="font-semibold">
          {c.demoTitle}
        </h2>
        {demo?.length === 2 ? (
          <dl className="mt-3 grid gap-2 font-mono text-sm sm:grid-cols-2">
            <div>
              <dt className="text-white/60">email</dt>
              <dd>{demo[0]}</dd>
            </div>
            <div>
              <dt className="text-white/60">password</dt>
              <dd>{demo[1]}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-white/80">{c.demoMissing}</p>
        )}
        <p className="mt-3 text-sm text-white/75">{c.demoNote}</p>
        <Link
          href="/sign-in"
          className="btn mt-4 bg-white text-brand hover:bg-brand-50"
        >
          {c.openAdmin} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      <section className="mt-14" aria-labelledby="metrics">
        <h2 id="metrics" className="text-2xl font-bold">
          {c.metrics}
        </h2>
        <p className="mt-2 text-sm text-muted">{c.method}</p>
        <p className="mt-1 text-sm text-muted">
          {bench.afterSource === "production" ? c.afterProd : c.afterLocal}
        </p>
        <div className="mt-6">
          <Table rows={bench.rows} c={c} />
        </div>
        <p className="mt-2 text-xs text-muted">
          baseline: {bench.baselineAt?.slice(0, 10)} · after:{" "}
          {bench.afterAt?.slice(0, 10)} · <code>scripts/bench.mjs</code>
        </p>
      </section>

      <section className="mt-14" aria-labelledby="findings">
        <h2 id="findings" className="text-2xl font-bold">
          {c.findings}
        </h2>
        <ul className="mt-6 space-y-3">
          {findings[l].map(([problem, fix]) => (
            <li
              key={problem}
              className="grid gap-2 rounded-2xl border border-line p-4 md:grid-cols-2"
            >
              <p className="text-sm">
                <span className="mr-2 font-bold text-red-700">✕</span>
                {problem}
              </p>
              <p className="text-sm">
                <Check
                  className="mr-2 inline size-4 text-green-700"
                  aria-hidden
                />
                {fix}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="arch">
        <h2 id="arch" className="text-2xl font-bold">
          {c.arch}
        </h2>
        <ol className="mt-6 grid gap-3 text-sm md:grid-cols-5">
          {[
            ["Browser · Baku", "PWA, service worker, offline basket"],
            ["Cloudflare edge", "Baku PoP · HTML (ISR) + /media cache · WAF"],
            ["Caddy · Hetzner EU", "TLS, HSTS, reverse proxy"],
            ["Next.js 16 (Docker, ARM64)", "SSR/ISR, admin, REST API, PDF, OG"],
            [
              "PostgreSQL 18 + media volume",
              "Drizzle migrations · AVIF/WebP variants",
            ],
          ].map(([t, d], i) => (
            <li
              key={t}
              className="relative rounded-2xl border border-line bg-surface p-4"
            >
              <p className="text-xs font-bold text-hivis-700">{i + 1}</p>
              <p className="font-semibold">{t}</p>
              <p className="mt-1 text-xs text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14" aria-labelledby="vacancy">
        <h2 id="vacancy" className="text-2xl font-bold">
          {c.vacancy}
        </h2>
        <dl className="mt-6 divide-y divide-line rounded-2xl border border-line">
          {vacancy[l].map(([req, ev]) => (
            <div
              key={req}
              className="grid gap-1 p-4 text-sm md:grid-cols-[1fr_1.4fr]"
            >
              <dt className="font-medium">{req}</dt>
              <dd className="text-muted">{ev}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold">{c.plan}</h2>
          <ol className="mt-4 space-y-2 text-sm text-muted">
            {plan[l].map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-xl font-bold">{c.notVerified}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
            {notVerified[l].map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
