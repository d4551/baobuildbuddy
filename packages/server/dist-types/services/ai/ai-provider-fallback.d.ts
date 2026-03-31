import type { AIProviderType, AIResponse, GenerateOptions } from "@bao/shared/types/ai";
import type { AIProvider } from "./provider-interface";
export type ProviderFailure = {
    provider: AIProviderType;
    error: string;
};
interface FallbackRequest {
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
export declare const buildFailureMessage: (errors: ProviderFailure[]) => string;
export declare const mergePromptWithContext: (prompt: string, options?: GenerateOptions) => string;
export declare const toProviderOptions: (routingTarget: {
    purpose: GenerateOptions["purpose"] extends infer P ? P : string;
    provider: AIProviderType;
    model?: string;
}, options?: GenerateOptions) => Omit<GenerateOptions, "messages"> | undefined;
export declare const generateWithFallback: (request: FallbackRequest) => Promise<{
    response: AIResponse | null;
    errors: ProviderFailure[];
}>;
export declare const buildGenerateFailureResponse: (errors: ProviderFailure[], fallbackProvider: AIProviderType) => AIResponse;
export declare const streamWithFallback: (request: FallbackRequest) => AsyncGenerator<{
    chunk: string;
    provider: AIProviderType;
}, {
    streamed: boolean;
    errors: ProviderFailure[];
}>;
export declare const buildStreamFailure: (errors: ProviderFailure[]) => Error;
export {};
