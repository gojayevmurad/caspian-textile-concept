import type { MediaRef } from "@/src/lib/catalog/queries";

type Props = {
  media: MediaRef | null;
  sizes: string;
  className?: string;
  alt?: string;
  priority?: boolean;
  /** Show the blurred placeholder behind the image (use for opaque photos only). */
  blur?: boolean;
  fit?: "contain" | "cover";
};

const url = (path: string) => `/media/${path}`;

/** Zero-JS responsive image from pre-generated AVIF/WebP variants with reserved dimensions (no CLS). */
export function Picture({
  media,
  sizes,
  className = "",
  alt,
  priority = false,
  blur = false,
  fit = "contain",
}: Props) {
  if (!media) {
    return (
      <div
        aria-hidden
        className={`aspect-square w-full rounded-[inherit] bg-surface ${className}`}
      />
    );
  }
  const avif = media.variants.filter((v) => v.format === "avif");
  const webp = media.variants.filter((v) => v.format === "webp");
  const fallback = webp.find((v) => v.width >= 720) ?? webp.at(-1)!;
  const srcSet = (list: typeof avif) =>
    list.map((v) => `${url(v.path)} ${v.width}w`).join(", ");
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(avif)} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(webp)} sizes={sizes} />
      <img
        src={url(fallback.path)}
        width={media.width}
        height={media.height}
        alt={alt ?? media.alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        className={`h-auto w-full ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
        style={
          blur
            ? {
                backgroundImage: `url(${media.blur})`,
                backgroundSize: "cover",
                backgroundColor: media.color,
              }
            : undefined
        }
      />
    </picture>
  );
}
