// Redirect lookup used by the proxy. Deliberately independent of "server-only" modules:
// the proxy runs outside the React Server Components graph. Small table → in-memory cache.
import { Pool } from "pg";
import { localePath, type Locale } from "@/src/lib/i18n/config";

type Entry = { to: string; status: number; id: number };
type CategoryEntry = {
  kind: string;
  key: string;
  slugs: Partial<Record<Locale, string>>;
};
type Table = {
  exact: Map<string, Entry>;
  legacyCategory: Map<string, CategoryEntry>;
  loadedAt: number;
};

const TTL_MS = 60_000;
let pool: Pool | undefined;
let table: Table | undefined;
let loading: Promise<Table> | undefined;

function getPool() {
  if (!process.env.DATABASE_URL) return undefined;
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 3_000,
  }));
}

export const normalizePath = (p: string) => {
  let out = p;
  try {
    out = decodeURIComponent(p);
  } catch {}
  out = out.replace(/\/+$/, "").toLowerCase();
  return out || "/";
};

async function load(): Promise<Table> {
  const p = getPool();
  const exact = new Map<string, Entry>();
  const legacyCategory = new Map<string, CategoryEntry>();
  if (p) {
    const r = await p.query<{
      id: number;
      from_path: string;
      to_path: string;
      status_code: number;
    }>("select id, from_path, to_path, status_code from redirect");
    for (const row of r.rows)
      exact.set(normalizePath(row.from_path), {
        to: row.to_path,
        status: row.status_code,
        id: row.id,
      });
    const c = await p.query<{
      kind: string;
      key: string;
      legacy_slugs: string[];
      locale: Locale;
      slug: string;
    }>(
      "select c.kind, c.key, c.legacy_slugs, t.locale, t.slug from category c join category_translation t on t.category_id = c.id",
    );
    for (const row of c.rows)
      for (const legacy of row.legacy_slugs) {
        const k = normalizePath(legacy);
        const e = legacyCategory.get(k) ?? {
          kind: row.kind,
          key: row.key,
          slugs: {},
        };
        if (e.key === row.key) e.slugs[row.locale] = row.slug;
        legacyCategory.set(k, e);
      }
  }
  return { exact, legacyCategory, loadedAt: Date.now() };
}

export async function getRedirectTable(): Promise<Table> {
  if (table && Date.now() - table.loadedAt < TTL_MS) return table;
  loading ??= load()
    .then((t) => (table = t))
    .catch(
      () =>
        table ?? {
          exact: new Map(),
          legacyCategory: new Map(),
          loadedAt: Date.now(),
        },
    )
    .finally(() => (loading = undefined));
  return loading;
}

export function invalidateRedirects() {
  table = undefined;
}

export function recordHit(id: number) {
  getPool()
    ?.query("update redirect set hits = hits + 1 where id = $1", [id])
    .catch(() => {});
}

/** Resolve a legacy (old WordPress) URL. Returns null when nothing matches. */
export async function resolveLegacy(
  pathname: string,
): Promise<{ to: string; status: number; id?: number } | null> {
  const path = normalizePath(pathname);
  const t = await getRedirectTable();
  const hit = t.exact.get(path);
  if (hit) return hit;
  // /product-category/<parent>/<slug>/ in en, /az/…, /ru/…
  const m = path.match(/^(?:\/(az|ru))?\/product-category\/(?:.+\/)?([^/]+)$/);
  if (m) {
    const locale = (m[1] as Locale | undefined) ?? "en";
    const cat = t.legacyCategory.get(m[2]);
    if (cat) {
      const slug = cat.slugs[locale] ?? cat.slugs.en;
      if (cat.kind === "industry" && slug)
        return { to: localePath(locale, "industries", slug), status: 301 };
      return {
        to: `${localePath(locale, "catalog")}?${cat.kind}=${encodeURIComponent(cat.key)}`,
        status: 301,
      };
    }
    return { to: localePath(locale, "catalog"), status: 301 };
  }
  const shop = path.match(
    /^(?:\/(az|ru))?\/(shop|cart|checkout|wishlist|compare|my-account)(?:\/.*)?$/,
  );
  if (shop) {
    const locale = (shop[1] as Locale | undefined) ?? "en";
    const target =
      shop[2] === "cart" || shop[2] === "checkout"
        ? "quote"
        : shop[2] === "compare"
          ? "compare"
          : "catalog";
    return { to: localePath(locale, target), status: 301 };
  }
  if (
    /^\/(wp-content|wp-json|wp-admin|feed|xmlrpc\.php|wp-login\.php)(\/|$)/.test(
      path,
    )
  )
    return { to: "", status: 410 };
  return null;
}
