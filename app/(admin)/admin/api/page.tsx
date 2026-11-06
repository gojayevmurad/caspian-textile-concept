import { adminContext } from "@/src/lib/admin/context";
import { PageHeader } from "@/src/components/admin/ui";

export const metadata = { title: "REST API" };
const examples = [
  [
    "GET",
    "/api/v1/products?lang=az&industry=construction&limit=5",
    "Sənaye üzrə məhsullar",
  ],
  ["GET", "/api/v1/products/KOM-4-WP-340?lang=ru", "Bir məhsul (rus dilində)"],
  ["GET", "/api/v1/categories?lang=en&kind=industry", "Sənayelər"],
  ["GET", "/api/v1/openapi.json", "OpenAPI 3.1 spesifikasiyası"],
];

export default async function ApiDocs() {
  await adminContext();
  return (
    <>
      <PageHeader
        title="REST API v1"
        description="Açıq, read-only kataloq API-si: CDN-də keşlənir, CORS açıqdır. Mobil tətbiq (React Native) və partnyor inteqrasiyaları üçün hazırdır."
      />
      <div className="card divide-y divide-line">
        {examples.map(([m, path, label]) => (
          <a
            key={path}
            href={path}
            target="_blank"
            className="flex flex-wrap items-center gap-3 p-4 text-sm hover:bg-surface"
          >
            <span className="rounded bg-green-50 px-2 py-0.5 font-mono text-xs font-bold text-green-800">
              {m}
            </span>
            <code className="font-mono">{path}</code>
            <span className="ml-auto text-muted">{label}</span>
          </a>
        ))}
      </div>
    </>
  );
}
