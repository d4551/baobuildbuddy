import type { AIResponse, GenerateOptions } from "@bao/shared";
import { BaseAIProvider } from "./provider-interface";
/**
 * Hugging Face AI Provider
 * Works with free tier (no API key required) or with API token for better rate limits
 */
export declare class HuggingFaceProvider extends BaseAIProvider {
    name: "huggingface";
    model: string;
    private client;
    constructor(apiKey?: string, model?: string);
    generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;
    stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
    isAvailable(): Promise<boolean>;
}
