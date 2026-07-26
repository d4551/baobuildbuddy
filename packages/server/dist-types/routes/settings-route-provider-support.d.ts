import type { AIProviderType } from "@bao/shared/types/ai";
import type { settings as settingsTable } from "../db/schema/settings";
type NotificationPreferences = {
    achievements: boolean;
    dailyChallenges: boolean;
    jobAlerts: boolean;
    levelUp: boolean;
};
type SettingsRow = typeof settingsTable.$inferSelect;
export declare const buildSettingsResponse: (row: SettingsRow) => Promise<{
    automationSettings: import("@bao/shared/types/settings-contracts").AutomationSettings | null;
    localModelEndpoint: string | null;
    aiRouting: import("@bao/shared/types/ai").AIRouting;
    providerDiagnostics: {
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
    preferredProvider: "claude" | "gemini" | "huggingface" | "local" | "openai";
    language: "en-US" | "es-ES" | "fr-FR" | "ja-JP" | null;
    notifications: NotificationPreferences | null;
    preferredModel: string | null;
    theme: import("@bao/shared/constants/branding").AppDataTheme;
    brandSettings: import("@bao/shared/types/settings-contracts").BrandSettings;
    geminiApiKey: string | null;
    openaiApiKey: string | null;
    claudeApiKey: string | null;
    huggingfaceToken: string | null;
    hasGeminiKey: boolean;
    hasOpenaiKey: boolean;
    hasClaudeKey: boolean;
    hasHuggingfaceToken: boolean;
    hasEmailTransportPassword: boolean;
    hasLocalKey: boolean;
    jobTaxonomy: import("@bao/shared/types/jobs-taxonomy").JobTaxonomySettings;
    createdAt: string;
    emailTransportSettings: import("@bao/shared/types/settings-contracts").EmailTransportSettings | null;
    id: string;
    localModelName: string | null;
    updatedAt: string;
}>;
export declare const testProviderConnection: (body: {
    provider: AIProviderType;
    key: string;
    model?: string;
}) => Promise<{
    error?: undefined;
    valid: boolean;
    provider: "local";
    diagnosticCode: "error";
    message: string;
    availableModels?: undefined;
    selectedModel?: undefined;
} | {
    error?: undefined;
    valid: boolean;
    provider: "local";
    diagnosticCode: "empty-model-list" | "error" | "healthy" | "invalid-model" | "timeout" | "unconfigured" | "unreachable";
    message: string | undefined;
    availableModels: string[] | undefined;
    selectedModel: string | undefined;
} | {
    message?: undefined;
    availableModels?: undefined;
    selectedModel?: undefined;
    valid: boolean;
    provider: "claude" | "gemini" | "huggingface" | "openai";
    error: string;
    diagnosticCode?: undefined;
} | {
    error?: undefined;
    availableModels?: undefined;
    selectedModel?: undefined;
    valid: boolean;
    provider: "claude" | "gemini" | "huggingface" | "openai";
    diagnosticCode: "error" | "healthy";
    message: string | undefined;
}>;
export {};
