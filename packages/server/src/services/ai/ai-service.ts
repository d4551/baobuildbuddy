import { AI_CHAT_CONTEXT_MESSAGE_LIMIT, AI_PROVIDER_DEFAULT_ORDER } from "@bao/shared";
import type {
  AIProviderConfig,
  AIProviderStatus,
  AIProviderType,
  AIResponse,
  GenerateOptions,
} from "@bao/shared";
import { ClaudeProvider } from "./claude-provider";
import { GeminiProvider } from "./gemini-provider";
import { HuggingFaceProvider } from "./huggingface-provider";
import { LocalProvider } from "./local-provider";
import { OpenAIProvider } from "./openai-provider";
import type { AIProvider } from "./provider-interface";

const TEST_AI_PROVIDER_NAME = "local" as const;
const TEST_AI_MODEL_NAME = "deterministic-test-model";
const TEST_AI_MAX_QUESTION_COUNT = 12;

function parseQuestionCount(prompt: string): number {
  const exactMatch = prompt.match(/exactly\s+(\d+)\s+questions/i);
  const generateMatch = prompt.match(/generate\s+(\d+)\s+interview questions/i);
  const matchedValue = exactMatch?.[1] ?? generateMatch?.[1];
  const parsed = matchedValue ? Number.parseInt(matchedValue, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 3;
  }
  return Math.min(parsed, TEST_AI_MAX_QUESTION_COUNT);
}

function parseIncludeFlag(prompt: string, label: string, fallback: boolean): boolean {
  const matcher = new RegExp(`${label}\\s*=\\s*(true|false)`, "i");
  const matched = prompt.match(matcher)?.[1];
  if (matched === "true") return true;
  if (matched === "false") return false;
  return fallback;
}

function buildDeterministicQuestionSet(prompt: string): string {
  const questionCount = parseQuestionCount(prompt);
  const includeTechnical = parseIncludeFlag(prompt, "technical", true);
  const includeBehavioral = parseIncludeFlag(prompt, "behavioral", true);
  const includeStudioSpecific = parseIncludeFlag(prompt, "studio-specific", true);
  const candidateTypes: Array<
    "intro" | "behavioral" | "technical" | "studio-specific" | "closing"
  > = ["intro"];
  if (includeBehavioral) {
    candidateTypes.push("behavioral");
  }
  if (includeTechnical) {
    candidateTypes.push("technical");
  }
  if (includeStudioSpecific) {
    candidateTypes.push("studio-specific");
  }
  candidateTypes.push("closing");

  const questions: Array<{
    id: string;
    question: string;
    type: "intro" | "behavioral" | "technical" | "studio-specific" | "closing";
    followUps: string[];
    expectedDuration: number;
    difficulty: "easy" | "medium" | "hard";
    tags: string[];
  }> = [];

  for (let index = 0; index < questionCount; index += 1) {
    const position = index + 1;
    const type = candidateTypes[index % candidateTypes.length] ?? "behavioral";
    questions.push({
      id: `test-q${position}`,
      question: `Deterministic interview question ${position} for reliable test execution.`,
      type,
      followUps: ["Can you describe your approach?", "What measurable result did you achieve?"],
      expectedDuration: 90,
      difficulty: type === "technical" ? "hard" : "medium",
      tags: ["deterministic", "test"],
    });
  }

  return JSON.stringify(questions);
}

function buildDeterministicFeedback(): string {
  return JSON.stringify({
    score: 78,
    feedback: "Clear structured response with actionable detail.",
    strengths: ["Structured explanation", "Relevant technical context"],
    improvements: ["Add one measurable outcome"],
  });
}

function buildDeterministicFinalAnalysis(): string {
  return JSON.stringify({
    overallScore: 80,
    strengths: ["Clear communication", "Practical technical reasoning"],
    improvements: ["Provide deeper metric context"],
    recommendations: ["Continue using STAR-style response framing"],
    feedback: "Consistent and production-ready interview performance.",
  });
}

function buildDeterministicContent(prompt: string): string {
  const normalizedPrompt = prompt.toLowerCase();

  if (
    normalizedPrompt.includes('"overallscore": 0-100') &&
    normalizedPrompt.includes('"recommendations"')
  ) {
    return buildDeterministicFinalAnalysis();
  }

  if (
    normalizedPrompt.includes('"score": 0-100') &&
    normalizedPrompt.includes('"strengths"') &&
    normalizedPrompt.includes('"improvements"')
  ) {
    return buildDeterministicFeedback();
  }

  if (
    normalizedPrompt.includes("return strict json array only") &&
    normalizedPrompt.includes("interview")
  ) {
    return buildDeterministicQuestionSet(prompt);
  }

  return "Deterministic test response.";
}

class DeterministicTestProvider implements AIProvider {
  name = TEST_AI_PROVIDER_NAME;
  model = TEST_AI_MODEL_NAME;

  async generate(prompt: string): Promise<AIResponse> {
    const startedAt = Date.now();
    const content = buildDeterministicContent(prompt);
    const completedAt = Date.now();
    return {
      id: `test-${startedAt}`,
      provider: this.name,
      model: this.model,
      content,
      timing: {
        startedAt,
        completedAt,
        totalTime: completedAt - startedAt,
      },
    };
  }

  async *stream(prompt: string): AsyncGenerator<string> {
    yield buildDeterministicContent(prompt);
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

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
    if (AIService.isTestRuntime()) {
      return AIService.createDeterministicTestService();
    }

    const localModelEndpoint =
      typeof settings?.localModelEndpoint === "string" && settings.localModelEndpoint.trim()
        ? settings.localModelEndpoint.trim()
        : null;
    const localModelName =
      typeof settings?.localModelName === "string" && settings.localModelName.trim()
        ? settings.localModelName.trim()
        : null;

    const localProviderConfig: AIProviderConfig = {
      provider: "local",
      enabled: true,
      ...(localModelEndpoint ? { baseUrl: localModelEndpoint } : {}),
      ...(localModelName ? { model: localModelName } : {}),
    };
    const configs: AIProviderConfig[] = [localProviderConfig];

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
    const huggingFaceProviderConfig: AIProviderConfig = {
      provider: "huggingface",
      enabled: true,
      ...(settings?.huggingfaceToken ? { apiKey: settings.huggingfaceToken } : {}),
    };
    configs.push(huggingFaceProviderConfig);

    const preferredProvider = AIService.resolvePreferredProvider(settings?.preferredProvider);
    return new AIService(configs, preferredProvider);
  }

  private static isTestRuntime(): boolean {
    return process.env.NODE_ENV === "test" || process.env.BAO_TEST_MODE === "1";
  }

  private static createDeterministicTestService(): AIService {
    const service = new AIService([], TEST_AI_PROVIDER_NAME);
    service.providers.clear();
    service.providers.set(TEST_AI_PROVIDER_NAME, new DeterministicTestProvider());
    service.fallbackOrder = [TEST_AI_PROVIDER_NAME];
    service.preferredProvider = TEST_AI_PROVIDER_NAME;
    return service;
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
            if (
              typeof config.baseUrl === "string" &&
              config.baseUrl.trim().length > 0 &&
              typeof config.model === "string" &&
              config.model.trim().length > 0
            ) {
              provider = new LocalProvider(config.baseUrl, config.model);
            }
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

  private static mergePromptWithContext(prompt: string, options?: GenerateOptions): string {
    const messageHistory = options?.messages;
    if (!messageHistory || messageHistory.length === 0) {
      return prompt;
    }

    const historyLines = messageHistory
      .slice(-AI_CHAT_CONTEXT_MESSAGE_LIMIT)
      .map((message, index) => `${index + 1}. ${message.role.toUpperCase()}: ${message.content}`)
      .join("\n");

    return [
      "Use the following conversation history to keep responses contextually consistent.",
      "Conversation history:",
      historyLines,
      "Current user message:",
      prompt,
    ].join("\n\n");
  }

  private static toProviderOptions(
    options?: GenerateOptions,
  ): Omit<GenerateOptions, "messages"> | undefined {
    if (!options) {
      return undefined;
    }

    const { messages: _messages, ...providerOptions } = options;
    return providerOptions;
  }

  /**
   * Generate a response with automatic fallback
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const errors: Array<{ provider: AIProviderType; error: string }> = [];
    const contextualPrompt = AIService.mergePromptWithContext(prompt, options);
    const providerOptions = AIService.toProviderOptions(options);

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
        const response = await provider.generate(contextualPrompt, providerOptions);

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
    const contextualPrompt = AIService.mergePromptWithContext(prompt, options);
    const providerOptions = AIService.toProviderOptions(options);

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
        for await (const chunk of provider.stream(contextualPrompt, providerOptions)) {
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
          if (
            typeof config.baseUrl === "string" &&
            config.baseUrl.trim().length > 0 &&
            typeof config.model === "string" &&
            config.model.trim().length > 0
          ) {
            provider = new LocalProvider(config.baseUrl, config.model);
          }
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
