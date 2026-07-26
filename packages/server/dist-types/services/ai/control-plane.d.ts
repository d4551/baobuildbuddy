import { AI_PROVIDER_CATALOG, normalizeAIRouting } from "@bao/shared/constants/ai-provider";
import type { AIProviderStatus, AIProviderType } from "@bao/shared/types/ai";
import type { AIProviderDiagnostics } from "@bao/shared/types/settings-contracts";
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
    availableModels?: readonly string[];
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
    providerDiagnostics?: AIProviderDiagnostics;
    providers: AIControlPlaneProviderRow[];
}
/**
 * Diagnostics carry readonly model lists, while the HTTP response contracts
 * declare plain arrays. Routes serialize through here so settings and AI
 * provider-discovery share one conversion.
 */
export declare const toSerializableProviderDiagnostics: (diagnostics: AIProviderDiagnostics | undefined) => {
    [k: string]: {
        provider: AIProviderType;
        code: "healthy" | "unconfigured" | "unreachable" | "empty-model-list" | "invalid-model" | "timeout" | "error";
        checkedAt: string;
        endpoint?: string;
        selectedModel?: string;
        message?: string;
    } | {
        provider: AIProviderType;
        code: "healthy" | "unconfigured" | "unreachable" | "empty-model-list" | "invalid-model" | "timeout" | "error";
        checkedAt: string;
        endpoint?: string;
        selectedModel?: string;
        message?: string;
        availableModels: string[];
    };
} | undefined;
/**
 * Provider rows carry the same readonly model lists as diagnostics; routes
 * serialize through here so the wire contract sees plain arrays.
 */
export declare const toSerializableProviderRows: (rows: readonly AIControlPlaneProviderRow[]) => ({
    id: (typeof AI_PROVIDER_CATALOG)[number]["id"];
    nameKey: string;
    descriptionKey: string;
    iconId: (typeof AI_PROVIDER_CATALOG)[number]["iconId"];
    models: string[];
    available: boolean;
    health: "healthy" | "degraded" | "down" | "unconfigured";
    selectedModel?: string;
    diagnosticCode?: AIProviderStatus["diagnosticCode"];
    error?: string;
} | {
    id: (typeof AI_PROVIDER_CATALOG)[number]["id"];
    nameKey: string;
    descriptionKey: string;
    iconId: (typeof AI_PROVIDER_CATALOG)[number]["iconId"];
    models: string[];
    available: boolean;
    health: "healthy" | "degraded" | "down" | "unconfigured";
    selectedModel?: string;
    diagnosticCode?: AIProviderStatus["diagnosticCode"];
    error?: string;
    availableModels: string[];
})[];
/**
 * Builds the canonical AI control-plane state from one persisted settings row.
 */
export declare function buildAIControlPlaneState(settingsRow: SettingsRow): Promise<AIControlPlaneState>;
export {};
