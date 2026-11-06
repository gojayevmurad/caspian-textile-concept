CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"diff" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"parent_id" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"icon" text,
	"media_id" integer,
	"legacy_slugs" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_kind_check" CHECK ("category"."kind" in ('industry', 'type', 'feature'))
);
--> statement-breakpoint
CREATE TABLE "category_translation" (
	"category_id" integer NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"seo_title" text,
	"seo_description" text,
	"status" text DEFAULT 'source' NOT NULL,
	CONSTRAINT "category_translation_category_id_locale_pk" PRIMARY KEY("category_id","locale"),
	CONSTRAINT "category_translation_locale_check" CHECK ("category_translation"."locale" in ('az', 'en', 'ru'))
);
--> statement-breakpoint
CREATE TABLE "content_block" (
	"key" text NOT NULL,
	"locale" text NOT NULL,
	"data" jsonb NOT NULL,
	"status" text DEFAULT 'source' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "content_block_key_locale_pk" PRIMARY KEY("key","locale"),
	CONSTRAINT "content_block_locale_check" CHECK ("content_block"."locale" in ('az', 'en', 'ru'))
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"hash" text NOT NULL,
	"original_name" text NOT NULL,
	"source_url" text,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"color" text NOT NULL,
	"blur" text NOT NULL,
	"variants" jsonb NOT NULL,
	"alt" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"brand" text,
	"price_amount" numeric(12, 2),
	"currency" text DEFAULT 'AZN' NOT NULL,
	"colors" text[] DEFAULT '{}' NOT NULL,
	"sizes" text[] DEFAULT '{}' NOT NULL,
	"standards" text[] DEFAULT '{}' NOT NULL,
	"min_order" integer,
	"lead_time_days" integer,
	"featured" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"legacy_ids" integer[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_status_check" CHECK ("product"."status" in ('draft', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "product_category" (
	"product_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "product_category_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"product_id" integer NOT NULL,
	"media_id" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"color" text,
	CONSTRAINT "product_media_product_id_media_id_pk" PRIMARY KEY("product_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "product_translation" (
	"product_id" integer NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"short_description" text DEFAULT '' NOT NULL,
	"description_html" text DEFAULT '' NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"status" text DEFAULT 'source' NOT NULL,
	"legacy_url" text,
	"search_text" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_translation_product_id_locale_pk" PRIMARY KEY("product_id","locale"),
	CONSTRAINT "product_translation_locale_check" CHECK ("product_translation"."locale" in ('az', 'en', 'ru')),
	CONSTRAINT "product_translation_status_check" CHECK ("product_translation"."status" in ('source', 'ai_draft', 'approved', 'untranslated'))
);
--> statement-breakpoint
CREATE TABLE "redirect" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirect_status_check" CHECK ("redirect"."status_code" in (301, 302, 308, 410))
);
--> statement-breakpoint
CREATE TABLE "rfq" (
	"id" text PRIMARY KEY NOT NULL,
	"number" serial NOT NULL,
	"kind" text DEFAULT 'quote' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"locale" text NOT NULL,
	"company" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"tax_id" text,
	"country" text,
	"message" text,
	"target_date" text,
	"logo_media_id" integer,
	"branding" jsonb,
	"assignee" text,
	"internal_notes" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rfq_kind_check" CHECK ("rfq"."kind" in ('quote', 'sample')),
	CONSTRAINT "rfq_status_check" CHECK ("rfq"."status" in ('new', 'in_review', 'quoted', 'won', 'lost'))
);
--> statement-breakpoint
CREATE TABLE "rfq_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfq_id" text NOT NULL,
	"product_id" integer,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"matrix" jsonb NOT NULL,
	"total_qty" integer NOT NULL,
	"note" text
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'customer' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_translation" ADD CONSTRAINT "category_translation_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_translation" ADD CONSTRAINT "product_translation_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_logo_media_id_media_id_fk" FOREIGN KEY ("logo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_item" ADD CONSTRAINT "rfq_item_rfq_id_rfq_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfq"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_item" ADD CONSTRAINT "rfq_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "category_kind_key_unique" ON "category" USING btree ("kind","key");--> statement-breakpoint
CREATE UNIQUE INDEX "category_translation_slug_unique" ON "category_translation" USING btree ("locale","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "media_hash_unique" ON "media" USING btree ("hash");--> statement-breakpoint
CREATE UNIQUE INDEX "product_sku_unique" ON "product" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_status_created_idx" ON "product" USING btree ("status","created_at","id");--> statement-breakpoint
CREATE INDEX "product_category_category_idx" ON "product_category" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_media_media_idx" ON "product_media" USING btree ("media_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_translation_slug_unique" ON "product_translation" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX "product_translation_search_trgm_idx" ON "product_translation" USING gin ("search_text" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "redirect_from_unique" ON "redirect" USING btree ("from_path");--> statement-breakpoint
CREATE UNIQUE INDEX "rfq_number_unique" ON "rfq" USING btree ("number");--> statement-breakpoint
CREATE INDEX "rfq_status_created_idx" ON "rfq" USING btree ("status","created_at","id");--> statement-breakpoint
CREATE INDEX "rfq_created_idx" ON "rfq" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "rfq_item_rfq_idx" ON "rfq_item" USING btree ("rfq_id");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_check" CHECK ("user"."role" in ('admin', 'demo_viewer', 'customer'));