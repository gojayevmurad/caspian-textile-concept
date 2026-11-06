import "server-only";
import { company } from "@/src/config/company";
import { localePath } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import { getCatalog, getCategories } from "@/src/lib/catalog/queries";
import { siteUrl } from "@/src/lib/seo/metadata";

/** llms.txt (https://llmstxt.org) generated from the live database — never stale. */
export async function buildLlmsTxt(full: boolean) {
  const base = siteUrl();
  const t = getDictionary("en");
  const [categories, catalog] = await Promise.all([
    getCategories("en"),
    getCatalog("en"),
  ]);
  const industries = categories.filter(
    (c) => c.kind === "industry" && c.count > 0,
  );
  const types = categories.filter((c) => c.kind === "type" && c.count > 0);
  const lines = [
    `# ${company.name}`,
    "",
    `> ${t.meta.description}`,
    "",
    "Note: this is a concept demo of a rebuilt website, not the official Caspian Textile site.",
    "",
    "## Company",
    "",
    `- Legal name: ${company.legalName}`,
    `- Factory: ${company.factory.address.en} (${company.factory.geo.lat}, ${company.factory.geo.lng})`,
    `- Head office: ${company.office.address.en}`,
    `- Phone: ${company.factory.phones.join(", ")}; ${company.office.phones.join(", ")}`,
    `- Email: ${company.email}`,
    `- Capabilities: ${t.about.capabilityList.join("; ")}`,
    `- Languages: Azerbaijani (default), English (/en), Russian (/ru)`,
    "",
    "## Key pages",
    "",
    `- [Catalogue](${base}${localePath("en", "catalog")}): ${catalog.length} products`,
    `- [Industries](${base}${localePath("en", "industries")})`,
    `- [Request a quote](${base}${localePath("en", "quote")}): bulk orders with sizes, colours and logo`,
    `- [About](${base}${localePath("en", "about")})`,
    `- [Contact](${base}${localePath("en", "contact")})`,
    "",
    "## Industries",
    "",
    ...industries.map(
      (c) =>
        `- [${c.name}](${base}${localePath("en", "industries", c.slug)}): ${c.count} products${c.description ? ` — ${c.description}` : ""}`,
    ),
    "",
    "## Product types",
    "",
    ...types.map((c) => `- ${c.name} (${c.count})`),
    "",
  ];
  if (full) {
    lines.push("## Products", "");
    for (const p of catalog)
      lines.push(
        `- [${p.name}](${base}${localePath("en", "product", p.slug)}) — SKU ${p.sku}${p.price ? `, from ${p.price} ${p.currency}` : ""}. ${p.summary}`,
      );
    lines.push("");
  } else {
    lines.push(
      "## Optional",
      "",
      `- [Full product list](${base}/llms-full.txt)`,
      `- [Sitemap](${base}/sitemap.xml)`,
      "",
    );
  }
  return lines.join("\n");
}
