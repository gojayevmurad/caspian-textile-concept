import { getCatalog } from "@/src/lib/catalog/queries";
import { error, headers, langOf, productDto } from "@/src/lib/api/v1";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = langOf(url);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? 24) || 24),
  );
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);
  const filters = {
    industry: url.searchParams.get("industry"),
    type: url.searchParams.get("type"),
    feature: url.searchParams.get("feature"),
  };
  const q = url.searchParams.get("q")?.toLowerCase().trim();
  if (q && q.length > 80) return error(400, "q too long");
  let list = await getCatalog(lang);
  for (const [k, v] of Object.entries(filters))
    if (v) list = list.filter((p) => p.categories.includes(`${k}:${v}`));
  if (q)
    list = list.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q));
  return Response.json(
    {
      lang,
      total: list.length,
      limit,
      offset,
      data: list.slice(offset, offset + limit).map((p) => productDto(p, lang)),
    },
    { headers },
  );
}
