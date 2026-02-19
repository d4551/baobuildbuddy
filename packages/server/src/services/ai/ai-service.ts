import {
  AI_PROVIDER_DEFAULT_ORDER,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
} from "@navi/shared";
import type {
  AIProviderConfig,
  AIProviderStatus,
  AIProviderType,
  AIResponse,
  GenerateOptions,
} from "@navi/shared";
import { ClaudeProvider } from "./claude-provider";
import { GeminiProvider } from "./gemini-provider";
import { HuggingFaceProvider } from "./huggingface-provider";
import { LocalProvider } from "./local-provider";
import { OpenAIProvider } from "./openai-provider";
import type { AIProvider } from "./provider-interface";

/**
 * Multi-provider AI service with fallback capabilities
 */
export class AIService {
  private providers: Map<AIProviderType, AIProvider> = new Map();
  private preferredProvider?: AIProviderType;
  private fallbackOrder: AIProviderType[] = [];

  constructor(configs: AIProviderConfig[], preferredProvider?: AIProviderType) {
    this.preferredProvider = preferredProvider;
    this.initializeProviders(configs);
    this.rebuildFallbackOrder(configs);
  }

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
  }): AIService {
    const configs: AIProviderConfig[] = [
      {
        provider: "local",
        baseUrl: settings?.localModelEndpoint || LOCAL_AI_DEFAULT_ENDPOINT,
        model: settings?.localModelName || LOCAL_AI_DEFAULT_MODEL,
        enabled: true,
      },
    ];

    if (settings?.geminiApiKey) {
      configs.push({
        provider: "gemini",
        apiKey: settings.geminiApiKey,
        enabled: true,
      });
    }

    if (settings?.claudeApiKey) {
      configs.push({
        provider: "claude",
        apiKey: settings.claudeApiKey,
        enabled: true,
      });
    }

    if (settings?.openaiApiKey) {
      configs.push({
        provider: "openai",
        apiKey: settings.openaiApiKey,
        enabled: true,
      });
    }

    // HuggingFace free tier — always available, token optional
    configs.push({
      provider: "huggingface",
      apiKey: settings?.huggingfaceToken || undefined,
      enabled: true,
    });

    const preferredProvider = AIService.resolvePreferredProvider(settings?.preferredProvider);
    return new AIService(configs, preferredProvider);
  }

  /**
   * Resolve preferred provider to a known supported provider.
   */
  private static resolvePreferredProvider(preferredProvider?: string | null): AIProviderType {
    if (!preferredProvider) return AI_PROVIDER_DEFAULT_ORDER[0];
    return AI_PROVIDER_DEFAULT_ORDER.includes(preferredProvider as AIProviderType)
      ? (preferredProvider as AIProviderType)
      : AI_PROVIDER_DEFAULT_ORDER[0];
  }

  /**
   * Initialize AI providers based on configurations
   */
  private initializeProviders(configs: AIProviderConfig[]): void {
    for (const config of configs) {
      if (!config.enabled) continue;

      try {
        let provider: AIProvider | null = null;

        switch (config.provider) {
          case "gemini":
            if (config.apiKey) {
              provider = new GeminiProvider(config.apiKey, config.model);
            }
            break;

          case "claude":
            if (config.apiKey) {
              provider = new ClaudeProvider(config.apiKey, config.model);
            }
            break;

          case "openai":
            if (config.apiKey) {
              provider = new OpenAIProvider(config.apiKey, config.model);
            }
            break;

          case "huggingface":
            // HuggingFace works without API key (free tier)
            provider = new HuggingFaceProvider(config.apiKey, config.model);
            break;

          case "local":
            provider = new LocalProvider(
              config.baseUrl || LOCAL_AI_DEFAULT_ENDPOINT,
              config.model || LOCAL_AI_DEFAULT_MODEL,
            );
            break;
        }

        if (provider) {
          this.providers.set(config.provider, provider);
        }
      } catch (error) {
        console.error(`Failed to initialize ${config.provider} provider:`, error);
      }
    }

    // Always ensure HuggingFace is available as fallback (free tier)
    if (!this.providers.has("huggingface")) {
      this.providers.set("huggingface", new HuggingFaceProvider());
    }
  }

  /**
   * Setup fallback order for providers
   */
  private rebuildFallbackOrder(configs: AIProviderConfig[]): void {
    const enabledProviders: AIProviderType[] = Array.from(
      new Set(configs.filter((config) => config.enabled).map((config) => config.provider)),
    );

    const ordered: AIProviderType[] = [];

    const preferred =
      this.preferredProvider && enabledProviders.includes(this.preferredProvider)
        ? this.preferredProvider
        : undefined;

    if (preferred) ordered.push(preferred);

    for (const provider of AI_PROVIDER_DEFAULT_ORDER) {
      if (!ordered.includes(provider) && enabledProviders.includes(provider)) {
        ordered.push(provider);
      }
    }

    for (const provider of enabledProviders) {
      if (!ordered.includes(provider)) ordered.push(provider);
    }

    this.fallbackOrder = ordered;
  }

  private refreshFallbackOrder(): void {
    this.rebuildFallbackOrder(
      Array.from(this.providers.keys()).map((provider) => ({
        provider,
        enabled: true,
      })) as AIProviderConfig[],
    );
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name?: AIProviderType): AIProvider | null {
    if (name) {
      return this.providers.get(name) || null;
    }

    // Return preferred provider or first in fallback order
    if (this.preferredProvider && this.providers.has(this.preferredProvider)) {
      return this.providers.get(this.preferredProvider) || null;
    }

    return this.providers.values().next().value || null;
  }

  /**
   * Generate a response with automatic fallback
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const errors: Array<{ provider: AIProviderType; error: string }> = [];

    // Try each provider in fallback order
    for (const providerName of this.fallbackOrder) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        // Check if provider is available
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          errors.push({
            provider: providerName,
            error: "Provider not available",
          });
          continue;
        }

        // Try to generate
        const response = await provider.generate(prompt, options);

        // If there's an error in the response, try next provider
        if (response.error) {
          errors.push({
            provider: providerName,
            error: response.error,
          });
          continue;
        }

        // Success!
        return response;
      } catch (error) {
        errors.push({
          provider: providerName,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // All providers failed
    const errorMessage = errors.map((e) => `${e.provider}: ${e.error}`).join("; ");

    return {
      id: `failed-${Date.now()}`,
      provider: this.preferredProvider || AI_PROVIDER_DEFAULT_ORDER[0],
      model: "none",
      content: "",
      error: `All providers failed: ${errorMessage}`,
      timing: {
        startedAt: Date.now(),
        completedAt: Date.now(),
        totalTime: 0,
      },
    };
  }

  /**
   * Stream a response with automatic fallback
   */
  async *stream(
    prompt: string,
    options?: GenerateOptions,
  ): AsyncGenerator<{ chunk: string; provider: AIProviderType }> {
    const errors: Array<{ provider: AIProviderType; error: string }> = [];

    // Try each provider in fallback order
    for (const providerName of this.fallbackOrder) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        // Check if provider is available
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          errors.push({
            provider: providerName,
            error: "Provider not available",
          });
          continue;
        }

        // Try to stream
        let hasYielded = false;
        for await (const chunk of provider.stream(prompt, options)) {
          hasYielded = true;
          yield { chunk, provider: providerName };
        }

        // If we successfully yielded at least one chunk, we're done
        if (hasYielded) {
          return;
        }
      } catch (error) {
        errors.push({
          provider: providerName,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // All providers failed
    const errorMessage = errors.map((e) => `${e.provider}: ${e.error}`).join("; ");

    throw new Error(`All providers failed to stream: ${errorMessage}`);
  }

  /**
   * Get status of all providers
   */
  async getAvailableProviders(): Promise<AIProviderStatus[]> {
    const statuses: AIProviderStatus[] = [];

    for (const [providerName, provider] of this.providers) {
      try {
        const available = await provider.isAvailable();
        statuses.push({
          provider: providerName,
          available,
          health: available ? "healthy" : "down",
          lastCheck: Date.now(),
        });
      } catch (error) {
        statuses.push({
          provider: providerName,
          available: false,
          health: "down",
          lastCheck: Date.now(),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return statuses;
  }

  /**
   * Detect local AI providers (RamaLama, Ollama)
   */
  async detectLocalProviders(): Promise<
    Array<{ baseUrl: string; name: string; available: boolean }>
  > {
    return await LocalProvider.detectLocalServers();
  }

  /**
   * Update preferred provider
   */
  setPreferredProvider(provider: AIProviderType): void {
    if (this.providers.has(provider)) {
      this.preferredProvider = provider;
      this.refreshFallbackOrder();
    }
  }

  /**
   * Add a new provider at runtime
   */
  addProvider(config: AIProviderConfig): boolean {
    try {
      let provider: AIProvider | null = null;

      switch (config.provider) {
        case "gemini":
          if (config.apiKey) {
            provider = new GeminiProvider(config.apiKey, config.model);
          }
          break;

        case "claude":
          if (config.apiKey) {
            provider = new ClaudeProvider(config.apiKey, config.model);
          }
          break;

        case "openai":
          if (config.apiKey) {
            provider = new OpenAIProvider(config.apiKey, config.model);
          }
          break;

        case "huggingface":
          provider = new HuggingFaceProvider(config.apiKey, config.model);
          break;

        case "local":
          provider = new LocalProvider(
            config.baseUrl || LOCAL_AI_DEFAULT_ENDPOINT,
            config.model || LOCAL_AI_DEFAULT_MODEL,
          );
          break;
      }

      if (provider) {
        this.providers.set(config.provider, provider);
        this.refreshFallbackOrder();
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to add ${config.provider} provider:`, error);
      return false;
    }
  }

  /**
   * Remove a provider
   */
  removeProvider(provider: AIProviderType): boolean {
    const deleted = this.providers.delete(provider);

    if (deleted) {
      // Remove from fallback order
      this.fallbackOrder = this.fallbackOrder.filter((p) => p !== provider);

      // Update preferred if it was removed
      if (this.preferredProvider === provider) {
        this.preferredProvider = this.fallbackOrder[0];
        if (!this.preferredProvider) {
          this.preferredProvider = AI_PROVIDER_DEFAULT_ORDER[0];
        }
      }

      this.refreshFallbackOrder();
    }

    return deleted;
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): AIProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get the current fallback order
   */
  getFallbackOrder(): AIProviderType[] {
    return [...this.fallbackOrder];
  }
}
