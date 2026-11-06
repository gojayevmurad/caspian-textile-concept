// Image pipeline shared by the legacy importer and admin uploads (no server-only import:
// it also runs in operator scripts). Originals are never served; we store content-hashed
// AVIF + WebP variants and a tiny blur placeholder.
import { createHash } from "node:crypto";
import { mkdir, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

export const MEDIA_WIDTHS = [360, 720, 1080, 1600] as const;
export type MediaVariant = {
  format: "avif" | "webp";
  width: number;
  height: number;
  path: string;
  bytes: number;
};
export type ProcessedMedia = {
  hash: string;
  width: number;
  height: number;
  color: string;
  blur: string;
  variants: MediaVariant[];
};

export const ALLOWED_UPLOAD_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
] as const;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function mediaRoot() {
  return resolve(process.env.MEDIA_DIR || "storage/media");
}

const exists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );

/** Detects the real image type from magic bytes (never trust the client-provided MIME). */
export function sniffImageType(
  buf: Buffer,
): (typeof ALLOWED_UPLOAD_TYPES)[number] | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG")
    return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "image/jpeg";
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  if (
    buf.toString("ascii", 4, 8) === "ftyp" &&
    /avi[fs]/.test(buf.toString("ascii", 8, 12))
  )
    return "image/avif";
  return null;
}

export async function processImage(
  input: Buffer,
  opts: { maxWidth?: number } = {},
): Promise<ProcessedMedia> {
  if (!sniffImageType(input)) throw new Error("Unsupported image type");
  const hash = createHash("sha256").update(input).digest("hex").slice(0, 24);
  // Normalize orientation, drop metadata (EXIF/GPS) and cap pathological sizes.
  const base = sharp(input, { limitInputPixels: 40_000_000 }).rotate();
  const meta = await base.metadata();
  if (!meta.width || !meta.height) throw new Error("Image has no dimensions");
  const maxWidth = Math.min(opts.maxWidth ?? 1600, meta.width);
  const widths = [
    ...new Set([...MEDIA_WIDTHS.filter((w) => w < maxWidth), maxWidth]),
  ];

  const stats = await base.clone().stats();
  const { r, g, b } = stats.dominant;
  const color =
    "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  const blurBuf = await base
    .clone()
    .resize(16, 16, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();
  const blur = `data:image/webp;base64,${blurBuf.toString("base64")}`;

  const dir = join(mediaRoot(), hash.slice(0, 2));
  await mkdir(dir, { recursive: true });
  const variants: MediaVariant[] = [];
  for (const width of widths) {
    const resized = base.clone().resize({ width, withoutEnlargement: true });
    for (const format of ["avif", "webp"] as const) {
      const rel = `${hash.slice(0, 2)}/${hash}-${width}.${format}`;
      const file = join(mediaRoot(), rel);
      let bytes: number;
      if (await exists(file)) {
        bytes = (await sharp(file).metadata()).size ?? 0;
      } else {
        const out =
          format === "avif"
            ? await resized.clone().avif({ quality: 52, effort: 3 }).toBuffer()
            : await resized.clone().webp({ quality: 74, effort: 4 }).toBuffer();
        await writeFile(file, out);
        bytes = out.length;
      }
      variants.push({
        format,
        width,
        height: Math.round((meta.height * width) / meta.width),
        path: rel,
        bytes,
      });
    }
  }
  return {
    hash,
    width: meta.width,
    height: meta.height,
    color,
    blur,
    variants,
  };
}
