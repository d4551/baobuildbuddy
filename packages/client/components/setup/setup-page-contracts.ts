import {
  AI_PROVIDER_ID_LIST,
  type AIProviderType,
  type DashboardStats,
} from "@bao/shared";
import type { ClientProviderTestResult } from "~/utils/ai-control-plane";

export type SetupProvider = AIProviderType;
export type CloudProvider = Exclude<SetupProvider, "local">;
export type SetupStep = 1 | 2 | 3;

export type SetupAuthStatus = {
  authRequired: boolean;
  configured: boolean;
  bootstrapRequired: boolean;
  setupTokenConfigured: boolean;
};

export type SetupTestResult = ClientProviderTestResult & {
  provider: string;
};

function isCloudProvider(provider: AIProviderType): provider is CloudProvider {
  return provider !== "local";
}

export const CLOUD_PROVIDER_IDS = AI_PROVIDER_ID_LIST.filter(isCloudProvider);

export const API_KEY_FIELD_BY_PROVIDER: Record<CloudProvider, string> = {
  gemini: "geminiApiKey",
  openai: "openaiApiKey",
  claude: "claudeApiKey",
  huggingface: "huggingfaceToken",
};

export interface SetupBootstrapPayload {
  initialized: boolean;
  dashboardStats: DashboardStats | null;
  authStatus: SetupAuthStatus;
}
