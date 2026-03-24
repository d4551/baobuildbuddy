import { AI_PROVIDER_CATALOG, normalizeAIRouting } from "@bao/shared";
import type { AIProviderStatus } from "@bao/shared";
import type { settings as settingsTable } from "../../db/schema/settings";
import { AIService } from "./ai-service";
type SettingsRow = typeof settingsTable.$inferSelect;
interface AIControlPlaneProviderRow {
    id: (typeof AI_PROVIDER_CATALOG)[number]["id"];
    nameKey: string;
    descriptionKey: string;
    iconId: (typeof AI_PROVIDER_CATALOG)[number]["iconId"];
    models: string[];
    available: boolean;
    health: "healthy" | "degraded" | "down" | "unconfigured";
    selectedModel?: string;
    diagnosticCode?: AIProviderStatus["diagnosticCode"];
    availableModels?: string[];
    error?: string;
}
/**
 * Shared AI control-plane payload consumed by settings and provider-discovery routes.
 */
export interface AIControlPlaneState {
    aiRouting: ReturnType<typeof normalizeAIRouting>;
    configuredProviders: ReturnType<AIService["getConfiguredProviders"]>;
    error?: string;
    preferredModel: string | null;
    preferredProvider: SettingsRow["preferredProvider"];
    providerDiagnostics?: Record<string, unknown>;
    providers: AIControlPlaneProviderRow[];
}
/**
 * Builds the canonical AI control-plane state from one persisted settings row.
 */
export declare function buildAIControlPlaneState(row: SettingsRow): Promise<AIControlPlaneState>;
export {};
