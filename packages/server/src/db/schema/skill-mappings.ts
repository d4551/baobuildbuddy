import { COUNT_FIFTY } from "@bao/shared/constants/numeric";
import type { SkillEvidence } from "@bao/shared/types/skill-mapping";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { TIMESTAMP_DEFAULT } from "./column-defaults";

const EMPTY_JSON_ARRAY = sql`'[]'`;

export const skillMappings = sqliteTable("skill_mappings", {
  id: text("id").primaryKey(),
  gameExpression: text("game_expression").notNull(),
  transferableSkill: text("transferable_skill").notNull(),
  industryApplications: text("industry_applications", { mode: "json" })
    .$type<string[]>()
    .default(EMPTY_JSON_ARRAY),
  evidence: text("evidence", { mode: "json" }).$type<SkillEvidence[]>().default(EMPTY_JSON_ARRAY),
  confidence: integer("confidence").default(COUNT_FIFTY),
  category: text("category"),
  demandLevel: text("demand_level").default("medium"),
  aiGenerated: integer("ai_generated", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull().default(TIMESTAMP_DEFAULT),
  updatedAt: text("updated_at").notNull().default(TIMESTAMP_DEFAULT),
});
