import z from "zod";
import { AI_PROVIDER_DEFAULT, AI_PROVIDER_ID_LIST, DEFAULT_AI_ROUTING } from "../constants/ai";
import {
  BRAND_THEME_COLOR_PATTERN,
  BRAND_THEME_LENGTH_PATTERN,
  BRAND_THEME_UNITLESS_FLAG_PATTERN,
} from "../constants/brand-theme-css";
import { DEFAULT_BRAND_SETTINGS, normalizeAppDataTheme, THEME_NAMES } from "../constants/branding";
import { MAX_PORT, MIN_PORT } from "../constants/ports";
import {
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_PAGES_MAX,
  SCHEMA_MAX_PAGES_MIN,
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

const brandThemeColorValueSchema = z
  .string()
  .trim()
  .min(1)
  .max(SCHEMA_MAX_LENGTH_SHORT)
  .regex(BRAND_THEME_COLOR_PATTERN);

const brandThemeLengthValueSchema = z
  .string()
  .trim()
  .min(1)
  .max(SCHEMA_MAX_LENGTH_SHORT)
  .regex(BRAND_THEME_LENGTH_PATTERN);

const brandThemeUnitlessFlagSchema = z
  .string()
  .trim()
  .min(1)
  .max(SCHEMA_MAX_LENGTH_SHORT)
  .regex(BRAND_THEME_UNITLESS_FLAG_PATTERN);

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
  name: z.string().trim().min(1).max(120),
  token: z.string().trim().min(1).max(120),
  type: companyBoardTypeSchema,
  enabled: z.boolean(),
  priority: z.number().int().min(0).max(1000),
});

export const greenhouseBoardConfigSchema = z.object({
  board: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(120),
  enabled: z.boolean(),
});

export const leverCompanyConfigSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(120),
  enabled: z.boolean(),
});

export const gamingPortalConfigSchema = z.object({
  id: gamingPortalIdSchema,
  name: z.string().trim().min(1).max(120),
  source: z.string().trim().min(1).max(120),
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
  companyBoardResultLimit: z.number().int().min(1).max(200),
  gamingBoardResultLimit: z.number().int().min(1).max(200),
  unknownLocationLabel: z.string().trim().min(1).max(100),
  unknownCompanyLabel: z.string().trim().min(1).max(100),
  hitmarkerEnabled: z.boolean().default(DEFAULT_JOB_PROVIDER_SETTINGS.hitmarkerEnabled),
  hitmarkerApiBaseUrl: z.string().url(),
  hitmarkerDefaultQuery: z.string().trim().min(1).max(100),
  hitmarkerDefaultLocation: z.string().trim().min(1).max(100),
  greenhouseApiBaseUrl: z.string().url(),
  greenhouseMaxPages: z.number().int().min(SCHEMA_MAX_PAGES_MIN).max(SCHEMA_MAX_PAGES_MAX),
  greenhouseBoards: z.array(greenhouseBoardConfigSchema).max(500),
  leverApiBaseUrl: z.string().url(),
  leverMaxPages: z.number().int().min(SCHEMA_MAX_PAGES_MIN).max(SCHEMA_MAX_PAGES_MAX),
  leverCompanies: z.array(leverCompanyConfigSchema).max(500),
  companyBoardApiTemplates: companyBoardApiTemplatesSchema,
  companyBoards: z.array(companyBoardConfigSchema).max(500),
  gamingPortals: z.array(gamingPortalConfigSchema).max(50),
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
  voice: z.string().trim().min(1).max(120).default(DEFAULT_SPEECH_SETTINGS.tts.voice),
  format: z.enum(["mp3", "wav"]).default(DEFAULT_SPEECH_SETTINGS.tts.format),
});

export const speechSettingsSchema = z.object({
  locale: z.string().trim().min(2).max(20).default(DEFAULT_SPEECH_SETTINGS.locale),
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
      .max(120)
      .default(DEFAULT_EMAIL_TRANSPORT_SETTINGS.connectionTimeoutSeconds),
  })
  .default(DEFAULT_EMAIL_TRANSPORT_SETTINGS);

export const brandThemePaletteSchema = z.object({
  base100: brandThemeColorValueSchema,
  base200: brandThemeColorValueSchema,
  base300: brandThemeColorValueSchema,
  baseContent: brandThemeColorValueSchema,
  primary: brandThemeColorValueSchema,
  primaryContent: brandThemeColorValueSchema,
  secondary: brandThemeColorValueSchema,
  secondaryContent: brandThemeColorValueSchema,
  accent: brandThemeColorValueSchema,
  accentContent: brandThemeColorValueSchema,
  neutral: brandThemeColorValueSchema,
  neutralContent: brandThemeColorValueSchema,
  info: brandThemeColorValueSchema,
  infoContent: brandThemeColorValueSchema,
  success: brandThemeColorValueSchema,
  successContent: brandThemeColorValueSchema,
  warning: brandThemeColorValueSchema,
  warningContent: brandThemeColorValueSchema,
  error: brandThemeColorValueSchema,
  errorContent: brandThemeColorValueSchema,
  radiusSelector: brandThemeLengthValueSchema,
  radiusField: brandThemeLengthValueSchema,
  radiusBox: brandThemeLengthValueSchema,
  sizeSelector: brandThemeLengthValueSchema,
  sizeField: brandThemeLengthValueSchema,
  border: brandThemeLengthValueSchema,
  depth: brandThemeUnitlessFlagSchema,
  noise: brandThemeUnitlessFlagSchema,
});

export const brandTypographySettingsSchema = z.object({
  fontStylesheetUrl: z.string().trim().max(SCHEMA_MAX_LENGTH_LONG).default(""),
  displayFontFamily: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
  bodyFontFamily: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
  monoFontFamily: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
});

export const brandContentSettingsSchema = z.object({
  tagline: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  defaultTitle: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  defaultDescription: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
  contentOverrides: z
    .record(
      z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
      z.string().trim().max(SCHEMA_MAX_LENGTH_LONG),
    )
    .default({}),
});

export const brandSettingsSchema = z.object({
  name: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  assistantName: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  apiName: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  logoPath: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
  faviconPath: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
  typography: brandTypographySettingsSchema,
  lightTheme: brandThemePaletteSchema,
  darkTheme: brandThemePaletteSchema,
  content: brandContentSettingsSchema,
});

export const brandThemePalettePatchSchema = brandThemePaletteSchema.partial();
export const brandTypographySettingsPatchSchema = brandTypographySettingsSchema.partial();
export const brandContentSettingsPatchSchema = brandContentSettingsSchema.partial();
export const brandSettingsPatchSchema = z.object({
  name: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  assistantName: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  apiName: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  logoPath: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG).optional(),
  faviconPath: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG).optional(),
  typography: brandTypographySettingsPatchSchema.optional(),
  lightTheme: brandThemePalettePatchSchema.optional(),
  darkTheme: brandThemePalettePatchSchema.optional(),
  content: brandContentSettingsPatchSchema.optional(),
});

export const automationSettingsSchema = z
  .object({
    headless: z.boolean().default(true),
    defaultTimeout: z.number().int().min(1).max(120).default(30),
    screenshotRetention: z.number().int().min(1).max(30).default(7),
    maxConcurrentRuns: z.number().int().min(1).max(5).default(1),
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
