import type { AIResponse, GenerateOptions } from "@bao/shared";
import { BaseAIProvider } from "./provider-interface";
/**
 * Local AI Provider for RamaLama, Ollama, and other OpenAI-compatible local servers
 * Uses the OpenAI SDK pointed at a local endpoint
 */
export declare class LocalProvider extends BaseAIProvider {
    name: "local";
    model: string;
    private client;
    constructor(baseUrl?: string, model?: string, apiKey?: string);
    generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;
    stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
    isAvailable(): Promise<boolean>;
    /**
     * Query the local server for available models and return the first one.
     * Returns null if the server is unreachable or has no models.
     */
    static detectFirstModel(baseUrl: string): Promise<string | null>;
    /**
     * Static method to detect local AI servers
     */
    static detectLocalServers(): Promise<Array<{
        id?: string;
        baseUrl: string;
        name: string;
        available: boolean;
    }>>;
}
