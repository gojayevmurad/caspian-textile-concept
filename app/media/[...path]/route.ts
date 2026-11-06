import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { mediaRoot } from "@/src/lib/media/process";

const VALID = /^[0-9a-f]{2}\/[0-9a-f]{24}-\d{2,4}\.(avif|webp)$/;
const TYPES = { avif: "image/avif", webp: "image/webp" } as const;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const rel = path.join("/");
  const m = rel.match(VALID);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(join(mediaRoot(), rel));
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": TYPES[m[1] as keyof typeof TYPES],
        // Content-hashed filenames: safe to cache forever at the edge and in browsers.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
