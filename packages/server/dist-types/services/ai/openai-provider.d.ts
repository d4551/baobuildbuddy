import type { AIResponse, GenerateOptions } from "@bao/shared";
import { BaseAIProvider } from "./provider-interface";
/**
 * OpenAI AI Provider
 */
export declare class OpenAIProvider extends BaseAIProvider {
    name: "openai";
    model: string;
    private client;
    constructor(apiKey: string, model?: string);
    generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;
    stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
    isAvailable(): Promise<boolean>;
}
