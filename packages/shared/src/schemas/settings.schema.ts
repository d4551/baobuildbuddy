import { z } from "zod";
import { AI_PROVIDER_DEFAULT, AI_PROVIDER_ID_LIST } from "../constants/ai";
import type { AIProviderType } from "../types/ai";
import { DEFAULT_AUTOMATION_SETTINGS, DEFAULT_NOTIFICATION_PREFERENCES } from "../types/settings";

export const apiKeyConfigSchema = z.object({
  provider: z.enum(AI_PROVIDER_ID_LIST as [AIProviderType, ...AIProviderType[]]),
  key: z.string().min(1),
});

const aiProviderSchema = z.enum(AI_PROVIDER_ID_LIST as [AIProviderType, ...AIProviderType[]]);

export const preferredModelsSchema = z.partialRecord(aiProviderSchema, z.string().min(1));

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
  "gamedev-net",
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
  greenhouse: z.string().trim().min(1).max(200),
  lever: z.string().trim().min(1).max(200),
  recruitee: z.string().trim().min(1).max(200),
  workable: z.string().trim().min(1).max(200),
  ashby: z.string().trim().min(1).max(200),
  smartrecruiters: z.string().trim().min(1).max(200),
  teamtailor: z.string().trim().min(1).max(200),
  workday: z.string().trim().min(1).max(200),
});

export const jobProviderSettingsSchema = z.object({
  providerTimeoutMs: z.number().int().min(1_000).max(120_000),
  companyBoardResultLimit: z.number().int().min(1).max(200),
  gamingBoardResultLimit: z.number().int().min(1).max(200),
  unknownLocationLabel: z.string().trim().min(1).max(100),
  unknownCompanyLabel: z.string().trim().min(1).max(100),
  hitmarkerApiBaseUrl: z.string().url(),
  hitmarkerDefaultQuery: z.string().trim().min(1).max(100),
  hitmarkerDefaultLocation: z.string().trim().min(1).max(100),
  greenhouseApiBaseUrl: z.string().url(),
  greenhouseMaxPages: z.number().int().min(1).max(20),
  greenhouseBoards: z.array(greenhouseBoardConfigSchema).max(500),
  leverApiBaseUrl: z.string().url(),
  leverMaxPages: z.number().int().min(1).max(20),
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

export const automationSettingsSchema = z
  .object({
    headless: z.boolean().default(true),
    defaultTimeout: z.number().int().min(1).max(120).default(30),
    screenshotRetention: z.number().int().min(1).max(30).default(7),
    maxConcurrentRuns: z.number().int().min(1).max(5).default(1),
    defaultBrowser: z.enum(["chrome", "chromium", "edge"]).default("chrome"),
    enableSmartSelectors: z.boolean().default(true),
    autoSaveScreenshots: z.boolean().default(true),
    jobProviders: jobProviderSettingsSchema.optional(),
  })
  .default(DEFAULT_AUTOMATION_SETTINGS);

export const settingsSchema = z.object({
  geminiApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  claudeApiKey: z.string().optional(),
  huggingfaceToken: z.string().optional(),
  localModelEndpoint: z.string().url().optional(),
  localModelName: z.string().optional(),
  preferredProvider: aiProviderSchema.default(AI_PROVIDER_DEFAULT),
  preferredModel: z.string().optional(),
  preferredModels: preferredModelsSchema.optional(),
  theme: z.enum(["bao-light", "bao-dark"]).default("bao-light"),
  language: z.string().default("en"),
  notifications: notificationPreferencesSchema,
  automationSettings: automationSettingsSchema,
});

export type SettingsInput = z.infer<typeof settingsSchema>;
