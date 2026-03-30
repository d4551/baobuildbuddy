import type { AIRouting, AIProviderConfig, AIProviderStatus, AIProviderType, AIResponse, GenerateOptions } from "@bao/shared";
import { buildProviderConfigs } from "./ai-provider-config";
import type { AIProvider } from "./provider-interface";
type AIServiceSettings = Parameters<typeof buildProviderConfigs>[0];
/**
 * Multi-provider AI service with fallback capabilities
 */
export declare class AIService {
    private providers;
    private preferredProvider?;
    private routing;
    private fallbackOrder;
    constructor(configs: AIProviderConfig[], preferredProvider?: AIProviderType, routing?: AIRouting);
    /**
     * Create an AIService from a settings DB row.
     * Converts the flat settings config into AIProviderConfig[] format.
     * Used by WebSocket handlers, route handlers, and services.
     */
    static fromSettings(settings?: AIServiceSettings): AIService;
    private static isTestRuntime;
    private static createDeterministicTestService;
    private refreshFallbackOrder;
    /**
     * Get a specific provider by name
     */
    getProvider(name?: AIProviderType): AIProvider | null;
    /**
     * Generate a response with automatic fallback
     */
    generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;
    /**
     * Stream a response with automatic fallback
     */
    stream(prompt: string, options?: GenerateOptions): AsyncGenerator<{
        chunk: string;
        provider: AIProviderType;
    }>;
    /**
     * Get status of all providers
     */
    getAvailableProviders(): Promise<AIProviderStatus[]>;
    /**
     * Detect local AI providers (RamaLama, Ollama)
     */
    detectLocalProviders(): Promise<Array<{
        baseUrl: string;
        name: string;
        available: boolean;
        availableModels?: readonly string[];
        diagnosticCode?: AIProviderStatus["diagnosticCode"];
        message?: string;
    }>>;
    /**
     * Update preferred provider
     */
    setPreferredProvider(provider: AIProviderType): void;
    /**
     * Add a new provider at runtime
     */
    addProvider(config: AIProviderConfig): boolean;
    /**
     * Remove a provider
     */
    removeProvider(provider: AIProviderType): boolean;
    /**
     * Get list of configured providers
     */
    getConfiguredProviders(): AIProviderType[];
    /**
     * Get the current fallback order
     */
    getFallbackOrder(): AIProviderType[];
    /**
     * Get the current purpose-aware routing table.
     */
    getRouting(): AIRouting;
    /**
     * Get the active model name for a given provider (detected or configured).
     */
    getActiveModel(providerType: AIProviderType): string | null;
}
export {};
