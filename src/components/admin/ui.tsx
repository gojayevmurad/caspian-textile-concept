import Link from "next/link";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Denied({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p
      role="alert"
      className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800"
    >
      Bu hesab yalnız baxış üçündür — dəyişiklik server tərəfindən rədd edildi
      (403).
    </p>
  );
}

export function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p
      role="status"
      className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-800"
    >
      Yadda saxlanıldı. Keş yeniləndi.
    </p>
  );
}

const statusColors: Record<string, string> = {
  published: "bg-green-50 text-green-800 ring-green-200",
  draft: "bg-surface text-muted ring-line",
  archived: "bg-surface text-muted ring-line",
  source: "bg-green-50 text-green-800 ring-green-200",
  approved: "bg-green-50 text-green-800 ring-green-200",
  ai_draft: "bg-amber-50 text-amber-900 ring-amber-200",
  untranslated: "bg-red-50 text-red-800 ring-red-200",
  new: "bg-blue-50 text-blue-800 ring-blue-200",
  in_review: "bg-amber-50 text-amber-900 ring-amber-200",
  quoted: "bg-violet-50 text-violet-800 ring-violet-200",
  won: "bg-green-50 text-green-800 ring-green-200",
  lost: "bg-surface text-muted ring-line",
};
export const statusLabel: Record<string, string> = {
  published: "Dərc olunub",
  draft: "Qaralama",
  archived: "Arxiv",
  source: "Orijinal",
  approved: "Təsdiqlənib",
  ai_draft: "AI qaralama",
  untranslated: "Tərcümə yoxdur",
  new: "Yeni",
  in_review: "Baxılır",
  quoted: "Təklif göndərilib",
  won: "Qazanıldı",
  lost: "İtirildi",
};
export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusColors[status] ?? "bg-surface ring-line"}`}
    >
      {statusLabel[status] ?? status}
    </span>
  );
}

export function Stat({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  hint?: string;
}) {
  const body = (
    <>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-4 hover:border-brand">
      {body}
    </Link>
  ) : (
    <div className="card p-4">{body}</div>
  );
}
