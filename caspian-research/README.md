# Caspian Textile — araşdırma paketi

| Fayl / qovluq | Nədir |
|---|---|
| `PROMPT.md` | Yeni Claude Code sessiyasına veriləcək tam build promptu (boilerplate əsaslı) |
| `AUDIT.md` | Mövcud saytın auditi: sübutlar, rəqəmlər, rəqib təcrübələri |
| `data/products.normalized.json` | Bütün məhsullar SKU üzrə qruplaşdırılıb, az/en/ru tərcümələri ilə |
| `data/categories.json`, `attributes.json`, `pages.json` | Kateqoriyalar, atributlar, səhifə mətnləri (3 dildə) |
| `data/images/` | Saytdakı orijinal şəkillər (`wp-content/uploads` strukturu ilə) |
| `data/screenshots/` | Mövcud saytın desktop/mobil ekran görüntüləri (dizayn referansı) |
| `data/raw/` | Xam API dump-ları, sitemaplər, render edilmiş səhifə məlumatları |
| `bench/bench.mjs` | Soyuq ziyarət benchmarkı (real Chrome). "Əvvəl/sonra" müqayisəsi üçün eyni skript istifadə olunur |
| `bench/baseline*.json` | Mövcud saytın ölçmə nəticələri (Bakı, 6 noyabr 2026) |

## İstifadə

1. Yeni boş qovluqda Claude Code sessiyası aç və bu qovluğu oraya `research/` adı ilə kopyala.
2. `PROMPT.md` faylında xəttdən aşağıdakı hissəni sessiyaya yapışdır.
3. Benchmark (yeni sayt hazır olanda):
   ```bash
   cd research/bench && npm i playwright-core@1.56.1 && RUNS=5 node bench.mjs after.json https://caspian.muradgojayev.com/ https://caspian.muradgojayev.com/kataloq https://caspian.muradgojayev.com/<mehsul-slug>
   ```
   Müqayisənin ədalətli olması üçün ölçmə eyni yerdən (Bakı) və eyni profillərlə aparılmalıdır.
