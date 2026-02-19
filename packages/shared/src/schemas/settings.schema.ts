import { z } from "zod";
import type { AIProviderType } from "../types/ai";

export const apiKeyConfigSchema = z.object({
  provider: z.enum(["gemini", "claude", "openai", "huggingface", "local"]),
  key: z.string().min(1),
});

const aiProviderSchema = z.enum(["gemini", "claude", "openai", "huggingface", "local"]);

export const preferredModelsSchema = z.record(aiProviderSchema, z.string().min(1));

export const settingsSchema = z.object({
  geminiApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  claudeApiKey: z.string().optional(),
  huggingfaceToken: z.string().optional(),
  localModelEndpoint: z.string().url().optional(),
  localModelName: z.string().optional(),
  preferredProvider: aiProviderSchema.default("local" as AIProviderType),
  preferredModel: z.string().optional(),
  preferredModels: preferredModelsSchema.optional(),
  theme: z.enum(["bao-light", "bao-dark"]).default("bao-light"),
  language: z.string().default("en"),
  notifications: z
    .object({
      achievements: z.boolean().default(true),
      dailyChallenges: z.boolean().default(true),
      levelUp: z.boolean().default(true),
      jobAlerts: z.boolean().default(true),
    })
    .default({}),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
