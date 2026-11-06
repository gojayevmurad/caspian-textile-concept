import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { mediaRoot, type MediaVariant } from "./process";

const W = 1200;
const H = 630;
const NAVY = { r: 43, g: 45, b: 79, alpha: 1 };

/** Branded 1200×630 social card composed with sharp (no text rendering → no font/glyph issues). */
export async function ogCard(variants?: MediaVariant[]) {
  const logo = await sharp(join(process.cwd(), "public/brand/logo.png"))
    .resize({ height: 150 })
    .toBuffer();
  const layers: sharp.OverlayOptions[] = [
    {
      input: {
        create: { width: 560, height: H, channels: 4, background: NAVY },
      },
      left: 0,
      top: 0,
    },
    {
      input: {
        create: {
          width: 560,
          height: 10,
          channels: 4,
          background: { r: 242, g: 107, b: 29, alpha: 1 },
        },
      },
      left: 0,
      top: H - 10,
    },
    {
      input: await sharp({
        create: { width: 300, height: 300, channels: 4, background: "#ffffff" },
      })
        .png()
        .toBuffer(),
      left: 130,
      top: 165,
    },
    {
      input: logo,
      left: 280 - Math.round((await sharp(logo).metadata()).width! / 2),
      top: 240,
    },
  ];
  const best = variants
    ?.filter((v) => v.format === "webp")
    .sort((a, b) => b.width - a.width)[0];
  if (best) {
    const img = await sharp(await readFile(join(mediaRoot(), best.path)))
      .resize(560, 560, { fit: "contain", background: "#f5f6f8" })
      .flatten({ background: "#f5f6f8" })
      .png()
      .toBuffer();
    layers.push({ input: img, left: 600, top: 35 });
  }
  return sharp({
    create: { width: W, height: H, channels: 4, background: "#f5f6f8" },
  })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}
