import { AIService } from "../services/ai/ai-service";
export declare function getAISettingsRow(): Promise<{
    id: string;
    geminiApiKey: string | null;
    openaiApiKey: string | null;
    claudeApiKey: string | null;
    huggingfaceToken: string | null;
    localModelEndpoint: string | null;
    localModelName: string | null;
    aiRouting: import("@bao/shared/types/ai").AIRouting | null;
    preferredProvider: string | null;
    preferredModel: string | null;
    theme: string | null;
    language: string | null;
    brandSettings: import("@bao/shared/types/settings-contracts").BrandSettings | null;
    notifications: Record<string, boolean> | null;
    automationSettings: import("@bao/shared/types/settings-contracts").AutomationSettings | null;
    emailTransportSettings: import("@bao/shared/types/settings-contracts").EmailTransportSettings | null;
    emailTransportPassword: string | null;
    createdAt: string;
    updatedAt: string;
}>;
export declare function getAIService(settingsRow?: Awaited<ReturnType<typeof getAISettingsRow>>): Promise<AIService>;
export declare function buildProviderModelsResponse(): Promise<import("../services/ai/control-plane").AIControlPlaneState | {
    providers: {
        id: "openai" | "huggingface" | "local" | "gemini" | "claude";
        nameKey: string;
        descriptionKey: string;
        iconId: "openai" | "huggingface" | "local" | "gemini" | "claude";
        models: string[];
        available: boolean;
        health: "unconfigured";
    }[];
    error: string;
}>;
