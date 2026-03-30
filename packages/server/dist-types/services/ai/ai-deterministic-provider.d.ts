import type { AIProviderType, AIResponse } from "@bao/shared";
import type { AIProvider } from "./provider-interface";
export declare const TEST_AI_PROVIDER_NAME: AIProviderType;
export declare const TEST_AI_MODEL_NAME = "deterministic-test-model";
export declare class DeterministicTestProvider implements AIProvider {
    name: AIProviderType;
    model: string;
    generate(prompt: string): Promise<AIResponse>;
    stream(prompt: string): AsyncGenerator<string>;
    isAvailable(): Promise<boolean>;
}
