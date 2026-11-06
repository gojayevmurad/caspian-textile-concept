import type { MetadataRoute } from "next";
import { indexable, siteUrl } from "@/src/lib/seo/metadata";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  if (!indexable()) {
    // Concept demo: keep it out of search engines entirely.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  const disallow = [
    "/api/",
    "/admin",
    "/sign-in",
    "/settings",
    "/billing",
    "/dashboard",
    "/*?*sort=",
  ];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Explicitly welcome AI/answer-engine crawlers (GEO): they get full server-rendered HTML.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "Bingbot",
        ],
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
