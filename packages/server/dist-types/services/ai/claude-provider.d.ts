import type { AIResponse, GenerateOptions } from "@bao/shared/types/ai";
import { BaseAIProvider } from "./provider-interface";
/**
 * Anthropic Claude AI Provider
 */
export declare class ClaudeProvider extends BaseAIProvider {
    name: "claude";
    model: string;
    private client;
    constructor(apiKey: string, model?: string);
    private resolveModel;
    generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;
    stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
    isAvailable(): Promise<boolean>;
}
