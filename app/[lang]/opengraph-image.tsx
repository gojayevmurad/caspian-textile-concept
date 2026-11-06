import { ogCard } from "@/src/lib/media/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Caspian Textile";

export default async function Image() {
  return new Response(new Uint8Array(await ogCard()), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
