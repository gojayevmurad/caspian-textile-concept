"use client";
import { useState } from "react";

export function BuyPattern({
  productKey,
  lang,
  label,
  disabledLabel,
  enabled,
}: {
  productKey: string;
  lang: string;
  label: string;
  disabledLabel: string;
  enabled: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div>
      <button
        type="button"
        disabled={!enabled || busy}
        className="btn-primary w-full"
        onClick={async () => {
          setBusy(true);
          setError(false);
          const res = await fetch("/api/patterns/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: productKey, lang }),
          });
          const data = await res.json().catch(() => ({}));
          if (data.url) window.location.href = data.url;
          else {
            setError(true);
            setBusy(false);
          }
        }}
      >
        {label}
      </button>
      {(!enabled || error) && (
        <p className="mt-2 text-xs text-muted">{disabledLabel}</p>
      )}
    </div>
  );
}
