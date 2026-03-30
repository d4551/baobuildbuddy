import {
  MAX_PORT,
  MIN_PORT,
  SCHEMA_MAX_LENGTH_API_KEY,
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MODEL,
  SCHEMA_MAX_LENGTH_SETTINGS_LABEL,
  SCHEMA_MAX_LENGTH_SETTINGS_URL,
} from "@bao/shared";
import { t } from "elysia";
import { DATA_EXPORT_VERSION } from "../services/data-service";
import {
  aiRoutingBodySchema,
  brandSettingsPatchBodySchema,
  browserBodySchema,
  emailTransportAuthModeBodySchema,
  emailTransportSecurityBodySchema,
  languageBodySchema,
  preferredProviderBodySchema as preferredProviderSchema,
  resolveKnownProvider as resolveKnownProviderValue,
} from "./settings-route-schema-ai-brand";
import {
  jobTaxonomySettingsBodySchema,
  jobProviderSettingsBodySchema,
  jsonValueBodySchema,
  nullableJsonValueBodySchema,
  speechSettingsBodySchema,
} from "./settings-route-schema-automation";

export const preferredProviderBodySchema = preferredProviderSchema;
export const resolveKnownProvider = resolveKnownProviderValue;

export const settingsUpdateBodySchema = t.Object({
  aiRouting: t.Optional(aiRoutingBodySchema),
  preferredProvider: t.Optional(preferredProviderBodySchema),
  preferredModel: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
  theme: t.Optional(
    t.Union([
      t.Literal("corporate"),
      t.Literal("business"),
      t.Literal("bao-light"),
      t.Literal("bao-dark"),
    ]),
  ),
  language: t.Optional(languageBodySchema),
  brandSettings: t.Optional(brandSettingsPatchBodySchema),
  notifications: t.Optional(
    t.Object({
      achievements: t.Optional(t.Boolean()),
      dailyChallenges: t.Optional(t.Boolean()),
      jobAlerts: t.Optional(t.Boolean()),
      levelUp: t.Optional(t.Boolean()),
    }),
  ),
  automationSettings: t.Optional(
    t.Object({
      headless: t.Optional(t.Boolean()),
      defaultTimeout: t.Optional(t.Number({ minimum: 1, maximum: 120 })),
      screenshotRetention: t.Optional(t.Number({ minimum: 1, maximum: 30 })),
      maxConcurrentRuns: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
      defaultBrowser: t.Optional(browserBodySchema),
      enableSmartSelectors: t.Optional(t.Boolean()),
      autoSaveScreenshots: t.Optional(t.Boolean()),
      speech: t.Optional(speechSettingsBodySchema),
      jobProviders: t.Optional(jobProviderSettingsBodySchema),
    }),
  ),
  emailTransportSettings: t.Optional(
    t.Object({
      host: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL })),
      port: t.Optional(t.Number({ minimum: MIN_PORT, maximum: MAX_PORT })),
      security: t.Optional(emailTransportSecurityBodySchema),
      username: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
      fromEmail: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
      fromName: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL })),
      authMethod: t.Optional(emailTransportAuthModeBodySchema),
      connectionTimeoutSeconds: t.Optional(t.Number({ minimum: 1, maximum: 120 })),
    }),
  ),
});

export const apiKeysUpdateBodySchema = t.Object({
  geminiApiKey: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
  openaiApiKey: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
  claudeApiKey: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
  huggingfaceToken: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
  localModelEndpoint: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL })),
  localModelName: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
  emailTransportPassword: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
});

export const providerTestBodySchema = t.Object({
  provider: preferredProviderBodySchema,
  key: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
  model: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
});

export const jobTaxonomyUpdateBodySchema = jobTaxonomySettingsBodySchema;

export const importSettingsBodySchema = t.Object({
  version: t.Literal(DATA_EXPORT_VERSION),
  exportedAt: t.String(),
  profile: nullableJsonValueBodySchema,
  settings: nullableJsonValueBodySchema,
  resumes: t.Array(jsonValueBodySchema),
  coverLetters: t.Array(jsonValueBodySchema),
  portfolio: nullableJsonValueBodySchema,
  portfolioProjects: t.Array(jsonValueBodySchema),
  interviewSessions: t.Array(jsonValueBodySchema),
  gamification: nullableJsonValueBodySchema,
  applications: t.Array(jsonValueBodySchema),
  chatHistory: t.Array(jsonValueBodySchema),
  savedJobs: t.Array(jsonValueBodySchema),
  skillMappings: t.Array(jsonValueBodySchema),
});
