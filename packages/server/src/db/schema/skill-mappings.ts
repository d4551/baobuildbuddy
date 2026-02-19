import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const skillMappings = sqliteTable("skill_mappings", {
  id: text("id").primaryKey(),
  gameExpression: text("game_expression").notNull(),
  transferableSkill: text("transferable_skill").notNull(),
  industryApplications: text("industry_applications", { mode: "json" })
    .$type<string[]>()
    .default(sql`'[]'`),
  evidence: text("evidence", { mode: "json" }).$type<unknown[]>().default(sql`'[]'`),
  confidence: integer("confidence").default(50),
  category: text("category"),
  demandLevel: text("demand_level").default("medium"),
  aiGenerated: integer("ai_generated", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
