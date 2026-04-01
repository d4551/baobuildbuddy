import type { AIProviderConfig, AIProviderType, AIRouting, AIRoutingPurpose, GenerateOptions } from "@bao/shared/types/ai";
import type { AIProvider } from "./provider-interface";
export declare const initializeProviders: (configs: AIProviderConfig[]) => Map<AIProviderType, AIProvider>;
export declare const buildFallbackOrder: (configs: readonly AIProviderConfig[], preferredProvider?: AIProviderType) => AIProviderType[];
export declare const rebuildFallbackOrderFromProviders: (providers: ReadonlyMap<AIProviderType, AIProvider>, preferredProvider?: AIProviderType) => AIProviderType[];
export declare const resolveRoutingTarget: (routing: AIRouting, preferredProvider: AIProviderType | undefined, options?: GenerateOptions) => {
    purpose: AIRoutingPurpose;
    provider: AIProviderType;
    model?: string;
};
export declare const buildProviderOrder: (fallbackOrder: readonly AIProviderType[], routing: AIRouting, preferredProvider: AIProviderType | undefined, options?: GenerateOptions) => AIProviderType[];
