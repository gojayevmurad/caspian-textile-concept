import { isLocale } from "@/src/lib/i18n/config";
import { getProduct } from "@/src/lib/catalog/queries";
import { ogCard } from "@/src/lib/media/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Caspian Textile product";

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const product = isLocale(lang)
    ? await getProduct(lang, decodeURIComponent(slug))
    : null;
  return new Response(new Uint8Array(await ogCard(product?.image?.variants)), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
