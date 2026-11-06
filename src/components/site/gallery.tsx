"use client";
import { useState } from "react";
import type { MediaRef } from "@/src/lib/catalog/queries";
import { Picture } from "./picture";

export function Gallery({
  images,
  name,
  label,
}: {
  images: MediaRef[];
  name: string;
  label: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = images[active];
  return (
    <div>
      <div
        className="relative aspect-square overflow-hidden rounded-3xl bg-surface p-6"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({
            x: ((e.clientX - r.left) / r.width) * 100,
            y: ((e.clientY - r.top) / r.height) * 100,
          });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <div
          className="size-full transition-transform duration-200 ease-out"
          style={
            zoom
              ? {
                  transform: "scale(1.8)",
                  transformOrigin: `${zoom.x}% ${zoom.y}%`,
                }
              : undefined
          }
        >
          <Picture
            media={current ?? null}
            sizes="(min-width: 1024px) 560px, 92vw"
            priority
            alt={current?.alt || name}
            className="aspect-square mix-blend-multiply"
          />
        </div>
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={label
                  .replace("{i}", String(i + 1))
                  .replace("{n}", String(images.length))}
                aria-current={i === active}
                className={`size-20 rounded-xl bg-surface p-1.5 ring-2 ${i === active ? "ring-brand" : "ring-transparent hover:ring-line"}`}
              >
                <Picture
                  media={m}
                  sizes="80px"
                  alt=""
                  className="aspect-square mix-blend-multiply"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
