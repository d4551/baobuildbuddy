import type {
  AIProviderConfig,
  AIProviderStatus,
  AIProviderType,
  AIResponse,
  GenerateOptions,
} from "@bao/shared";
import { AI_CHAT_CONTEXT_MESSAGE_LIMIT, AI_PROVIDER_DEFAULT_ORDER } from "@bao/shared";
import { ClaudeProvider } from "./claude-provider";
import { GeminiProvider } from "./gemini-provider";
import { HuggingFaceProvider } from "./huggingface-provider";
import { LocalProvider } from "./local-provider";
import { OpenAIProvider } from "./openai-provider";
import type { AIProvider } from "./provider-interface";

const TEST_AI_PROVIDER_NAME = "local" as const;
const TEST_AI_MODEL_NAME = "deterministic-test-model";
const TEST_AI_MAX_QUESTION_COUNT = 12;
const UNKNOWN_ERROR_MESSAGE = "Unknown error";
const EXACT_QUESTION_COUNT_PATTERN = /exactly\s+(\d+)\s+questions/i;
const GENERATE_QUESTION_COUNT_PATTERN = /generate\s+(\d+)\s+interview questions/i;

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;

function parseQuestionCount(prompt: string): number {
  const exactMatch = prompt.match(EXACT_QUESTION_COUNT_PATTERN);
  const generateMatch = prompt.match(GENERATE_QUESTION_COUNT_PATTERN);
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

type ProviderFailure = { provider: AIProviderType; error: string };

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

  generate(prompt: string): Promise<AIResponse> {
    const startedAt = Date.now();
    const content = buildDeterministicContent(prompt);
    const completedAt = Date.now();
    return Promise.resolve({
      id: `test-${startedAt}`,
      provider: this.name,
      model: this.model,
      content,
      timing: {
        startedAt,
        completedAt,
        totalTime: completedAt - startedAt,
      },
    });
  }

  stream(prompt: string): AsyncGenerator<string> {
    const content = buildDeterministicContent(prompt);
    return (async function* streamDeterministicContent(): AsyncGenerator<string> {
      await Promise.resolve();
      yield content;
    })();
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
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

  private static canCreateLocalProvider(config: AIProviderConfig): boolean {
    return (
      config.provider === "local" &&
      typeof config.baseUrl === "string" &&
      config.baseUrl.trim().length > 0 &&
      URL.canParse(config.baseUrl)
    );
  }

  private static createProvider(config: AIProviderConfig): AIProvider | null {
    switch (config.provider) {
      case "gemini":
        return config.apiKey ? new GeminiProvider(config.apiKey, config.model) : null;
      case "claude":
        return config.apiKey ? new ClaudeProvider(config.apiKey, config.model) : null;
      case "openai":
        return config.apiKey ? new OpenAIProvider(config.apiKey, config.model) : null;
      case "huggingface":
        // HuggingFace works without API key (free tier)
        return new HuggingFaceProvider(config.apiKey, config.model);
      case "local":
        if (!AIService.canCreateLocalProvider(config)) {
          return null;
        }
        return new LocalProvider(config.baseUrl, config.model || "auto-detect");
      default:
        return null;
    }
  }

  /**
   * Initialize AI providers based on configurations
   */
  private initializeProviders(configs: AIProviderConfig[]): void {
    for (const config of configs) {
      if (!config.enabled) continue;
      const provider = AIService.createProvider(config);
      if (provider) {
        this.providers.set(config.provider, provider);
      }
    }

    // Always ensure HuggingFace is available as fallback (free tier)
    if (!this.providers.has("huggingface")) {
      this.providers.set("huggingface", new HuggingFaceProvider());
    }

    // Auto-detect local model if provider exists but model is a placeholder
    const localProvider = this.providers.get("local");
    if (localProvider && (localProvider as LocalProvider).model === "auto-detect") {
      const baseUrl = (localProvider as LocalProvider).baseUrl;
      if (typeof baseUrl === "string" && baseUrl.trim().length > 0) {
        void LocalProvider.detectFirstModel(baseUrl).then((detected) => {
          if (detected) {
            (localProvider as LocalProvider).model = detected;
          }
        });
      }
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
      return;
    }

    const { temperature, maxTokens, topP, topK, timeout, systemPrompt } = options;
    return {
      temperature,
      maxTokens,
      topP,
      topK,
      timeout,
      systemPrompt,
    };
  }

  private static pushProviderError(
    errors: ProviderFailure[],
    provider: AIProviderType,
    error: string,
  ): void {
    errors.push({ provider, error });
  }

  private static buildFailureMessage(errors: ProviderFailure[]): string {
    return errors.map((entry) => `${entry.provider}: ${entry.error}`).join("; ");
  }

  private async resolveAvailableProvider(
    providerName: AIProviderType,
    errors: ProviderFailure[],
  ): Promise<AIProvider | null> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return null;
    }

    const availability = await provider.isAvailable().then(
      (isAvailable) => ({ isAvailable, error: null as string | null }),
      (error: unknown) => ({ isAvailable: false, error: toErrorMessage(error) }),
    );
    if (availability.error) {
      AIService.pushProviderError(errors, providerName, availability.error);
      return null;
    }
    if (!availability.isAvailable) {
      AIService.pushProviderError(errors, providerName, "Provider not available");
      return null;
    }
    return provider;
  }

  private async generateFromProvider(
    providerName: AIProviderType,
    contextualPrompt: string,
    providerOptions: Omit<GenerateOptions, "messages"> | undefined,
    errors: ProviderFailure[],
  ): Promise<AIResponse | null> {
    const provider = await this.resolveAvailableProvider(providerName, errors);
    if (!provider) {
      return null;
    }

    const generationResult = await provider.generate(contextualPrompt, providerOptions).then(
      (response) => ({ response, error: null as string | null }),
      (error: unknown) => ({ response: null as AIResponse | null, error: toErrorMessage(error) }),
    );
    if (generationResult.error) {
      AIService.pushProviderError(errors, providerName, generationResult.error);
      return null;
    }

    if (!generationResult.response) {
      return null;
    }
    if (generationResult.response.error) {
      AIService.pushProviderError(errors, providerName, generationResult.response.error);
      return null;
    }
    return generationResult.response;
  }

  private async generateWithFallback(
    index: number,
    contextualPrompt: string,
    providerOptions: Omit<GenerateOptions, "messages"> | undefined,
    errors: ProviderFailure[],
  ): Promise<AIResponse | null> {
    const providerName = this.fallbackOrder[index];
    if (!providerName) {
      return null;
    }

    const response = await this.generateFromProvider(
      providerName,
      contextualPrompt,
      providerOptions,
      errors,
    );
    if (response) {
      return response;
    }
    return this.generateWithFallback(index + 1, contextualPrompt, providerOptions, errors);
  }

  private buildGenerateFailureResponse(errors: ProviderFailure[]): AIResponse {
    const now = Date.now();
    const errorMessage = AIService.buildFailureMessage(errors);
    return {
      id: `failed-${now}`,
      provider: this.preferredProvider || AI_PROVIDER_DEFAULT_ORDER[0],
      model: "none",
      content: "",
      error: `All providers failed: ${errorMessage}`,
      timing: {
        startedAt: now,
        completedAt: now,
        totalTime: 0,
      },
    };
  }

  private async *streamProviderIterator(
    providerName: AIProviderType,
    iterator: AsyncIterator<string>,
    errors: ProviderFailure[],
    hasYielded: boolean,
  ): AsyncGenerator<{ chunk: string; provider: AIProviderType }, { hasYielded: boolean; failed: boolean }> {
    const nextChunk = await iterator.next().then(
      (result) => ({ result, error: null as string | null }),
      (error: unknown) => ({
        result: null as IteratorResult<string> | null,
        error: toErrorMessage(error),
      }),
    );
    if (nextChunk.error) {
      AIService.pushProviderError(errors, providerName, nextChunk.error);
      return { hasYielded, failed: true };
    }
    if (!nextChunk.result || nextChunk.result.done) {
      return { hasYielded, failed: false };
    }
    yield { chunk: nextChunk.result.value, provider: providerName };
    return yield* this.streamProviderIterator(providerName, iterator, errors, true);
  }

  private async *streamProvider(
    providerName: AIProviderType,
    contextualPrompt: string,
    providerOptions: Omit<GenerateOptions, "messages"> | undefined,
    errors: ProviderFailure[],
  ): AsyncGenerator<{ chunk: string; provider: AIProviderType }, { hasYielded: boolean; failed: boolean }> {
    const provider = await this.resolveAvailableProvider(providerName, errors);
    if (!provider) {
      return { hasYielded: false, failed: true };
    }
    const iterator = provider.stream(contextualPrompt, providerOptions)[Symbol.asyncIterator]();
    return yield* this.streamProviderIterator(providerName, iterator, errors, false);
  }

  private async *streamWithFallback(
    index: number,
    contextualPrompt: string,
    providerOptions: Omit<GenerateOptions, "messages"> | undefined,
    errors: ProviderFailure[],
  ): AsyncGenerator<{ chunk: string; provider: AIProviderType }, boolean> {
    const providerName = this.fallbackOrder[index];
    if (!providerName) {
      return false;
    }

    const streamResult = yield* this.streamProvider(
      providerName,
      contextualPrompt,
      providerOptions,
      errors,
    );
    if (streamResult.hasYielded && !streamResult.failed) {
      return true;
    }
    return yield* this.streamWithFallback(index + 1, contextualPrompt, providerOptions, errors);
  }

  /**
   * Generate a response with automatic fallback
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const errors: ProviderFailure[] = [];
    const contextualPrompt = AIService.mergePromptWithContext(prompt, options);
    const providerOptions = AIService.toProviderOptions(options);
    const response = await this.generateWithFallback(0, contextualPrompt, providerOptions, errors);
    if (response) {
      return response;
    }
    return this.buildGenerateFailureResponse(errors);
  }

  /**
   * Stream a response with automatic fallback
   */
  async *stream(
    prompt: string,
    options?: GenerateOptions,
  ): AsyncGenerator<{ chunk: string; provider: AIProviderType }> {
    const errors: ProviderFailure[] = [];
    const contextualPrompt = AIService.mergePromptWithContext(prompt, options);
    const providerOptions = AIService.toProviderOptions(options);
    const streamed = yield* this.streamWithFallback(0, contextualPrompt, providerOptions, errors);
    if (streamed) {
      return;
    }

    const errorMessage = AIService.buildFailureMessage(errors);
    throw new Error(`All providers failed to stream: ${errorMessage}`);
  }

  /**
   * Get status of all providers
   */
  async getAvailableProviders(): Promise<AIProviderStatus[]> {
    const checks = Array.from(this.providers.entries()).map(([providerName, provider]) =>
      provider.isAvailable().then(
        (available): AIProviderStatus => ({
          provider: providerName,
          available,
          health: available ? "healthy" : "down",
          lastCheck: Date.now(),
        }),
        (error: unknown): AIProviderStatus => ({
          provider: providerName,
          available: false,
          health: "down",
          lastCheck: Date.now(),
          error: toErrorMessage(error),
        }),
      ),
    );
    return Promise.all(checks);
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
    const provider = AIService.createProvider(config);
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
}
