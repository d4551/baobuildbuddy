import type { AIRouting, AIProviderConfig, AIProviderType } from "@bao/shared";
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
export declare const createProvider: (config: AIProviderConfig) => AIProvider | null;
export declare const createDeterministicServiceState: () => {
    fallbackOrder: AIProviderType[];
    preferredProvider: "gemini" | "claude" | "openai" | "huggingface" | "local";
    providers: Map<"gemini" | "claude" | "openai" | "huggingface" | "local", AIProvider>;
    routing: AIRouting;
};
