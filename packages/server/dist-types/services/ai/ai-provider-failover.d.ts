import type { AIProviderType, AIResponse, GenerateOptions } from "@bao/shared/types/ai";
import type { AIProvider } from "./provider-interface";
export type ProviderFailure = {
    provider: AIProviderType;
    error: string;
};
interface FailoverRequest {
    providers: Map<AIProviderType, AIProvider>;
    providerOrder: AIProviderType[];
    routingTarget: {
        purpose: GenerateOptions["purpose"] extends infer P ? P : string;
        provider: AIProviderType;
        model?: string;
    };
    contextualPrompt: string;
    providerOptions: Omit<GenerateOptions, "messages"> | undefined;
}
export declare const mergePromptWithContext: (prompt: string, options?: GenerateOptions) => string;
export declare const toProviderOptions: (routingTarget: {
    purpose: GenerateOptions["purpose"] extends infer P ? P : string;
    provider: AIProviderType;
    model?: string;
}, options?: GenerateOptions) => Omit<GenerateOptions, "messages"> | undefined;
export type GenerateFailoverResult = {
    success: true;
    data: AIResponse;
    errors: ProviderFailure[];
} | {
    success: false;
    error: {
        code: "ALL_PROVIDERS_GENERATE_FAILED";
        message: string;
    };
    errors: ProviderFailure[];
};
export declare const generateWithProviderFailover: (request: FailoverRequest) => Promise<GenerateFailoverResult>;
export declare const buildGenerateFailure: (errors: ProviderFailure[]) => Error;
export declare const streamWithProviderFailover: (request: FailoverRequest) => AsyncGenerator<{
    chunk: string;
    provider: AIProviderType;
}, {
    streamed: boolean;
    errors: ProviderFailure[];
}>;
export declare const buildStreamFailure: (errors: ProviderFailure[]) => Error;
export {};
