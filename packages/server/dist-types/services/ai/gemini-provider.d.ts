import type { AIResponse, GenerateOptions } from "@bao/shared";
import { BaseAIProvider } from "./provider-interface";
/**
 * Google Gemini AI Provider
 */
export declare class GeminiProvider extends BaseAIProvider {
    name: "gemini";
    model: string;
    private client;
    private generativeModel;
    constructor(apiKey: string, model?: string);
    generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;
    stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
    isAvailable(): Promise<boolean>;
}
