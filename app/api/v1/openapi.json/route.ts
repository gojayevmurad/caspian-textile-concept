import { siteUrl } from "@/src/lib/seo/metadata";

export function GET() {
  const lang = {
    name: "lang",
    in: "query",
    schema: { type: "string", enum: ["az", "en", "ru"], default: "az" },
  };
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Caspian Textile Catalogue API (concept)",
      version: "1.0.0",
      description:
        "Read-only public catalogue API. Same data as the website; ready for a mobile (React Native) client or partner integrations.",
    },
    servers: [{ url: `${siteUrl()}/api/v1` }],
    paths: {
      "/products": {
        get: {
          summary: "List products",
          parameters: [
            lang,
            ...["industry", "type", "feature", "q"].map((name) => ({
              name,
              in: "query",
              schema: { type: "string" },
            })),
            {
              name: "limit",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 24,
              },
            },
            {
              name: "offset",
              in: "query",
              schema: { type: "integer", minimum: 0, default: 0 },
            },
          ],
          responses: {
            "200": {
              description: "Product page",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProductList" },
                },
              },
            },
          },
        },
      },
      "/products/{sku}": {
        get: {
          summary: "Get one product",
          parameters: [
            {
              name: "sku",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            lang,
          ],
          responses: {
            "200": {
              description: "Product",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Product" },
                },
              },
            },
            "404": { description: "Not found" },
          },
        },
      },
      "/categories": {
        get: {
          summary: "List industries, product types and features",
          parameters: [
            lang,
            {
              name: "kind",
              in: "query",
              schema: { type: "string", enum: ["industry", "type", "feature"] },
            },
          ],
          responses: { "200": { description: "Categories" } },
        },
      },
    },
    components: {
      schemas: {
        Product: {
          type: "object",
          required: ["sku", "name", "url"],
          properties: {
            sku: { type: "string" },
            name: { type: "string" },
            summary: { type: "string" },
            url: { type: "string", format: "uri" },
            translationStatus: {
              type: "string",
              enum: ["source", "ai_draft", "approved", "untranslated"],
            },
            price: {
              type: ["object", "null"],
              properties: {
                amount: { type: "number" },
                currency: { type: "string" },
                note: { type: "string" },
              },
            },
            colors: { type: "array", items: { type: "string" } },
            industries: { type: "array", items: { type: "string" } },
            types: { type: "array", items: { type: "string" } },
            features: { type: "array", items: { type: "string" } },
            image: {
              type: ["object", "null"],
              additionalProperties: { type: "string", format: "uri" },
            },
          },
        },
        ProductList: {
          type: "object",
          properties: {
            lang: { type: "string" },
            total: { type: "integer" },
            limit: { type: "integer" },
            offset: { type: "integer" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Product" },
            },
          },
        },
      },
    },
  };
  return Response.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
