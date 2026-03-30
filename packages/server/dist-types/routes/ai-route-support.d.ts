import { AIService } from "../services/ai/ai-service";
export declare function getAISettingsRow(): Promise<{
    id: string;
    geminiApiKey: string | null;
    openaiApiKey: string | null;
    claudeApiKey: string | null;
    huggingfaceToken: string | null;
    localModelEndpoint: string | null;
    localModelName: string | null;
    aiRouting: import("@bao/shared").AIRouting | null;
    preferredProvider: string | null;
    preferredModel: string | null;
    theme: string | null;
    language: string | null;
    brandSettings: import("@bao/shared").BrandSettings | null;
    notifications: Record<string, boolean> | null;
    automationSettings: import("@bao/shared").AutomationSettings | null;
    emailTransportSettings: import("@bao/shared").EmailTransportSettings | null;
    emailTransportPassword: string | null;
    createdAt: string;
    updatedAt: string;
}>;
export declare function getAIService(settingsRow?: Awaited<ReturnType<typeof getAISettingsRow>>): Promise<AIService>;
export declare function buildProviderModelsResponse(): Promise<import("../services/ai/control-plane").AIControlPlaneState | {
    providers: {
        id: "gemini" | "claude" | "openai" | "huggingface" | "local";
        nameKey: string;
        descriptionKey: string;
        iconId: "gemini" | "claude" | "openai" | "huggingface" | "local";
        models: string[];
        available: boolean;
        health: "unconfigured";
    }[];
    error: string;
}>;
