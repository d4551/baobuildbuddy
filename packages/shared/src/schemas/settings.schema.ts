import z from "zod";
import { AI_PROVIDER_DEFAULT, AI_PROVIDER_ID_LIST, DEFAULT_AI_ROUTING } from "../constants/ai";
import { DEFAULT_BRAND_SETTINGS, normalizeAppDataTheme, THEME_NAMES } from "../constants/branding";
import { MAX_PORT, MIN_PORT } from "../constants/ports";
import {
  SCHEMA_DEFAULT_AUTOMATION_TIMEOUT_SECONDS,
  SCHEMA_DEFAULT_SCREENSHOT_RETENTION_DAYS,
  SCHEMA_MAX_AUTOMATION_TIMEOUT_SECONDS,
  SCHEMA_MAX_BOARD_PRIORITY,
  SCHEMA_MAX_BOARD_RESULT_LIMIT,
  SCHEMA_MAX_CONCURRENT_RUNS,
  SCHEMA_MAX_ITEMS_BOARDS,
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_LENGTH_SETTINGS_LABEL,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_PAGES_MAX,
  SCHEMA_MAX_PAGES_MIN,
  SCHEMA_MAX_SCREENSHOT_RETENTION_DAYS,
  SCHEMA_PROVIDER_TIMEOUT_MAX_MS,
  SCHEMA_PROVIDER_TIMEOUT_MIN_MS,
} from "../constants/schema-limits";
import {
  APP_LANGUAGE_CODES,
  AUTOMATION_BROWSER_OPTIONS,
  DEFAULT_APP_LANGUAGE,
  DEFAULT_SPEECH_SETTINGS,
  EMAIL_TRANSPORT_AUTH_MODE_OPTIONS,
  EMAIL_TRANSPORT_SECURITY_OPTIONS,
  SPEECH_PROVIDER_OPTIONS,
} from "../constants/settings";
import type { AIProviderType } from "../types/ai";
import {
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  DEFAULT_JOB_PROVIDER_SETTINGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "../types/settings";

import {
  brandContentSettingsPatchSchema as brandContentSettingsPatchSchemaDef,
  brandContentSettingsSchema as brandContentSettingsSchemaDef,
  brandSettingsPatchSchema as brandSettingsPatchSchemaDef,
  brandSettingsSchema as brandSettingsSchemaDef,
  brandThemePalettePatchSchema as brandThemePalettePatchSchemaDef,
  brandThemePaletteSchema as brandThemePaletteSchemaDef,
  brandTypographySettingsPatchSchema as brandTypographySettingsPatchSchemaDef,
  brandTypographySettingsSchema as brandTypographySettingsSchemaDef,
} from "./settings-brand.schema";

export const brandContentSettingsPatchSchema = brandContentSettingsPatchSchemaDef;
export const brandContentSettingsSchema = brandContentSettingsSchemaDef;
export const brandSettingsPatchSchema = brandSettingsPatchSchemaDef;
export const brandSettingsSchema = brandSettingsSchemaDef;
export const brandThemePalettePatchSchema = brandThemePalettePatchSchemaDef;
export const brandThemePaletteSchema = brandThemePaletteSchemaDef;
export const brandTypographySettingsPatchSchema = brandTypographySettingsPatchSchemaDef;
export const brandTypographySettingsSchema = brandTypographySettingsSchemaDef;

export const apiKeyConfigSchema = z.object({
  provider: z.enum(AI_PROVIDER_ID_LIST as [AIProviderType, ...AIProviderType[]]),
  key: z.string().min(1),
});

const aiProviderSchema = z.enum(AI_PROVIDER_ID_LIST as [AIProviderType, ...AIProviderType[]]);

export const preferredModelsSchema = z.partialRecord(aiProviderSchema, z.string().min(1));

const AI_ROUTING_PURPOSE_SCHEMA_VALUES = [
  "chat",
  "interviewQuestions",
  "interviewFeedback",
  "resume",
  "coverLetter",
  "emailResponse",
  "jobMatch",
  "scrapeEnrichment",
  "automationFieldMapping",
] as const;

const aiRoutingPurposeSchema = z.enum(AI_ROUTING_PURPOSE_SCHEMA_VALUES);

export const aiRoutingTargetSchema = z.object({
  provider: aiProviderSchema,
  model: z.string().trim().min(1).optional(),
});

export const aiRoutingSchema = z
  .record(aiRoutingPurposeSchema, aiRoutingTargetSchema)
  .default(DEFAULT_AI_ROUTING);

export const companyBoardTypeSchema = z.enum([
  "greenhouse",
  "lever",
  "recruitee",
  "workable",
  "ashby",
  "smartrecruiters",
  "teamtailor",
  "workday",
]);

export const gamingPortalIdSchema = z.enum([
  "hitmarker",
  "grackle",
  "workwithindies",
  "remotegamejobs",
  "gamesjobsdirect",
  "pocketgamer",
]);

export const companyBoardConfigSchema = z.object({
  name: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SETTINGS_LABEL),
  token: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SETTINGS_LABEL),
  type: companyBoardTypeSchema,
  enabled: z.boolean(),
  priority: z.number().int().min(0).max(SCHEMA_MAX_BOARD_PRIORITY),
});

export const greenhouseBoardConfigSchema = z.object({
  board: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SETTINGS_LABEL),
  company: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SETTINGS_LABEL),
  enabled: z.boolean(),
});

export const leverCompanyConfigSchema = z.object({
  slug: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SETTINGS_LABEL),
  company: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SETTINGS_LABEL),
  enabled: z.boolean(),
});

export const gamingPortalConfigSchema = z.object({
  id: gamingPortalIdSchema,
  name: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SETTINGS_LABEL),
  source: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SETTINGS_LABEL),
  fallbackUrl: z.string().url(),
  enabled: z.boolean(),
});

export const companyBoardApiTemplatesSchema = z.object({
  greenhouse: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  lever: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  recruitee: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  workable: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  ashby: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  smartrecruiters: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  teamtailor: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  workday: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
});

export const jobProviderSettingsSchema = z.object({
  providerTimeoutMs: z
    .number()
    .int()
    .min(SCHEMA_PROVIDER_TIMEOUT_MIN_MS)
    .max(SCHEMA_PROVIDER_TIMEOUT_MAX_MS),
  companyBoardResultLimit: z.number().int().min(1).max(SCHEMA_MAX_BOARD_RESULT_LIMIT),
  gamingBoardResultLimit: z.number().int().min(1).max(SCHEMA_MAX_BOARD_RESULT_LIMIT),
  unknownLocationLabel: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_ID),
  unknownCompanyLabel: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_ID),
  hitmarkerEnabled: z.boolean().default(DEFAULT_JOB_PROVIDER_SETTINGS.hitmarkerEnabled),
  hitmarkerApiBaseUrl: z.string().url(),
  hitmarkerDefaultQuery: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_ID),
  hitmarkerDefaultLocation: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_ID),
  greenhouseApiBaseUrl: z.string().url(),
  greenhouseMaxPages: z.number().int().min(SCHEMA_MAX_PAGES_MIN).max(SCHEMA_MAX_PAGES_MAX),
  greenhouseBoards: z.array(greenhouseBoardConfigSchema).max(SCHEMA_MAX_ITEMS_BOARDS),
  leverApiBaseUrl: z.string().url(),
  leverMaxPages: z.number().int().min(SCHEMA_MAX_PAGES_MIN).max(SCHEMA_MAX_PAGES_MAX),
  leverCompanies: z.array(leverCompanyConfigSchema).max(SCHEMA_MAX_ITEMS_BOARDS),
  companyBoardApiTemplates: companyBoardApiTemplatesSchema,
  companyBoards: z.array(companyBoardConfigSchema).max(SCHEMA_MAX_ITEMS_BOARDS),
  gamingPortals: z.array(gamingPortalConfigSchema).max(SCHEMA_MAX_ITEMS_LARGE),
});

export const notificationPreferencesSchema = z
  .object({
    achievements: z.boolean().default(true),
    dailyChallenges: z.boolean().default(true),
    levelUp: z.boolean().default(true),
    jobAlerts: z.boolean().default(true),
  })
  .default(DEFAULT_NOTIFICATION_PREFERENCES);

const speechProviderSchema = z.enum(SPEECH_PROVIDER_OPTIONS);

export const speechToTextSettingsSchema = z.object({
  provider: speechProviderSchema.default(DEFAULT_SPEECH_SETTINGS.stt.provider),
  model: z
    .string()
    .trim()
    .min(1)
    .max(SCHEMA_MAX_LENGTH_SHORT)
    .default(DEFAULT_SPEECH_SETTINGS.stt.model),
  endpoint: z
    .string()
    .trim()
    .max(SCHEMA_MAX_LENGTH_LONG)
    .default(DEFAULT_SPEECH_SETTINGS.stt.endpoint),
});

export const textToSpeechSettingsSchema = z.object({
  provider: speechProviderSchema.default(DEFAULT_SPEECH_SETTINGS.tts.provider),
  model: z
    .string()
    .trim()
    .min(1)
    .max(SCHEMA_MAX_LENGTH_SHORT)
    .default(DEFAULT_SPEECH_SETTINGS.tts.model),
  endpoint: z
    .string()
    .trim()
    .max(SCHEMA_MAX_LENGTH_LONG)
    .default(DEFAULT_SPEECH_SETTINGS.tts.endpoint),
  voice: z
    .string()
    .trim()
    .min(1)
    .max(SCHEMA_MAX_LENGTH_SETTINGS_LABEL)
    .default(DEFAULT_SPEECH_SETTINGS.tts.voice),
  format: z.enum(["mp3", "wav"]).default(DEFAULT_SPEECH_SETTINGS.tts.format),
});

export const speechSettingsSchema = z.object({
  locale: z
    .string()
    .trim()
    .min(2)
    .max(SCHEMA_MAX_LENGTH_MICRO)
    .default(DEFAULT_SPEECH_SETTINGS.locale),
  stt: speechToTextSettingsSchema.default(DEFAULT_SPEECH_SETTINGS.stt),
  tts: textToSpeechSettingsSchema.default(DEFAULT_SPEECH_SETTINGS.tts),
});

export const emailTransportSecuritySchema = z.enum(EMAIL_TRANSPORT_SECURITY_OPTIONS);

export const emailTransportAuthModeSchema = z.enum(EMAIL_TRANSPORT_AUTH_MODE_OPTIONS);

export const emailTransportSettingsSchema = z
  .object({
    host: z
      .string()
      .trim()
      .max(SCHEMA_MAX_LENGTH_SHORT)
      .default(DEFAULT_EMAIL_TRANSPORT_SETTINGS.host),
    port: z
      .number()
      .int()
      .min(MIN_PORT)
      .max(MAX_PORT)
      .default(DEFAULT_EMAIL_TRANSPORT_SETTINGS.port),
    security: emailTransportSecuritySchema.default(DEFAULT_EMAIL_TRANSPORT_SETTINGS.security),
    username: z
      .string()
      .trim()
      .max(SCHEMA_MAX_LENGTH_EMAIL)
      .default(DEFAULT_EMAIL_TRANSPORT_SETTINGS.username),
    fromEmail: z
      .string()
      .trim()
      .max(SCHEMA_MAX_LENGTH_EMAIL)
      .default(DEFAULT_EMAIL_TRANSPORT_SETTINGS.fromEmail),
    fromName: z
      .string()
      .trim()
      .max(SCHEMA_MAX_LENGTH_SHORT)
      .default(DEFAULT_EMAIL_TRANSPORT_SETTINGS.fromName),
    authMethod: emailTransportAuthModeSchema.default(DEFAULT_EMAIL_TRANSPORT_SETTINGS.authMethod),
    connectionTimeoutSeconds: z
      .number()
      .int()
      .min(1)
      .max(SCHEMA_MAX_AUTOMATION_TIMEOUT_SECONDS)
      .default(DEFAULT_EMAIL_TRANSPORT_SETTINGS.connectionTimeoutSeconds),
  })
  .default(DEFAULT_EMAIL_TRANSPORT_SETTINGS);

export const automationSettingsSchema = z
  .object({
    headless: z.boolean().default(true),
    defaultTimeout: z
      .number()
      .int()
      .min(1)
      .max(SCHEMA_MAX_AUTOMATION_TIMEOUT_SECONDS)
      .default(SCHEMA_DEFAULT_AUTOMATION_TIMEOUT_SECONDS),
    screenshotRetention: z
      .number()
      .int()
      .min(1)
      .max(SCHEMA_MAX_SCREENSHOT_RETENTION_DAYS)
      .default(SCHEMA_DEFAULT_SCREENSHOT_RETENTION_DAYS),
    maxConcurrentRuns: z.number().int().min(1).max(SCHEMA_MAX_CONCURRENT_RUNS).default(1),
    defaultBrowser: z.enum(AUTOMATION_BROWSER_OPTIONS).default("chrome"),
    enableSmartSelectors: z.boolean().default(true),
    autoSaveScreenshots: z.boolean().default(true),
    speech: speechSettingsSchema.default(DEFAULT_AUTOMATION_SETTINGS.speech),
    jobProviders: jobProviderSettingsSchema.default(DEFAULT_JOB_PROVIDER_SETTINGS),
  })
  .default(DEFAULT_AUTOMATION_SETTINGS);

export const settingsSchema = z.object({
  geminiApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  claudeApiKey: z.string().optional(),
  huggingfaceToken: z.string().optional(),
  localModelEndpoint: z.string().url().optional(),
  localModelName: z.string().optional(),
  aiRouting: aiRoutingSchema,
  preferredProvider: aiProviderSchema.default(AI_PROVIDER_DEFAULT),
  preferredModel: z.string().optional(),
  preferredModels: preferredModelsSchema.optional(),
  theme: z
    .union([
      z.literal("corporate"),
      z.literal("business"),
      z.literal("bao-light"),
      z.literal("bao-dark"),
    ])
    .default(THEME_NAMES.light)
    .transform((value) => normalizeAppDataTheme(value)),
  language: z.enum(APP_LANGUAGE_CODES).default(DEFAULT_APP_LANGUAGE),
  brandSettings: brandSettingsSchema.default(DEFAULT_BRAND_SETTINGS),
  notifications: notificationPreferencesSchema,
  automationSettings: automationSettingsSchema,
  emailTransportSettings: emailTransportSettingsSchema,
});

export type SettingsInput = z.infer<typeof settingsSchema>;
