import type { AIProviderStatus, AIProviderType } from "@bao/shared";
import type { AIProvider } from "./provider-interface";
export declare const getProviderStatuses: (providers: Map<AIProviderType, AIProvider>, getActiveModel: (providerType: AIProviderType) => string | null) => Promise<AIProviderStatus[]>;
export declare const detectLocalProviders: () => Promise<Array<{
    baseUrl: string;
    name: string;
    available: boolean;
    availableModels?: readonly string[];
    diagnosticCode?: AIProviderStatus["diagnosticCode"];
    message?: string;
}>>;
