import {
  AI_PROVIDER_DEFAULT_ORDER,
  DEFAULT_AI_ROUTING,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
} from "@bao/shared/constants/ai-provider";
import { DEFAULT_BRAND_SETTINGS, THEME_NAMES } from "@bao/shared/tokens/branding";
import type { AIRouting } from "@bao/shared/types/ai";
import type {
  AutomationSettings,
  EmailTransportSettings,
} from "@bao/shared/types/settings-contracts";
import {
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_SETTINGS_ID,
} from "@bao/shared/types/settings-defaults";
import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { TIMESTAMP_DEFAULT } from "./column-defaults";

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().default(DEFAULT_SETTINGS_ID),
  geminiApiKey: text("gemini_api_key"),
  openaiApiKey: text("openai_api_key"),
  claudeApiKey: text("claude_api_key"),
  huggingfaceToken: text("huggingface_token"),
  localModelEndpoint: text("local_model_endpoint").default(LOCAL_AI_DEFAULT_ENDPOINT),
  localModelName: text("local_model_name").default(LOCAL_AI_DEFAULT_MODEL),
  aiRouting: text("ai_routing", { mode: "json" })
    .$type<AIRouting>()
    .default(sql.raw(`'${JSON.stringify(DEFAULT_AI_ROUTING).replaceAll("'", "''")}'`)),
  preferredProvider: text("preferred_provider").default(AI_PROVIDER_DEFAULT_ORDER[0]),
  preferredModel: text("preferred_model"),
  theme: text("theme").default(THEME_NAMES.light),
  language: text("language").default("en-US"),
  brandSettings: text("brand_settings", { mode: "json" })
    .$type<typeof DEFAULT_BRAND_SETTINGS>()
    .default(sql.raw(`'${JSON.stringify(DEFAULT_BRAND_SETTINGS).replaceAll("'", "''")}'`)),
  notifications: text("notifications", { mode: "json" })
    .$type<Record<string, boolean>>()
    .default(
      sql.raw(`'${JSON.stringify(DEFAULT_NOTIFICATION_PREFERENCES).replaceAll("'", "''")}'`),
    ),
  automationSettings: text("automation_settings", { mode: "json" })
    .$type<AutomationSettings>()
    .default(sql.raw(`'${JSON.stringify(DEFAULT_AUTOMATION_SETTINGS).replaceAll("'", "''")}'`)),
  emailTransportSettings: text("email_transport_settings", { mode: "json" })
    .$type<EmailTransportSettings>()
    .default(
      sql.raw(`'${JSON.stringify(DEFAULT_EMAIL_TRANSPORT_SETTINGS).replaceAll("'", "''")}'`),
    ),
  emailTransportPassword: text("email_transport_password"),
  createdAt: text("created_at").notNull().default(TIMESTAMP_DEFAULT),
  updatedAt: text("updated_at").notNull().default(TIMESTAMP_DEFAULT),
});

export { DEFAULT_SETTINGS_ID };
