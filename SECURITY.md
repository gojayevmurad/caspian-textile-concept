# Security

Report suspected issues privately to the product maintainer; configure a real security contact before publication. Do not attach credentials or personal records to public issues.

## Assumptions

Caddy terminates TLS. Only trusted Caddy can reach the application, and PostgreSQL is never publicly exposed. Independent products have unique auth secrets, databases, volumes, Compose project names and proxy aliases. The shared proxy network is a trust boundary: other containers on it can reach app ports, so do not run untrusted workloads there.

Better Auth owns password hashing, secure HTTP-only cookies, SameSite behavior, origin checks, reset/verification tokens and sessions. HTTPS enables secure cookies. Email verification is required. Five-minute fresh sessions and password confirmation guard deletion. Connected billing accounts require support review before deletion. Optional Google OAuth stays disabled until both credentials exist.

Every protected page checks the session on the server. Checkout/portal additionally check verified identity and exact Origin. No middleware-only authorization. Do not relax Better Auth's CSRF checks. Caddy must overwrite forwarded IP headers (not trust arbitrary client values); review rate limiting behind your actual proxy.

## Before launch review

- Replace example auth secret; use HTTPS and verified Resend domain. Keep credentials outside Git and Docker layers.
- Confirm auth session cookie flags, verification/reset expiry, password reset revocation, session revocation and deletion with browser tests.
- Test forged/duplicate/old webhooks, mismatched customer IDs, failed reconciliation and lease expiration. Never grant from a browser success URL.
- Review legal/consent pages. No claim of legal compliance is supplied.
- Run dependency/security checks and review changes to transitive overrides and CI actions.
- Back up PostgreSQL off-server; test restoration. Use a migration role with DDL permissions and a restricted runtime role where practical.
- Review database retention: IPs/user agents in sessions, account tokens, development inbox links, event IDs and billing records.
- Restrict SSH, pin host keys, protect production environment, and limit GHCR credentials.

Headers deny framing, MIME sniffing, camera, microphone and geolocation. A restrictive CSP is product-specific and not enabled; test a nonce-based policy with Next.js, Polar and your monitoring hosts before rollout. HSTS belongs at the TLS proxy after domain readiness.

Pino redacts known sensitive fields; callers must not embed secrets inside message strings or log arbitrary request bodies. Logs go to stdout. Sentry strips request/user/breadcrumb data before error delivery and samples traces conservatively; exception messages and performance metadata still require review against real product data. Sentry errors and Pino operational logs have distinct purposes.

No real secrets are committed. Development inbox URLs are never printed to application logs and only accessible through a local CLI. The CLI must not be used on production databases. There is no production demo login, payment bypass or test-only authorization endpoint.

## Caspian Textile concept additions

- **Roles:** `admin`, `demo_viewer`, `customer`. Every admin page calls `requireRole`; every write goes through `mutate()` → `requireWriter()` (403 for non-admins), writes an audit log entry, invalidates the catalogue cache and purges the CDN. E2E proves a demo user who removes the `disabled` attribute still cannot write.
- **Demo account** (deliberate deviation from "no production demo login"): created only via `pnpm admin:create-demo`; read-only; PII masked; users list hidden; rotate with `--rotate-password` (also revokes sessions). Public sign-up is disabled.
- **RFQ endpoint:** same-origin check, Zod schema with honeypot and consent, 5 requests/hour per salted IP hash, 8 MB logo limit, magic-byte type sniffing (PNG/JPEG/WebP/AVIF only — no SVG), re-encoding through sharp (drops EXIF/GPS). Product names/SKUs are resolved server-side.
- **HTML:** product descriptions are sanitized on import and on every admin save (tag allow-list, no attributes).
- **CSV export:** formula-injection neutralized; masked for the demo role.
- **CSP:** source-restricting without nonces to keep ISR/CDN caching (see DECISIONS.md §4).
- **Proxy:** Caddy must pass Cloudflare's `CF-Connecting-IP` as `X-Forwarded-For` (see `deploy/Caddyfile.example`); rate limiting depends on it.
- **Demo isolation:** `SITE_INDEXABLE=false` (noindex everywhere); RFQ notifications go only to `NOTIFY_EMAIL` (the applicant), never to the company.
