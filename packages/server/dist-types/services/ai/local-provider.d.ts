import type { AIProviderDiagnostic, AIProviderType, AIResponse, GenerateOptions } from "@bao/shared/types/ai";
import { BaseAIProvider } from "./provider-interface";
/**
 * Local AI Provider for RamaLama, Ollama, and other OpenAI Chat Completions local servers
 * Uses the OpenAI SDK pointed at a local endpoint
 */
export declare class LocalProvider extends BaseAIProvider {
    name: AIProviderType;
    model: string;
    private client;
    constructor(baseUrl?: string, model?: string, apiKey?: string);
    /**
     * Per-request model wins, but only if the local server actually serves it.
     *
     * Routing fills the per-request model from `preferredModel`, which is a
     * cross-provider preference seeded with a default name. When that name is not
     * installed locally the server 404s and the whole call fails with "All providers
     * failed to generate" — even though the operator had configured a working model
     * under `localModelName`. Falling back to the configured (or auto-detected) model
     * keeps an explicit local configuration authoritative for the local provider.
     */
    private resolveRequestedModel;
    private createCompletion;
    generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;
    stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
    isAvailable(): Promise<boolean>;
    private resolveModelIfNeeded;
    /**
     * Query the local server for available models and return the first one.
     * Returns null if the server is unreachable or has no models.
     */
    static detectFirstModel(baseUrl: string): Promise<string | null>;
    /** Model ids the configured local endpoint serves. */
    static listModelIds(baseUrl: string): Promise<readonly string[]>;
    /**
     * Inspect a local OpenAI Chat Completions endpoint and return structured diagnostics.
     */
    static inspectEndpoint(baseUrl: string, selectedModel?: string): Promise<AIProviderDiagnostic>;
    /**
     * Static method to detect local AI servers
     */
    static detectLocalServers(): Promise<Array<{
        id?: string;
        baseUrl: string;
        name: string;
        available: boolean;
        availableModels?: readonly string[];
        diagnosticCode?: AIProviderDiagnostic["code"];
        message?: string;
    }>>;
}
