// Minimal catalogue + operator accounts for browser tests. Only ever runs against a *_test database.
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import { foldForSearch } from "../../src/lib/i18n/config";

export const fixture = {
  sku: "E2E-1-JKT-001",
  slugs: {
    az: "e2e-is-godekchesi",
    en: "e2e-work-jacket",
    ru: "e2e-rabochaya-kurtka",
  },
  names: {
    az: "E2E iş gödəkçəsi",
    en: "E2E work jacket",
    ru: "E2E рабочая куртка",
  },
  admin: { email: "admin@e2e.test", password: "e2e-admin-password-123" },
  demo: { email: "demo@e2e.test", password: "e2e-demo-password-123" },
};

export function testPool() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test"))
    throw new Error("Use an isolated _test database");
  return new Pool({ connectionString: url });
}

export async function seed(pool: Pool) {
  const c = await pool.connect();
  try {
    await c.query("begin");
    // Test DB only: repeated local runs would otherwise hit Better Auth's sign-in rate limit.
    await c.query("delete from rate_limit");
    const cat = await c.query(
      `insert into category (kind, key, position) values ('industry','construction',0) on conflict (kind, key) do update set position = 0 returning id`,
    );
    const type = await c.query(
      `insert into category (kind, key, position) values ('type','jackets',1) on conflict (kind, key) do update set position = 1 returning id`,
    );
    for (const [id, names] of [
      [
        cat.rows[0].id,
        {
          az: "Tikinti və ağır sənaye",
          en: "Construction & heavy industry",
          ru: "Строительство",
        },
      ],
      [type.rows[0].id, { az: "Gödəkçələr", en: "Jackets", ru: "Куртки" }],
    ] as const)
      for (const [l, n] of Object.entries(names))
        await c.query(
          `insert into category_translation (category_id, locale, name, slug) values ($1,$2,$3,$4) on conflict do nothing`,
          [
            id,
            l,
            n,
            n
              .toLowerCase()
              .replace(/[^a-z]+/g, "-")
              .replace(/^-|-$/g, "") || `c${id}${l}`,
          ],
        );
    const p = await c.query(
      `insert into product (sku, status, price_amount, colors) values ($1,'published',39,'{blue,gray}')
       on conflict (sku) do update set status='published' returning id`,
      [fixture.sku],
    );
    const pid = p.rows[0].id;
    for (const l of ["az", "en", "ru"] as const)
      await c.query(
        `insert into product_translation (product_id, locale, name, slug, short_description, description_html, status, search_text)
         values ($1,$2,$3,$4,'Fixture product.','<p>Fixture.</p>','source',$5)
         on conflict (product_id, locale) do update set name = excluded.name, search_text = excluded.search_text`,
        [
          pid,
          l,
          fixture.names[l],
          fixture.slugs[l],
          foldForSearch(fixture.names[l]),
        ],
      );
    await c.query(
      `insert into product_category values ($1,$2),($1,$3) on conflict do nothing`,
      [pid, cat.rows[0].id, type.rows[0].id],
    );
    await c.query(
      `insert into redirect (from_path, to_path, status_code, source) values ('/product/e2e-legacy', $1, 301, 'e2e') on conflict (from_path) do nothing`,
      [`/en/product/${fixture.slugs.en}`],
    );
    await c.query(
      `insert into redirect (from_path, to_path, status_code, source) values ('/demo-blog-post', '', 410, 'e2e') on conflict (from_path) do nothing`,
    );
    for (const [u, role] of [
      [fixture.admin, "admin"],
      [fixture.demo, "demo_viewer"],
    ] as const) {
      const existing = await c.query(`select id from "user" where email = $1`, [
        u.email,
      ]);
      if (existing.rowCount) continue;
      const id = randomUUID();
      await c.query(
        `insert into "user" (id, name, email, email_verified, role) values ($1,$2,$3,true,$4)`,
        [id, role, u.email, role],
      );
      await c.query(
        `insert into account (id, account_id, provider_id, user_id, password) values ($1,$2,'credential',$2,$3)`,
        [randomUUID(), id, await hashPassword(u.password)],
      );
    }
    await c.query("commit");
    return pid as number;
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}
