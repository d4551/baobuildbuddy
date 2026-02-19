/**
 * App settings types for single-user local-first app
 */

import type { AIProviderType } from "./ai";

/**
 * Per-provider model preferences.
 */
export type ProviderModelPreferences = Partial<Record<AIProviderType, string>>;

export interface AppSettings {
  id: string; // always "default"
  // AI provider keys
  geminiApiKey?: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
  huggingfaceToken?: string;
  // Local model config
  localModelEndpoint?: string;
  localModelName?: string;
  preferredModel?: string;
  preferredModels?: ProviderModelPreferences;
  // Preferences
  preferredProvider: AIProviderType;
  theme: "bao-light" | "bao-dark";
  language: string;
  notifications: NotificationPreferences;
  // Computed credential presence flags
  hasGeminiKey?: boolean;
  hasOpenaiKey?: boolean;
  hasClaudeKey?: boolean;
  hasHuggingfaceToken?: boolean;
  hasLocalKey?: boolean;
}

export interface NotificationPreferences {
  achievements: boolean;
  dailyChallenges: boolean;
  levelUp: boolean;
  jobAlerts: boolean;
}

export interface APIKeyConfig {
  provider: AIProviderType;
  key: string;
  valid?: boolean;
  lastTested?: string;
}
