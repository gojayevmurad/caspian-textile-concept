"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { quote } from "./quote-store";

type Props = {
  product: {
    productId: number;
    sku: string;
    name: string;
    href: string;
    image?: string;
    colors: string[];
    sizes: string[];
  };
  colorLabels: Record<string, string>;
  labels: {
    add: string;
    added: string;
    size: string;
    color: string;
    qty: string;
    basket: string;
  };
  basketHref: string;
};

export function AddToQuote({
  product,
  colorLabels,
  labels,
  basketHref,
}: Props) {
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [qty, setQty] = useState(10);
  const [added, setAdded] = useState(false);
  return (
    <form
      className="space-y-4 rounded-2xl border border-line p-4"
      onSubmit={(e) => {
        e.preventDefault();
        quote.add(product, {
          color: color || null,
          size: size || null,
          qty: Math.max(1, qty),
        });
        setAdded(true);
      }}
    >
      {product.colors.length > 0 && (
        <fieldset>
          <legend className="label">{labels.color}</legend>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <label key={c} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={c}
                  checked={color === c}
                  onChange={() => setColor(c)}
                  className="peer sr-only"
                />
                <span className="chip peer-checked:border-brand peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-hivis">
                  {colorLabels[c] ?? c}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="grid grid-cols-2 gap-3">
        {product.sizes.length > 0 && (
          <label>
            <span className="label">{labels.size}</span>
            <select
              className="input"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              {product.sizes.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        <label className={product.sizes.length ? "" : "col-span-2"}>
          <span className="label">{labels.qty}</span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
            max={100000}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
          />
        </label>
      </div>
      <button type="submit" className="btn-primary w-full">
        {added ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <Plus className="size-4" aria-hidden />
        )}
        {labels.add}
      </button>
      <p role="status" className="min-h-5 text-center text-sm">
        {added && (
          <Link
            href={basketHref}
            className="font-semibold text-brand hover:underline"
          >
            {labels.added} → {labels.basket}
          </Link>
        )}
      </p>
    </form>
  );
}
