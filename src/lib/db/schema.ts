import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  index,
  serial,
  numeric,
  primaryKey,
  check,
  uniqueIndex,
  jsonb,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
const time = (name: string) => timestamp(name, { withTimezone: true });
export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    analyticsConsent: boolean("analytics_consent").notNull().default(false),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: text("role").notNull().default("customer"),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("user_role_idx").on(t.role),
    check(
      "user_role_check",
      sql`${t.role} in ('admin', 'demo_viewer', 'customer')`,
    ),
  ],
);
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    expiresAt: time("expires_at").notNull(),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: time("access_token_expires_at"),
    refreshTokenExpiresAt: time("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("account_user_idx").on(t.userId),
    uniqueIndex("account_provider_unique").on(t.providerId, t.accountId),
  ],
);
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: time("expires_at").notNull(),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const billingCustomer = pgTable("billing_customer", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  customerId: text("customer_id").unique(),
  syncedAt: time("synced_at"),
});
export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    status: text("status").notNull(),
    periodEnd: time("period_end").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  },
  (t) => [index("subscription_user_idx").on(t.userId)],
);
export const entitlement = pgTable("entitlement", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  pro: boolean("pro").notNull().default(false),
  validUntil: time("valid_until").notNull(),
  source: text("source").notNull(),
});
export const processedEvent = pgTable("processed_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: time("processed_at").notNull().defaultNow(),
});
export const emailPreview = pgTable("email_preview", {
  id: text("id").primaryKey(),
  recipient: text("recipient").notNull(),
  kind: text("kind").notNull(),
  url: text("url").notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const appConfig = pgTable("app_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const analyticsOutbox = pgTable(
  "analytics_outbox",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    sentAt: time("sent_at"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [index("outbox_pending_idx").on(t.userId, t.sentAt)],
);

// ---------------------------------------------------------------------------
// Catalogue (Caspian Textile concept)
// ---------------------------------------------------------------------------
const localeCheck = (name: string, column: AnyPgColumn) =>
  check(name, sql`${column} in ('az', 'en', 'ru')`);

export const media = pgTable(
  "media",
  {
    id: serial("id").primaryKey(),
    hash: text("hash").notNull(),
    originalName: text("original_name").notNull(),
    sourceUrl: text("source_url"),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    color: text("color").notNull(),
    blur: text("blur").notNull(),
    // [{ format: 'avif' | 'webp', width: number, path: string, bytes: number }]
    variants: jsonb("variants").notNull(),
    alt: jsonb("alt").notNull().default({}),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("media_hash_unique").on(t.hash)],
);

export const category = pgTable(
  "category",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull(),
    key: text("key").notNull(),
    parentId: integer("parent_id"),
    position: integer("position").notNull().default(0),
    icon: text("icon"),
    mediaId: integer("media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    legacySlugs: text("legacy_slugs")
      .array()
      .notNull()
      .default(sql`'{}'`),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("category_kind_key_unique").on(t.kind, t.key),
    check(
      "category_kind_check",
      sql`${t.kind} in ('industry', 'type', 'feature')`,
    ),
  ],
);

export const categoryTranslation = pgTable(
  "category_translation",
  {
    categoryId: integer("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    status: text("status").notNull().default("source"),
  },
  (t) => [
    primaryKey({ columns: [t.categoryId, t.locale] }),
    uniqueIndex("category_translation_slug_unique").on(t.locale, t.slug),
    localeCheck("category_translation_locale_check", t.locale),
  ],
);

export const product = pgTable(
  "product",
  {
    id: serial("id").primaryKey(),
    sku: text("sku").notNull(),
    status: text("status").notNull().default("draft"),
    brand: text("brand"),
    priceAmount: numeric("price_amount", { precision: 12, scale: 2 }),
    currency: text("currency").notNull().default("AZN"),
    colors: text("colors")
      .array()
      .notNull()
      .default(sql`'{}'`),
    sizes: text("sizes")
      .array()
      .notNull()
      .default(sql`'{}'`),
    standards: text("standards")
      .array()
      .notNull()
      .default(sql`'{}'`),
    minOrder: integer("min_order"),
    leadTimeDays: integer("lead_time_days"),
    featured: boolean("featured").notNull().default(false),
    position: integer("position").notNull().default(0),
    legacyIds: integer("legacy_ids")
      .array()
      .notNull()
      .default(sql`'{}'`),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("product_sku_unique").on(t.sku),
    index("product_status_created_idx").on(t.status, t.createdAt, t.id),
    check(
      "product_status_check",
      sql`${t.status} in ('draft', 'published', 'archived')`,
    ),
  ],
);

export const productTranslation = pgTable(
  "product_translation",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description").notNull().default(""),
    descriptionHtml: text("description_html").notNull().default(""),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    // source = imported from the live site, ai_draft = machine draft awaiting review,
    // approved = reviewed by an admin, untranslated = falls back to English text
    status: text("status").notNull().default("source"),
    legacyUrl: text("legacy_url"),
    searchText: text("search_text").notNull().default(""),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.locale] }),
    uniqueIndex("product_translation_slug_unique").on(t.locale, t.slug),
    index("product_translation_search_trgm_idx").using(
      "gin",
      sql`${t.searchText} gin_trgm_ops`,
    ),
    localeCheck("product_translation_locale_check", t.locale),
    check(
      "product_translation_status_check",
      sql`${t.status} in ('source', 'ai_draft', 'approved', 'untranslated')`,
    ),
  ],
);

export const productCategory = pgTable(
  "product_category",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.categoryId] }),
    index("product_category_category_idx").on(t.categoryId),
  ],
);

export const productMedia = pgTable(
  "product_media",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    position: integer("position").notNull().default(0),
    color: text("color"),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.mediaId] }),
    index("product_media_media_idx").on(t.mediaId),
  ],
);

export const rfq = pgTable(
  "rfq",
  {
    id: text("id").primaryKey(),
    number: serial("number").notNull(),
    kind: text("kind").notNull().default("quote"),
    status: text("status").notNull().default("new"),
    locale: text("locale").notNull(),
    company: text("company").notNull(),
    contactName: text("contact_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    taxId: text("tax_id"),
    country: text("country"),
    message: text("message"),
    targetDate: text("target_date"),
    logoMediaId: integer("logo_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    // { placement: 'chest-left' | ..., scale: number, method: 'embroidery' | 'print' }
    branding: jsonb("branding"),
    assignee: text("assignee"),
    internalNotes: text("internal_notes"),
    ipHash: text("ip_hash"),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("rfq_number_unique").on(t.number),
    index("rfq_status_created_idx").on(t.status, t.createdAt, t.id),
    index("rfq_created_idx").on(t.createdAt, t.id),
    check("rfq_kind_check", sql`${t.kind} in ('quote', 'sample')`),
    check(
      "rfq_status_check",
      sql`${t.status} in ('new', 'in_review', 'quoted', 'won', 'lost')`,
    ),
  ],
);

export const rfqItem = pgTable(
  "rfq_item",
  {
    id: serial("id").primaryKey(),
    rfqId: text("rfq_id")
      .notNull()
      .references(() => rfq.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => product.id, {
      onDelete: "set null",
    }),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    // [{ size: string | null, color: string | null, qty: number }]
    matrix: jsonb("matrix").notNull(),
    totalQty: integer("total_qty").notNull(),
    note: text("note"),
  },
  (t) => [index("rfq_item_rfq_idx").on(t.rfqId)],
);

export const redirect = pgTable(
  "redirect",
  {
    id: serial("id").primaryKey(),
    fromPath: text("from_path").notNull(),
    toPath: text("to_path").notNull(),
    statusCode: integer("status_code").notNull().default(301),
    hits: integer("hits").notNull().default(0),
    source: text("source").notNull().default("manual"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("redirect_from_unique").on(t.fromPath),
    check(
      "redirect_status_check",
      sql`${t.statusCode} in (301, 302, 308, 410)`,
    ),
  ],
);

export const contentBlock = pgTable(
  "content_block",
  {
    key: text("key").notNull(),
    locale: text("locale").notNull(),
    data: jsonb("data").notNull(),
    status: text("status").notNull().default("source"),
    updatedAt: time("updated_at").notNull().defaultNow(),
    updatedBy: text("updated_by"),
  },
  (t) => [
    primaryKey({ columns: [t.key, t.locale] }),
    localeCheck("content_block_locale_check", t.locale),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    diff: jsonb("diff"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt, t.id)],
);
