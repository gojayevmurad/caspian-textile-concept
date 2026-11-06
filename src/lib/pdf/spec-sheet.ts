import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";
import { company } from "@/src/config/company";
import { colorNames } from "@/src/lib/catalog/taxonomy";
import { defaultSizes } from "@/src/lib/catalog/sizes";
import { htmlToText } from "@/src/lib/catalog/clean-html";
import { localePath, type Locale } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import type { CategoryView, ProductDetail } from "@/src/lib/catalog/queries";
import { mediaRoot } from "@/src/lib/media/process";
import { siteUrl } from "@/src/lib/seo/metadata";

const NAVY = rgb(43 / 255, 45 / 255, 79 / 255);
const MUTED = rgb(0.33, 0.36, 0.41);
const ORANGE = rgb(185 / 255, 71 / 255, 10 / 255);

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

/** One-page A4 product specification sheet in the requested language. */
export async function buildSpecSheet(
  locale: Locale,
  p: ProductDetail,
  categories: CategoryView[],
) {
  const t = getDictionary(locale);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fontDir = join(process.cwd(), "src/assets/fonts");
  const regular = await doc.embedFont(
    await readFile(join(fontDir, "DejaVuSans.ttf")),
    { subset: true },
  );
  const bold = await doc.embedFont(
    await readFile(join(fontDir, "DejaVuSans-Bold.ttf")),
    { subset: true },
  );
  doc.setTitle(`${p.name} — ${t.product.specSheet}`);
  doc.setAuthor(company.name);
  doc.setLanguage(locale);
  const page: PDFPage = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const M = 40;

  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: NAVY });
  page.drawRectangle({ x: 0, y: height - 74, width, height: 4, color: ORANGE });
  const logoPng = await sharp(join(process.cwd(), "public/brand/logo.png"))
    .flatten({ background: "#ffffff" })
    .extend({ top: 6, bottom: 6, left: 10, right: 10, background: "#ffffff" })
    .png()
    .toBuffer();
  const logo = await doc.embedPng(logoPng);
  page.drawImage(logo, {
    x: M,
    y: height - 62,
    width: (logo.width / logo.height) * 54,
    height: 54,
  });
  page.drawText(t.product.specSheet.replace(/\s*\(PDF\)/, ""), {
    x:
      width -
      M -
      bold.widthOfTextAtSize(t.product.specSheet.replace(/\s*\(PDF\)/, ""), 12),
    y: height - 42,
    size: 12,
    font: bold,
    color: rgb(1, 1, 1),
  });

  let y = height - 110;
  for (const line of wrap(p.name, bold, 20, width - 2 * M)) {
    page.drawText(line, { x: M, y, size: 20, font: bold, color: NAVY });
    y -= 26;
  }
  page.drawText(
    `${t.product.sku}: ${p.sku}${p.brand ? `   ·   ${t.product.brand}: ${p.brand}` : ""}`,
    { x: M, y, size: 10, font: regular, color: MUTED },
  );
  y -= 24;

  // Image (left) + facts (right)
  const imgTop = y;
  const best = p.image?.variants
    .filter((v) => v.format === "webp")
    .sort((a, b) => b.width - a.width)[0];
  if (best) {
    const png = await sharp(await readFile(join(mediaRoot(), best.path)))
      .resize(600, 600, { fit: "contain", background: "#f5f6f8" })
      .flatten({ background: "#f5f6f8" })
      .png()
      .toBuffer();
    const img = await doc.embedPng(png);
    page.drawImage(img, { x: M, y: imgTop - 220, width: 220, height: 220 });
  }
  const byKey = new Map(categories.map((c) => [`${c.kind}:${c.key}`, c.name]));
  const facts: [string, string][] = [
    [
      t.product.industries,
      p.categories
        .filter((c) => c.startsWith("industry:"))
        .map((k) => byKey.get(k))
        .join(", "),
    ],
    [
      t.catalog.type,
      p.categories
        .filter((c) => c.startsWith("type:"))
        .map((k) => byKey.get(k))
        .join(", "),
    ],
    [
      t.product.features,
      p.categories
        .filter((c) => c.startsWith("feature:"))
        .map((k) => byKey.get(k))
        .join(", "),
    ],
    [
      t.product.colors,
      p.colors.map((c) => colorNames[c]?.[locale] ?? c).join(", "),
    ],
    [
      t.product.sizeGuide,
      (p.sizes.length ? p.sizes : defaultSizes(p.categories)).join(" · "),
    ],
    [
      t.product.standards,
      p.standards.length ? p.standards.join(", ") : t.product.standardsNone,
    ],
  ].filter(([, v]) => v) as [string, string][];
  let fy = imgTop - 4;
  const fx = M + 240;
  for (const [k, v] of facts) {
    page.drawText(k, { x: fx, y: fy, size: 8.5, font: bold, color: MUTED });
    fy -= 13;
    for (const line of wrap(v, regular, 10, width - fx - M)) {
      page.drawText(line, {
        x: fx,
        y: fy,
        size: 10,
        font: regular,
        color: rgb(0.08, 0.09, 0.11),
      });
      fy -= 13;
    }
    fy -= 6;
  }
  y = Math.min(imgTop - 240, fy) - 10;

  page.drawText(t.product.description, {
    x: M,
    y,
    size: 12,
    font: bold,
    color: NAVY,
  });
  y -= 18;
  const body = p.descriptionHtml
    .replace(/<h3>(.*?)<\/h3>/g, "\n$1\n")
    .replace(/<li>/g, "\n• ")
    .replace(/<\/p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const summary = htmlToText(p.summary) + "\n\n" + body;
  for (const line of wrap(summary, regular, 9.5, width - 2 * M)) {
    if (y < 90) break;
    page.drawText(line, {
      x: M,
      y,
      size: 9.5,
      font: regular,
      color: rgb(0.2, 0.22, 0.26),
    });
    y -= 13.5;
  }

  page.drawLine({
    start: { x: M, y: 70 },
    end: { x: width - M, y: 70 },
    thickness: 0.5,
    color: rgb(0.85, 0.86, 0.9),
  });
  page.drawText(
    `${company.legalName} · ${company.factory.address[locale]} · ${company.factory.phones[0]} · ${company.email}`,
    { x: M, y: 54, size: 8, font: regular, color: MUTED },
  );
  page.drawText(`${siteUrl()}${localePath(locale, "product", p.slug)}`, {
    x: M,
    y: 41,
    size: 8,
    font: regular,
    color: NAVY,
  });
  page.drawText(
    `${t.demo.banner}  ·  ${new Date().toISOString().slice(0, 10)}`,
    { x: M, y: 28, size: 7, font: regular, color: MUTED },
  );
  return doc.save();
}
