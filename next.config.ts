import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["pino", "pino-pretty", "pg", "sharp"],
  experimental: { globalNotFound: true },
  // Trailing slashes are handled in proxy.ts so legacy URLs resolve in a single 301 hop.
  skipTrailingSlashRedirect: true,
  // Files read from disk at runtime must be traced into the standalone output.
  outputFileTracingIncludes: {
    "/api/spec/**": ["./src/assets/fonts/**", "./public/brand/logo.png"],
    "/**/opengraph-image": ["./public/brand/logo.png"],
  },
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
});
