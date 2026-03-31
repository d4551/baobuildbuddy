import {
  AI_PROVIDER_DEFAULT,
  AI_PROVIDER_DEFAULT_ORDER,
  DEFAULT_AI_ROUTING,
  LOCAL_AI_AUTO_DETECT_MODEL,
  normalizeAIRouting,
} from "@bao/shared/constants/ai-provider";
import type {
  AIProviderConfig,
  AIProviderStatus,
  AIProviderType,
  AIResponse,
  AIRouting,
  GenerateOptions,
} from "@bao/shared/types/ai";
import { TEST_AI_PROVIDER_NAME } from "./ai-deterministic-provider";
import { detectLocalProviders, getProviderStatuses } from "./ai-provider-diagnostics";
import {
  buildGenerateFailureResponse,
  buildStreamFailure,
  generateWithFallback,
  mergePromptWithContext,
  streamWithFallback,
  toProviderOptions,
} from "./ai-provider-fallback";
import {
  buildProviderConfigs,
  createDeterministicServiceState,
  createProvider,
  resolvePreferredProvider,
} from "./ai-provider-config";
import {
  buildFallbackOrder,
  buildProviderOrder,
  initializeProviders,
  rebuildFallbackOrderFromProviders,
  resolveRoutingTarget,
} from "./ai-provider-state";
import type { AIProvider } from "./provider-interface";
import { settle } from "@bao/shared/utils/promise";
import { isTestRuntime } from "../../config/env";

type AIServiceSettings = Parameters<typeof buildProviderConfigs>[0];

/**
 * Multi-provider AI service with fallback capabilities
 */
export class AIService {
  private providers: Map<AIProviderType, AIProvider> = new Map();
  private preferredProvider?: AIProviderType;
  private routing: AIRouting = DEFAULT_AI_ROUTING;
  private fallbackOrder: AIProviderType[] = [];

  constructor(
    configs: AIProviderConfig[],
    preferredProvider?: AIProviderType,
    routing?: AIRouting,
  ) {
    this.preferredProvider = preferredProvider;
    this.routing = normalizeAIRouting(routing, preferredProvider ?? AI_PROVIDER_DEFAULT);
    this.providers = initializeProviders(configs);
    this.fallbackOrder = buildFallbackOrder(configs, this.preferredProvider);
  }

  /**
   * Create an AIService from a settings DB row.
   * Converts the flat settings config into AIProviderConfig[] format.
   * Used by WebSocket handlers, route handlers, and services.
   */
  static fromSettings(settings?: AIServiceSettings): AIService {
    if (isTestRuntime) {
      return AIService.createDeterministicTestService();
    }

    const configs = buildProviderConfigs(settings);
    const preferredProvider = resolvePreferredProvider(
      settings?.aiRouting?.chat?.provider ?? settings?.preferredProvider,
    );
    const routing = normalizeAIRouting(
      settings?.aiRouting,
      preferredProvider,
      settings?.preferredModel,
    );
    return new AIService(configs, preferredProvider, routing);
  }

  private static createDeterministicTestService(): AIService {
    const service = new AIService([], TEST_AI_PROVIDER_NAME, DEFAULT_AI_ROUTING);
    const deterministicState = createDeterministicServiceState();
    service.providers = deterministicState.providers;
    service.fallbackOrder = deterministicState.fallbackOrder;
    service.preferredProvider = deterministicState.preferredProvider;
    service.routing = deterministicState.routing;
    return service;
  }

  private refreshFallbackOrder(): void {
    this.fallbackOrder = rebuildFallbackOrderFromProviders(this.providers, this.preferredProvider);
  }

  private async resolveHealthyProviderOrder(options?: GenerateOptions): Promise<AIProviderType[]> {
    const baseOrder = buildProviderOrder(
      this.fallbackOrder,
      this.routing,
      this.preferredProvider,
      options,
    );
    const availabilityResult = await settle(this.getAvailableProviders());
    if (availabilityResult.status === "rejected") {
      return baseOrder;
    }

    const healthyProviders = new Set(
      availabilityResult.value
        .filter((status) => status.available)
        .map((status) => status.provider),
    );
    if (healthyProviders.size === 0) {
      return baseOrder;
    }

    const healthyOrder = baseOrder.filter((provider) => healthyProviders.has(provider));
    return healthyOrder.length > 0 ? healthyOrder : baseOrder;
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
    const contextualPrompt = mergePromptWithContext(prompt, options);
    const routingTarget = resolveRoutingTarget(this.routing, this.preferredProvider, options);
    const providerOrder = await this.resolveHealthyProviderOrder(options);
    const providerOptions = toProviderOptions(routingTarget, options);
    const { response, errors } = await generateWithFallback({
      providers: this.providers,
      providerOrder,
      routingTarget,
      contextualPrompt,
      providerOptions,
    });
    if (response) {
      return response;
    }
    return buildGenerateFailureResponse(errors, providerOrder[0] ?? routingTarget.provider);
  }

  /**
   * Stream a response with automatic fallback
   */
  async *stream(
    prompt: string,
    options?: GenerateOptions,
  ): AsyncGenerator<{ chunk: string; provider: AIProviderType }> {
    const contextualPrompt = mergePromptWithContext(prompt, options);
    const routingTarget = resolveRoutingTarget(this.routing, this.preferredProvider, options);
    const providerOrder = await this.resolveHealthyProviderOrder(options);
    const providerOptions = toProviderOptions(routingTarget, options);
    const streamResult = yield* streamWithFallback({
      providers: this.providers,
      providerOrder,
      routingTarget,
      contextualPrompt,
      providerOptions,
    });
    if (streamResult.streamed) {
      return;
    }
    throw buildStreamFailure(streamResult.errors);
  }

  /**
   * Get status of all providers
   */
  async getAvailableProviders(): Promise<AIProviderStatus[]> {
    return getProviderStatuses(this.providers, (providerType) => this.getActiveModel(providerType));
  }

  /**
   * Detect local AI providers (RamaLama, Ollama)
   */
  async detectLocalProviders(): Promise<
    Array<{
      baseUrl: string;
      name: string;
      available: boolean;
      availableModels?: readonly string[];
      diagnosticCode?: AIProviderStatus["diagnosticCode"];
      message?: string;
    }>
  > {
    return detectLocalProviders();
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
    const provider = createProvider(config);
    if (!provider) {
      return false;
    }

    this.providers.set(config.provider, provider);
    this.refreshFallbackOrder();
    return true;
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

  /**
   * Get the current purpose-aware routing table.
   */
  getRouting(): AIRouting {
    return normalizeAIRouting(this.routing, this.preferredProvider ?? AI_PROVIDER_DEFAULT);
  }

  /**
   * Get the active model name for a given provider (detected or configured).
   */
  getActiveModel(providerType: AIProviderType): string | null {
    const provider = this.providers.get(providerType);
    if (!provider) return null;
    const model = provider.model;
    return model && model !== LOCAL_AI_AUTO_DETECT_MODEL ? model : null;
  }
}
