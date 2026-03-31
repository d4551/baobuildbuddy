import type { JobTaxonomyKeywordCategory, StudioType } from "@bao/shared";
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const jobTaxonomyKeywords = sqliteTable(
  "job_taxonomy_keywords",
  {
    id: text("id").primaryKey(),
    category: text("category").$type<JobTaxonomyKeywordCategory>().notNull(),
    label: text("label").notNull(),
    synonyms: text("synonyms", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    sortOrder: integer("sort_order").notNull().default(0),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [
    index("job_taxonomy_keywords_category_idx").on(table.category, table.sortOrder),
    index("job_taxonomy_keywords_enabled_idx").on(table.enabled),
  ],
);

export const studioClassificationRules = sqliteTable(
  "studio_classification_rules",
  {
    id: text("id").primaryKey(),
    studioType: text("studio_type").$type<StudioType>().notNull(),
    keyword: text("keyword").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [
    index("studio_classification_rules_type_idx").on(table.studioType, table.sortOrder),
    index("studio_classification_rules_enabled_idx").on(table.enabled),
  ],
);
