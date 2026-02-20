import type { AIProviderConfig, AIProviderStatus, AIProviderType, AIResponse, GenerateOptions } from "@bao/shared";
import type { AIProvider } from "./provider-interface";
/**
 * Multi-provider AI service with fallback capabilities
 */
export declare class AIService {
    private providers;
    private preferredProvider?;
    private fallbackOrder;
    constructor(configs: AIProviderConfig[], preferredProvider?: AIProviderType);
    /**
     * Create an AIService from a settings DB row.
     * Converts the flat settings config into AIProviderConfig[] format.
     * Used by WebSocket handlers, route handlers, and services.
     */
    static fromSettings(settings?: {
        geminiApiKey?: string | null;
        claudeApiKey?: string | null;
        openaiApiKey?: string | null;
        huggingfaceToken?: string | null;
        localModelEndpoint?: string | null;
        localModelName?: string | null;
        preferredProvider?: string | null;
    }): AIService;
    private static isTestRuntime;
    private static createDeterministicTestService;
    /**
     * Resolve preferred provider to a known supported provider.
     */
    private static resolvePreferredProvider;
    private static canCreateLocalProvider;
    private static createProvider;
    /**
     * Initialize AI providers based on configurations
     */
    private initializeProviders;
    /**
     * Setup fallback order for providers
     */
    private rebuildFallbackOrder;
    private refreshFallbackOrder;
    /**
     * Get a specific provider by name
     */
    getProvider(name?: AIProviderType): AIProvider | null;
    private static mergePromptWithContext;
    private static toProviderOptions;
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
}
