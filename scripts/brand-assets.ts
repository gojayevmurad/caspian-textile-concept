// One-off: derive web logo + PWA icons from the company logo PNG.
//   pnpm tsx scripts/brand-assets.ts <path-to-logo.png>
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const src = process.argv[2];
if (!src) throw new Error("Pass the logo PNG path");
await mkdir("public/brand", { recursive: true });
const trimmed = await sharp(src).trim({ threshold: 10 }).toBuffer();
const meta = await sharp(trimmed).metadata();
console.log("logo", meta.width, meta.height);
await sharp(trimmed)
  .resize({ height: 96 })
  .webp({ quality: 90 })
  .toFile("public/brand/logo.webp");
await sharp(trimmed)
  .resize({ height: 96 })
  .png({ compressionLevel: 9 })
  .toFile("public/brand/logo.png");
// Mark only (the "CT" monogram, top ~78% of the trimmed logo).
const mark = await sharp(trimmed)
  .extract({
    left: 0,
    top: 0,
    width: meta.width!,
    height: Math.round(meta.height! * 0.78),
  })
  .trim({ threshold: 10 })
  .toBuffer();
const icon = async (
  size: number,
  pad: number,
  file: string,
  bg = "#ffffff",
) => {
  const inner = Math.round(size * (1 - pad * 2));
  const m = await sharp(mark)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: m, gravity: "center" }])
    .png()
    .toFile(file);
};
await icon(192, 0.12, "public/brand/icon-192.png");
await icon(512, 0.12, "public/brand/icon-512.png");
await icon(512, 0.22, "public/brand/maskable-512.png");
await icon(180, 0.12, "app/apple-icon.png");
await icon(64, 0.06, "app/icon.png");
console.log("done");
