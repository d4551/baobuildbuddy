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
    /**
     * Sampling parameters were removed from the Messages API on Claude Opus 4.7 and
     * every model after it, and the provider's default model is one of them — so
     * always sending `temperature` made every request a `400`. Spread this instead
     * of setting the field, so the key is absent (not `undefined`) on those models.
     */
    private resolveSamplingParameters;
    generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;
    stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
    isAvailable(): Promise<boolean>;
}
