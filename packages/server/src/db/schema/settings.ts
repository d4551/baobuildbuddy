import { LOCAL_AI_DEFAULT_ENDPOINT, LOCAL_AI_DEFAULT_MODEL, THEME_NAMES } from "@navi/shared";
import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().default("default"),
  geminiApiKey: text("gemini_api_key"),
  openaiApiKey: text("openai_api_key"),
  claudeApiKey: text("claude_api_key"),
  huggingfaceToken: text("huggingface_token"),
  localModelEndpoint: text("local_model_endpoint").default(LOCAL_AI_DEFAULT_ENDPOINT),
  localModelName: text("local_model_name").default(LOCAL_AI_DEFAULT_MODEL),
  preferredProvider: text("preferred_provider").default("local"),
  preferredModel: text("preferred_model"),
  theme: text("theme").default(THEME_NAMES.light),
  language: text("language").default("en"),
  notifications: text("notifications", { mode: "json" })
    .$type<Record<string, boolean>>()
    .default(sql`'{"achievements":true,"dailyChallenges":true,"levelUp":true,"jobAlerts":true}'`),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
