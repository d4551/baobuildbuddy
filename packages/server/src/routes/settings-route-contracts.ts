import { MAX_PORT, MIN_PORT } from "@bao/shared/constants/ports";
import { SCHEMA_MAX_LENGTH_API_KEY, SCHEMA_MAX_LENGTH_EMAIL, SCHEMA_MAX_LENGTH_LONG, SCHEMA_MAX_LENGTH_MODEL, SCHEMA_MAX_LENGTH_SETTINGS_LABEL, SCHEMA_MAX_LENGTH_SETTINGS_URL } from "@bao/shared/constants/schema-limits";
import Type from "baobox";
import { DATA_EXPORT_VERSION } from "../services/data-service-contracts";
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

export const settingsUpdateBodySchema = Type.Object({
  aiRouting: Type.Optional(aiRoutingBodySchema),
  preferredProvider: Type.Optional(preferredProviderBodySchema),
  preferredModel: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
  theme: Type.Optional(
    Type.Union([
      Type.Literal("corporate"),
      Type.Literal("business"),
      Type.Literal("bao-light"),
      Type.Literal("bao-dark"),
    ]),
  ),
  language: Type.Optional(languageBodySchema),
  brandSettings: Type.Optional(brandSettingsPatchBodySchema),
  notifications: Type.Optional(
    Type.Object({
      achievements: Type.Optional(Type.Boolean()),
      dailyChallenges: Type.Optional(Type.Boolean()),
      jobAlerts: Type.Optional(Type.Boolean()),
      levelUp: Type.Optional(Type.Boolean()),
    }),
  ),
  automationSettings: Type.Optional(
    Type.Object({
      headless: Type.Optional(Type.Boolean()),
      defaultTimeout: Type.Optional(Type.Number({ minimum: 1, maximum: 120 })),
      screenshotRetention: Type.Optional(Type.Number({ minimum: 1, maximum: 30 })),
      maxConcurrentRuns: Type.Optional(Type.Number({ minimum: 1, maximum: 5 })),
      defaultBrowser: Type.Optional(browserBodySchema),
      enableSmartSelectors: Type.Optional(Type.Boolean()),
      autoSaveScreenshots: Type.Optional(Type.Boolean()),
      speech: Type.Optional(speechSettingsBodySchema),
      jobProviders: Type.Optional(jobProviderSettingsBodySchema),
    }),
  ),
  emailTransportSettings: Type.Optional(
    Type.Object({
      host: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL })),
      port: Type.Optional(Type.Number({ minimum: MIN_PORT, maximum: MAX_PORT })),
      security: Type.Optional(emailTransportSecurityBodySchema),
      username: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
      fromEmail: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
      fromName: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL })),
      authMethod: Type.Optional(emailTransportAuthModeBodySchema),
      connectionTimeoutSeconds: Type.Optional(Type.Number({ minimum: 1, maximum: 120 })),
    }),
  ),
});

export const apiKeysUpdateBodySchema = Type.Object({
  geminiApiKey: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
  openaiApiKey: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
  claudeApiKey: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
  huggingfaceToken: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
  localModelEndpoint: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL })),
  localModelName: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
  emailTransportPassword: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
});

export const providerTestBodySchema = Type.Object(
  {
    provider: preferredProviderBodySchema,
    key: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    model: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
  },
  { required: ["provider", "key"] },
);

export const jobTaxonomyUpdateBodySchema = jobTaxonomySettingsBodySchema;

export const importSettingsBodySchema = Type.Object(
  {
    version: Type.Literal(DATA_EXPORT_VERSION),
    exportedAt: Type.String(),
    profile: nullableJsonValueBodySchema,
    settings: nullableJsonValueBodySchema,
    resumes: Type.Array(jsonValueBodySchema),
    coverLetters: Type.Array(jsonValueBodySchema),
    portfolio: nullableJsonValueBodySchema,
    portfolioProjects: Type.Array(jsonValueBodySchema),
    interviewSessions: Type.Array(jsonValueBodySchema),
    gamification: nullableJsonValueBodySchema,
    applications: Type.Array(jsonValueBodySchema),
    chatHistory: Type.Array(jsonValueBodySchema),
    savedJobs: Type.Array(jsonValueBodySchema),
    skillMappings: Type.Array(jsonValueBodySchema),
  },
  {
    required: [
      "version",
      "exportedAt",
      "profile",
      "settings",
      "resumes",
      "coverLetters",
      "portfolio",
      "portfolioProjects",
      "interviewSessions",
      "gamification",
      "applications",
      "chatHistory",
      "savedJobs",
      "skillMappings",
    ],
  },
);
