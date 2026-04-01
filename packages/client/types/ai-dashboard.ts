import type { AIProviderType } from "@bao/shared/types/ai";

export type ProviderHealth = "healthy" | "degraded" | "down" | "unconfigured";

export type ProviderConfig = {
  id: AIProviderType;
  iconId: AIProviderType;
  models: string[];
  available: boolean;
  health: ProviderHealth;
};

export type DashboardStats = {
  totalRequests: number;
  successRate: number;
  averageResponseTimeSeconds: number;
  activeProvider: AIProviderType;
  sessions: number;
};

export type ProviderConnectivityResult = {
  valid: boolean;
  message: string;
};
