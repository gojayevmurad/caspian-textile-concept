# caspiantextile.com — texniki audit (6 noyabr 2026)

Ölçmələr Bakıdan, real Chrome brauzeri ilə aparılıb. Hər bəndin yanında sübutun mənbəyi göstərilib. Xam data `data/` və `bench/` qovluqlarındadır.

## 1. Vakansiya nə istəyir (jobsearch.az, elan #155646, son tarix 5 dekabr 2026)

**Əsas vəzifələr:** Next.js/React ilə responsiv sayt və tətbiqlər; backend, API, verilənlər bazası və xarici inteqrasiyalar; test, serverə yerləşdirmə və sonrakı dəstək; **mövcud saytların sürətini və istifadə rahatlığını yaxşılaşdırmaq**.
**Tələblər:** frontend və backend-i müstəqil qurmaq; HTML/CSS/JS; Next.js/React; REST API, verilənlər bazası, Git; server və ya bulud deploy.
**Üstünlük:** TypeScript; Python/Django; React Native; CMS inteqrasiyası və admin panel; texniki SEO və performans; Docker, CI/CD, avtomatlaşdırılmış testlər.
**Müraciət:** CV və portfolio `hr@caspiantextile.com` ünvanına, mövzu "Full-stack Developer". Portfolioda layihə linkləri və hər layihədə nəyə cavabdeh olduğun qeyd edilməlidir.

## 2. Texnologiya yığını

- WordPress 7.1.4, WooCommerce 11.2.2, Elementor + Elementor Pro, Slider Revolution, WPML (en/az/ru), "xts-tethys" teması, Contact Form 7, jQuery 3.7.1 + jQuery Migrate. *(Mənbə: səhifənin `generator` meta teqləri və yüklənən skriptlər.)*
- **İki SEO plugini eyni vaxtda işləyir:** sitemap-i Rank Math yaradır, `llms.txt` faylını isə All in One SEO.
- Ana səhifədə 76 JS və 23 CSS faylı var. 77 resurs render-blocking-dir.

## 3. Hosting, server yeri və şəbəkə

| Domen | IP | Yer | CDN |
|---|---|---|---|
| caspiantextile.com (əsas sayt) | 50.87.18.11 | **Phoenix, Arizona (ABŞ)**, Bluehost / Unified Layer, shared hosting | **Yoxdur** |
| caspiantextile.az | 66.235.200.147 | Cloudflare (Newfold) | Var |
| castex.az, deploy., website-00e352ef., website-d1f0aac6., cpanel., webmail., mail. | 50.87.18.11 | Phoenix | Yoxdur |

- Bakıdan Phoenix serverinə **RTT ≈ 212 ms**. Bir HTTPS sorğusu üçün yalnız TCP+TLS mərhələsi ~440 ms çəkir, ilk bayt isə ~650 ms-də gəlir.
- TLS sertifikatı Bluehost-un paylaşılan SAN sertifikatıdır. Onda başqa şirkətlərin domenləri də var (rewiremodel.com, rewiremodelgroup.com, vorton.uk) və bu, shared hosting olduğunu göstərir. *(Mənbə: Certificate Transparency, certspotter.)*
- Sertifikat loglarında `deploy.`, `website-xxxx.`, `cpanel.`, `webdisk.` subdomenləri görünür. İdarəetmə panelləri açıq internetdə görünür *(yalnız DNS yoxlanılıb, panellərə giriş yoxlanılmayıb)*.
- Statik fayllarda `Cache-Control: max-age=86400` (1 gün) var, HTML-də `max-age=7200`. Uzunmüddətli və ya immutable keş yoxdur.
- Təhlükəsizlik başlıqları yoxdur: **HSTS, CSP, X-Content-Type-Options, X-Frame-Options**. Bundan əlavə `host-header` başlığı daxili hostinq adını base64 ilə ötürür (`shared.bluehost.com`).

## 4. Kritik tapıntı: JS "humans" interstitial (HTTP 409)

Hər ilk sorğuya server **HTTP 409** və içində yalnız aşağıdakı kod olan 83 baytlıq cavab qaytarır: `document.cookie = "humans_21909=1"; document.location.reload(true)`. Bunun nəticələri:
- Hər yeni ziyarətçi əvvəlcə boş səhifə görür, sonra səhifə yenidən yüklənir. Bu, əlavə bir tam round-trip deməkdir.
- JavaScript icra etməyən hər klient (Lighthouse, PageSpeed Insights, link preview botları, əksər AI crawler-lər: GPTBot, ClaudeBot, PerplexityBot və s.) **məzmun əvəzinə 409 alır**. Lighthouse auditi "ERRORED_DOCUMENT_REQUEST (Status code: 409)" xətası ilə dayanır.
- Şəkillər və statik fayllar da bu yoxlamanın arxasındadır, yəni birbaşa şəkil linkləri də 409 qaytarır.
- *Googlebot-un nə gördüyü yoxlanmayıb (NOT VERIFIED).* Hostinq Googlebot-u istisna edə bilər, amma bu ehtimal başqa axtarış və AI sistemlərinə aid deyil.

## 5. Performans (cold visit, real Chrome)

Metod (`bench/bench.mjs`): hər ölçmə üçün yeni Chrome profili açılıb, keş söndürülüb və 3 run-ın medianı götürülüb. Ölçmə Bakıdan, macOS üzərində aparılıb. Profillər: **mobil** (Slow 4G: 150 ms, 1.6 Mbps, CPU 4× yavaş) və **desktop** (məhdudiyyətsiz). Bütün zamanlar istifadəçinin URL-i açdığı andan hesablanır, yəni 409 interstitial-ı da əhatə edir. Xam nəticələr `bench/baseline.json` faylındadır.

| Səhifə | Profil | Interstitial | TTFB | FCP | LCP | CLS | Sorğu | Render-blocking |
|---|---|---|---|---|---|---|---|---|
| Ana səhifə | mobil | 0.76 s | 1.86 s | **7.0 s** | **31.1 s** | 0 | 123 | 18 |
| Ana səhifə | desktop | 0.67 s | 1.79 s | 6.9 s | 7.5 s | 0.001 | 133 | 18 |
| Shop | mobil | 0.67 s | 2.07 s | 7.2 s | 7.2 s | 0 | 110 | 18 |
| Shop | desktop | 0.66 s | 1.99 s | 7.0 s | 7.0 s | 0 | 110 | 18 |
| Məhsul (DeepBlue) | mobil | 0.68 s | 2.05 s | 7.2 s | 7.7 s | **0.67** | 109 | 17 |
| Məhsul (DeepBlue) | desktop | 0.66 s | 2.01 s | 7.1 s | 7.3 s | **1.03** | 109 | 17 |

Google-un "yaxşı" hədləri: LCP ≤ 2.5 s, CLS ≤ 0.1, TTFB ≤ 0.8 s. **Ölçülən üç səhifənin heç biri bu hədlərə uyğun gəlmir.** Məhsul səhifəsində CLS hədddən 7–10 dəfə yüksəkdir.

- **Ana səhifənin həcmi:** mobil versiyada 6.3 MB, desktop-da 10.8 MB-dır (desktop daha böyük şəkillər yükləyir). Slow 4G şəbəkəsində əsas şəkil 31 saniyədə görünür.
- **`.local` CSS-in təsiri:** `castexuniforma25.local` domeni dərhal xəta verəndə (Windows və Android-dəki kimi) ana səhifənin FCP-si mobil versiyada **7.0 s-dən 4.2 s-ə**, desktop-da **6.9 s-dən 2.6 s-ə** düşür (`bench/baseline-fastdns.json`). Deməli Apple cihazlarında (macOS/iOS `.local` domenini mDNS ilə axtarır) render-blocking CSS ilk görüntünü təxminən **3–4 saniyə** gecikdirir. Bu, bir sətirlik düzəlişdir.
- Shop və məhsul səhifələri üçün "fast-DNS" ölçməsi etibarsızdır: təkrar run-larda server yalnız 409 səhifəsini qaytardı. Bu, çox güman ki, rate-limit-dir və həmin nəticələr nəzərə alınmayıb.
- Bu ölçmələrdən sonra sayta əlavə sorğu göndərilmədi.

İsti ziyarət (cookie və bağlantı artıq mövcud, desktop, Bakı): TTFB 877 ms, FCP 1.26 s, **136 sorğu, 5.4 MB**, 77 render-blocking resurs, 2143 DOM elementi.
- Ən ağır şəkillər məhsul PNG-ləridir: 230 px genişlikdə göstərilən hər şəkil 800–838 px ölçüdə və 235–671 KB həcmində yüklənir. AVIF/WebP istifadə olunmur. Ana səhifə banneri `web_caspian_home1.png` təkcə 586 KB-dır.
- Google Fonts-dan Outfit şriftinin bütün 9 çəkisi yüklənir.
- **Mövcud olmayan dev domendən CSS yüklənir:** `http://castexuniforma25.local/.../roboto.css` və `robotoslab.css`. Bu, həm HTTPS səhifədə mixed content, həm uğursuz sorğu, həm də daxili dev host adının açıq görünməsi deməkdir.
- Slider Revolution, Elementor, Swiper, Flickity, Magnific Popup və Waypoints kimi kitabxanalar eyni vaxtda yüklənir.

## 6. SEO / GEO

- Ana səhifədə **H1 yoxdur**.
- `sitemap_index.xml` (Rank Math) **12 tema demo blog yazısını** indeksləməyə təqdim edir. Nümunələr: "Summer 2019 Fashion Trends", "Top 10 Red Carpet Styles", "All The Best Fashion Influencers", "Incredible Concept Homes".
- **`/llms.txt` başqa quraşdırmadandır:** All in One SEO tərəfindən yaradılıb və `https://ndu.roo.mybluehost.me/website_3a108e70/...` staging ünvanına, "Hello world!" yazısına yönləndirir. Nəticədə AI axtarış sistemləri sayt haqqında səhv məlumat alır.
- `og:image` faylının adı `Gemini_Generated_Image_...jpg`-dir. Brend adları uyğunsuzdur: `og:site_name=Caspian Uniforms`, səhifə başlığında "Caspian_Uniforms", Organization schema-da "Caspian Textile". `twitter:data1` sahəsində "Written by CaspianTextile25" yazılıb.
- `og:locale=en_US`. Default dil ingiliscədir, halbuki əsas bazar Azərbaycandır.
- hreflang (az/en/ru/x-default) və canonical mövcuddur. Organization JSON-LD var, amma Product və LocalBusiness schema-larının mövcudluğu ayrıca yoxlanmalıdır (bax `data/raw/rendered-pages.json`).
- `/shop/?pdr-flr=...` filter URL-ləri menyuda birbaşa linklənib. Bu, crawl budget-i boşa xərcləyir və təkrar məzmun yaradır.

## 7. Məzmun və data keyfiyyəti

Data Apify (Playwright, real brauzer) vasitəsilə WooCommerce Store API və WP REST API-dən toplanıb.

| Göstərici | Dəyər |
|---|---|
| API-də "məhsul" qeydləri | 165 (WPML hər dil versiyasını ayrı qeyd kimi saxlayır) |
| Unikal məhsul (SKU üzrə) | **135** |
| Yalnız ingiliscə olan məhsul | **116 (86%)** |
| Azərbaycanca versiyası olan | 16 (12%) |
| Rusca versiyası olan | 18 (13%) |
| Hər üç dildə tam olan | 12 (9%) |
| Şəkillər | 624 fayl, cəmi **196 MB** (orta hesabla ~310 KB, əsasən PNG). Bir məhsulun şəkli yoxdur |
| Kateqoriyalar | EN 19, AZ 19, RU 16 (ağac strukturu natamamdır) |
| Blog | Hər üç dildə 12 tema demo yazısı ("15 black & white party dresses" və s., mətni "lorem ipsum"-dur) |

- AZ ana səhifəsinin title-ı **"Home 4 - Caspian_Uniforms"**, meta description-u isə "Kateqoriyalara bax"-dır. RU-da title "Главная 4 - Caspian_Uniforms"-dir.
- Ana səhifədə (hər üç dildə), About və Contact səhifələrində **H1 yoxdur**. Məhsul və kateqoriya səhifələrində H1 mövcuddur.
- Alt mətni olmayan şəkil sayı: ana səhifədə 7, əlaqə səhifəsində 21, kateqoriya səhifəsində 21–26.
- Əlaqə səhifəsindəki Google Maps embed-i **"This page can't load Google Maps correctly"** xətası verir (API açarı və ya billing problemi).
- Məhsul səhifələrində Product + Offer schema var. About və Contact səhifələrində isə heç bir JSON-LD yoxdur (LocalBusiness, ünvan və geo məlumatı da yoxdur).
- Ana səhifədəki promo bannerlərdə ("ADD YOUR EMBROIDERED LOGO", "WINTER SALE") ağ mətn açıq fon üzərindədir və oxunmur. Chatbot pəncərəsi məhsul kartlarını örtür.

- WooCommerce Store API bütün dilləri ayrı-ayrı "məhsul" kimi qaytarır: rus versiyasının adı ingiliscədir, təsviri və kateqoriyası isə rusca. Tərcümələr natamamdır: kateqoriya sayları EN 51, AZ 19, RU 16-dır.
- Qiymətlər AZN ilə göstərilir və istehlakçı səbəti və checkout var. B2B istehsalçı üçün daha uyğun olan RFQ və ya kotirovka axını yoxdur.

## 8. UX / əlçatanlıq

- `meta viewport` dəyəri `maximum-scale=1.0, user-scalable=no`-dur, yəni mobil cihazda zoom bağlıdır. Bu, WCAG 1.4.4 tələbinin pozulmasıdır.
- Ana səhifədəki bəzi banner və promo şəkillərində alt mətn yoxdur. PWA yoxdur: manifest 404 qaytarır, service worker da yoxdur.
- Səhifələr arasında hər keçiddə səhifə tam yenidən yüklənir (SPA deyil).

## 9. Rəqiblər və qlobal yaxşı təcrübələr

| Şirkət | Nümunə götürüləsi təcrübə |
|---|---|
| **Portwest** (qlobal PPE və iş geyimi) | Məhsul səhifəsində EN ISO standart siyahısı, CE/OEKO-TEX, **yüklənə bilən datasheet, EU/UK Declaration of Conformity, istifadə təlimatı, ölçü cədvəli PDF-i**, parça tərkibi və çəkisi, yuma ikonları, rəng swatch-ları, ~30 dil |
| **Engelbert Strauss** | **1 ədəddən başlayan logo çapı və tikmə konfiquratoru** (500+ motiv, logo yükləmə), toplu sifarişdə endirim, biznes hesabı, Quick Order, ƏDV-siz qiymət, fakturalı ödəniş, müqayisə (4 məhsula qədər), e-procurement, kataloq sorğusu |
| **Red Kap / Carhartt Company Gear / ID Designer** | Logo yükləmə və canlı önizləmə, istehsaldan əvvəl rəqəmsal proof təsdiqi, minimum sifariş şərtləri, dilerə sorğu göndərmə |
| **Cintas** | Lokal "free quote" forması, şirkət üçün xüsusi "company store" portalı, procurement (punchout) inteqrasiyası |
| **Yerli: ARC Protection (uniform.az)** | AZ/EN/RU, kateqoriyalar, AZN qiymətlər, hər məhsulda WhatsApp, PDF kataloq. **Zəif tərəfləri:** filter və RFQ yoxdur, kontakt məlumatları uyğunsuzdur, mətnlərdə xətalar var, EN/RU məzmun boşdur |
| **Yerli: Debet Uniform/Safety, Baku Textile Factory, Ideal Uniform** | Baxış üçün rəqiblər. Onlayn təcrübə baxımından əksəriyyəti zəifdir və bu, fərqlənmək üçün fürsət yaradır |

Bunlardan tətbiq ediləcəklər: sənaye üzrə naviqasiya, standart və sertifikat sahələri (yalnız real data olduqda doldurulacaq), PDF spesifikasiya və kataloq, ölçü bələdçisi, kotirovka səbəti və RFQ, logo önizləmə, nümunə sifarişi, WhatsApp, müqayisə, açıq REST API.

## 10. Ödəniş: Polar barədə vacib qeyd

Polar-ın acceptable-use siyasəti **fiziki məhsulları və tam insan tərəfindən göstərilən xidmətləri qadağan edir** (docs.polar.sh/merchant-of-record/acceptable-use). Ona görə forma satışı Polar ilə **mümkün deyil**. Həll yolu belədir: Polar sandbox inteqrasiyası saxlanılır və **rəqəmsal məhsula** bağlanır. Bu məhsul şirkətin dizayn-konstruktor bürosunun lekalo və tech-pack faylları olacaq (PDF/DXF, ödənişdən sonra avtomatik yüklənir). Fiziki sifarişlər RFQ və faktura axını ilə gedir, sonradan isə `PaymentProvider` interfeysi vasitəsilə yerli bank və ya Stripe qoşula bilər.

## Mənbələr

- Vakansiya: jobsearch.az/vacancies/caspian-textile-mmc-full-stack-developer-155646
- Portwest S775 məhsul səhifəsi: portwest.com/products/view/S775/NAR
- Engelbert Strauss: strauss.com
- Red Kap custom workwear: redkap.com/custom-workwear; Carhartt: companygear.carhartt.com/brand-your-gear-guide; ID Designer: id.dk
- Cintas: cintas.com/local/uniform-services
- ARC Protection: uniform.az
- Cloudflare-in Bakı PoP-u: cdnplanet.com/geo/azerbaijan-cdn, getdeploying.com/datacenters-in-azerbaijan
- Polar acceptable use: docs.polar.sh/merchant-of-record/acceptable-use
