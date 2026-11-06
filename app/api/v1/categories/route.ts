import { getCategories } from "@/src/lib/catalog/queries";
import { headers, langOf } from "@/src/lib/api/v1";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = langOf(url);
  const kind = url.searchParams.get("kind");
  const data = (await getCategories(lang))
    .filter((c) => !kind || c.kind === kind)
    .map((c) => ({
      kind: c.kind,
      key: c.key,
      name: c.name,
      slug: c.slug,
      description: c.description,
      productCount: c.count,
    }));
  return Response.json({ lang, data }, { headers });
}
