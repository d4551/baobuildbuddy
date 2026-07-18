import type { AIProviderConfig, AIProviderType, AIRouting } from "@bao/shared/types/ai";
import type { AIProvider } from "./provider-interface";
export type AIServiceSettings = {
    geminiApiKey?: string | null;
    claudeApiKey?: string | null;
    openaiApiKey?: string | null;
    huggingfaceToken?: string | null;
    localModelEndpoint?: string | null;
    localModelName?: string | null;
    aiRouting?: AIRouting | null;
    preferredProvider?: string | null;
    preferredModel?: string | null;
};
export declare const appendOptionalProviderConfig: (configs: AIProviderConfig[], provider: Exclude<AIProviderType, "local" | "huggingface">, apiKey?: string | null) => void;
export declare const buildProviderConfigs: (settings?: AIServiceSettings) => AIProviderConfig[];
export declare const resolvePreferredProvider: (preferredProvider?: string | null) => AIProviderType;
export declare const canCreateLocalProvider: (config: AIProviderConfig) => boolean;
export declare const isConfiguredProviderConfig: (config: AIProviderConfig) => boolean;
export declare const createProvider: (config: AIProviderConfig) => AIProvider | null;
export declare const createDeterministicServiceState: () => {
    providerFailoverOrder: ["claude" | "gemini" | "huggingface" | "local" | "openai"];
    preferredProvider: "claude" | "gemini" | "huggingface" | "local" | "openai";
    providers: Map<"claude" | "gemini" | "huggingface" | "local" | "openai", AIProvider>;
    routing: AIRouting;
};
