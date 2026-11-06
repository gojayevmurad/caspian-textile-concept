"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Plus, Trash2, Upload, WifiOff } from "lucide-react";
import { quote, totalQty, useQuote, type QuoteLine } from "./quote-store";
import { useQueryParam } from "./use-query-param";

export type QuoteLabels = {
  title: string;
  lead: string;
  empty: string;
  browse: string;
  size: string;
  color: string;
  qty: string;
  addLine: string;
  remove: string;
  total: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  taxId: string;
  country: string;
  targetDate: string;
  message: string;
  logo: string;
  placement: string;
  method: string;
  embroidery: string;
  print: string;
  placements: Record<string, string>;
  proofNote: string;
  consent: string;
  submit: string;
  sending: string;
  success: string;
  successNext: string;
  offlineQueued: string;
  error: string;
  demoNote: string;
  sampleTitle: string;
  sampleLead: string;
  preview: string;
  previewHint: string;
  scale: string;
};

const OUTBOX = "ct-rfq-outbox-v1";
const PLACEMENTS: Record<string, { x: number; y: number }> = {
  "chest-left": { x: 62, y: 30 },
  "chest-right": { x: 38, y: 30 },
  back: { x: 50, y: 34 },
  sleeve: { x: 20, y: 38 },
};

type Outboxed = {
  payload: string;
  logo?: { name: string; type: string; data: string };
};

async function send(payload: string, logo?: Blob, logoName?: string) {
  const fd = new FormData();
  fd.set("payload", payload);
  if (logo) fd.set("logo", logo, logoName ?? "logo");
  const res = await fetch("/api/rfq", {
    method: "POST",
    body: fd,
    headers: { Accept: "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw Object.assign(new Error(data.error || "error"), {
      status: res.status,
    });
  return data as { number: string };
}

export async function flushOutbox(): Promise<string[]> {
  let queue: Outboxed[] = [];
  try {
    queue = JSON.parse(localStorage.getItem(OUTBOX) || "[]");
  } catch {}
  const sent: string[] = [];
  const left: Outboxed[] = [];
  for (const item of queue) {
    try {
      const logo = item.logo
        ? await (await fetch(item.logo.data)).blob()
        : undefined;
      sent.push((await send(item.payload, logo, item.logo?.name)).number);
    } catch {
      left.push(item);
    }
  }
  localStorage.setItem(OUTBOX, JSON.stringify(left));
  return sent;
}

export function QuoteForm({
  locale,
  labels,
  colorLabels,
  catalogHref,
  kind = "quote",
  presetSku,
}: {
  locale: string;
  labels: QuoteLabels;
  colorLabels: Record<string, string>;
  catalogHref: string;
  kind?: "quote" | "sample";
  presetSku?: string;
}) {
  const items = useQuote();
  const urlSku = useQueryParam("sku");
  const sku = presetSku ?? urlSku ?? undefined;
  const [state, setState] = useState<{
    status: "idle" | "sending" | "done" | "queued" | "error";
    number?: string;
    message?: string;
  }>({ status: "idle" });
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState("chest-left");
  const [method, setMethod] = useState("embroidery");
  const [scale, setScale] = useState(22);
  const formRef = useRef<HTMLFormElement>(null);
  const previewImage = items.find((i) => i.image)?.image;
  const total = totalQty(items);

  const pickLogo = (file: File | null) => {
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogo(file);
    setLogoUrl(file ? URL.createObjectURL(file) : null);
  };

  useEffect(() => {
    const onOnline = () =>
      flushOutbox().then(
        (n) => n.length && setState({ status: "done", number: n.join(", ") }),
      );
    window.addEventListener("online", onOnline);
    if (navigator.onLine) onOnline();
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const canSubmit = kind === "sample" ? true : items.length > 0 && total > 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = JSON.stringify({
      kind,
      locale,
      company: f.get("company"),
      contactName: f.get("contactName"),
      email: f.get("email"),
      phone: f.get("phone"),
      taxId: f.get("taxId") || undefined,
      country: f.get("country") || undefined,
      targetDate: f.get("targetDate") || undefined,
      message: f.get("message") || undefined,
      website: f.get("website") || undefined, // honeypot
      consent: f.get("consent") === "on",
      skus:
        kind === "sample"
          ? String(f.get("skus") || "")
              .split(/[\s,]+/)
              .filter(Boolean)
          : undefined,
      items: items.map((i) => ({
        productId: i.productId,
        lines: i.lines.filter((l) => l.qty > 0),
      })),
      branding: logo ? { placement, method, scale } : undefined,
    });
    setState({ status: "sending" });
    try {
      if (!navigator.onLine) throw new TypeError("offline");
      const { number } = await send(payload, logo ?? undefined, logo?.name);
      setState({ status: "done", number });
      if (kind === "quote") quote.clear();
      formRef.current?.reset();
      pickLogo(null);
    } catch (err) {
      if (err instanceof TypeError) {
        // Network failure: keep the request and retry automatically when back online.
        const entry: Outboxed = { payload };
        if (logo && logo.size < 2_000_000) {
          const data = await new Promise<string>((r) => {
            const fr = new FileReader();
            fr.onload = () => r(String(fr.result));
            fr.readAsDataURL(logo);
          });
          entry.logo = { name: logo.name, type: logo.type, data };
        }
        const q = JSON.parse(localStorage.getItem(OUTBOX) || "[]");
        localStorage.setItem(OUTBOX, JSON.stringify([...q, entry]));
        setState({ status: "queued" });
      } else setState({ status: "error", message: (err as Error).message });
    }
  }

  if (state.status === "done") {
    return (
      <div
        role="status"
        className="rounded-3xl border border-line p-10 text-center"
      >
        <CheckCircle2 className="mx-auto size-12 text-green-700" aria-hidden />
        <p className="mt-4 text-xl font-bold">
          {labels.success.replace("{number}", state.number ?? "")}
        </p>
        <p className="mt-2 text-muted">{labels.successNext}</p>
        <Link href={catalogHref} className="btn-ghost mt-6">
          {labels.browse}
        </Link>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="grid gap-10 lg:grid-cols-[1.3fr_1fr]"
      noValidate={false}
    >
      <div className="space-y-8">
        {kind === "quote" ? (
          <section aria-labelledby="items-title">
            <h2 id="items-title" className="sr-only">
              {labels.title}
            </h2>
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-10 text-center">
                <p className="text-muted">{labels.empty}</p>
                <Link href={catalogHref} className="btn-primary mt-4">
                  {labels.browse}
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {items.map((item) => (
                  <li
                    key={item.productId}
                    className="rounded-2xl border border-line p-4"
                  >
                    <div className="flex items-start gap-3">
                      {item.image ? (
                        <img
                          src={`/media/${item.image}`}
                          alt=""
                          width={64}
                          height={64}
                          className="size-16 rounded-xl bg-surface object-contain p-1 mix-blend-multiply"
                        />
                      ) : (
                        <div className="size-16 rounded-xl bg-surface" />
                      )}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={item.href}
                          className="font-semibold hover:text-brand"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-muted">{item.sku}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => quote.remove(item.productId)}
                        className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-red-700"
                        aria-label={`${labels.remove}: ${item.name}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                    <LinesEditor
                      item={item}
                      labels={labels}
                      colorLabels={colorLabels}
                    />
                  </li>
                ))}
              </ul>
            )}
            {items.length > 0 && (
              <p className="mt-3 text-right text-sm font-semibold">
                {labels.total.replace("{n}", String(total))}
              </p>
            )}
          </section>
        ) : (
          <label className="block">
            <span className="label">SKU</span>
            <input
              name="skus"
              className="input"
              defaultValue={presetSku}
              required
              placeholder="KOM-4-WP-340"
            />
          </label>
        )}

        <fieldset
          id="branding"
          className="scroll-mt-28 rounded-2xl border border-line p-4"
        >
          <legend className="px-1 font-semibold">{labels.preview}</legend>
          <p className="text-sm text-muted">{labels.previewHint}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[200px_1fr]">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-surface">
              {previewImage ? (
                <img
                  src={`/media/${previewImage}`}
                  alt=""
                  className="size-full object-contain p-2 mix-blend-multiply"
                />
              ) : (
                <div className="size-full" />
              )}
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt=""
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 object-contain"
                  style={{
                    left: `${PLACEMENTS[placement].x}%`,
                    top: `${PLACEMENTS[placement].y}%`,
                    width: `${scale}%`,
                    filter:
                      method === "embroidery"
                        ? "contrast(1.1) saturate(0.9)"
                        : undefined,
                  }}
                />
              )}
            </div>
            <div className="space-y-3">
              <label className="btn-ghost w-full cursor-pointer">
                <Upload className="size-4" aria-hidden /> {labels.logo}
                <input
                  type="file"
                  name="logoFile"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => pickLogo(e.target.files?.[0] ?? null)}
                />
              </label>
              {logo && (
                <p className="truncate text-xs text-muted">{logo.name}</p>
              )}
              <label className="block">
                <span className="label">{labels.placement}</span>
                <select
                  className="input"
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                >
                  {Object.entries(labels.placements).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-3">
                {(["embroidery", "print"] as const).map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="method"
                      value={m}
                      checked={method === m}
                      onChange={() => setMethod(m)}
                      className="accent-[var(--color-brand)]"
                    />{" "}
                    {labels[m]}
                  </label>
                ))}
              </div>
              <label className="block text-sm">
                <span className="label">{labels.scale}</span>
                <input
                  type="range"
                  min={10}
                  max={45}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full accent-[var(--color-brand)]"
                />
              </label>
              <p className="text-xs text-muted">{labels.proofNote}</p>
            </div>
          </div>
        </fieldset>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Field
            name="company"
            label={labels.company}
            required
            autoComplete="organization"
          />
          <Field
            name="contactName"
            label={labels.contactName}
            required
            autoComplete="name"
          />
          <Field
            name="email"
            label={labels.email}
            type="email"
            required
            autoComplete="email"
          />
          <Field
            name="phone"
            label={labels.phone}
            type="tel"
            required
            autoComplete="tel"
          />
          <Field name="taxId" label={labels.taxId} />
          <Field
            name="country"
            label={labels.country}
            autoComplete="country-name"
            defaultValue={locale === "az" ? "Azərbaycan" : ""}
          />
          <Field name="targetDate" label={labels.targetDate} type="date" />
        </div>
        <label className="block">
          <span className="label">{labels.message}</span>
          <textarea
            name="message"
            rows={4}
            maxLength={2000}
            className="input py-2"
          />
        </label>
        {/* Honeypot: hidden from people, filled by naive bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
        />
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-1 size-4 accent-[var(--color-brand)]"
          />{" "}
          {labels.consent}
        </label>
        <button
          type="submit"
          disabled={!canSubmit || state.status === "sending"}
          className="btn-primary w-full"
        >
          {state.status === "sending" ? labels.sending : labels.submit}
        </button>
        <p className="text-xs text-muted">{labels.demoNote}</p>
        {state.status === "queued" && (
          <p
            role="status"
            className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
          >
            <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />{" "}
            {labels.offlineQueued}
          </p>
        )}
        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            {labels.error}{" "}
            {state.message && state.message !== "error"
              ? `(${state.message})`
              : ""}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  autoComplete,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required && (
          <span aria-hidden className="text-hivis-700">
            {" "}
            *
          </span>
        )}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        maxLength={200}
        className="input"
      />
    </label>
  );
}

function LinesEditor({
  item,
  labels,
  colorLabels,
}: {
  item: ReturnType<typeof useQuote>[number];
  labels: QuoteLabels;
  colorLabels: Record<string, string>;
}) {
  const lines = item.lines;
  const set = (i: number, patch: Partial<QuoteLine>) =>
    quote.setLines(
      item.productId,
      lines.map((l, j) => (j === i ? { ...l, ...patch } : l)),
    );
  const sizes = useMemo(() => item.sizes, [item.sizes]);
  return (
    <div className="mt-3 space-y-2">
      {lines.map((l, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1fr_90px_40px] items-end gap-2"
        >
          {sizes.length ? (
            <label>
              <span className="sr-only">{labels.size}</span>
              <select
                className="input min-h-10"
                value={l.size ?? ""}
                onChange={(e) => set(i, { size: e.target.value || null })}
                aria-label={labels.size}
              >
                {sizes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          ) : (
            <span className="text-sm text-muted">—</span>
          )}
          {item.colors.length ? (
            <select
              className="input min-h-10"
              value={l.color ?? ""}
              onChange={(e) => set(i, { color: e.target.value || null })}
              aria-label={labels.color}
            >
              {item.colors.map((c) => (
                <option key={c} value={c}>
                  {colorLabels[c] ?? c}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-muted">—</span>
          )}
          <input
            type="number"
            min={0}
            max={100000}
            className="input min-h-10"
            value={l.qty}
            onChange={(e) =>
              set(i, { qty: Math.max(0, Number(e.target.value) || 0) })
            }
            aria-label={labels.qty}
          />
          <button
            type="button"
            onClick={() =>
              quote.setLines(
                item.productId,
                lines.filter((_, j) => j !== i),
              )
            }
            className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface"
            aria-label={labels.remove}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          quote.setLines(item.productId, [
            ...lines,
            { size: sizes[0] ?? null, color: item.colors[0] ?? null, qty: 1 },
          ])
        }
        className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
      >
        <Plus className="size-4" aria-hidden /> {labels.addLine}
      </button>
    </div>
  );
}
