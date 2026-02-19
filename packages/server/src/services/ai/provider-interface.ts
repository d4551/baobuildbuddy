import type { AIProviderType, AIResponse, GenerateOptions } from "@navi/shared";

/**
 * Common interface for all AI providers
 */
export interface AIProvider {
  name: AIProviderType;
  model: string;

  /**
   * Generate a single response from the AI
   */
  generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;

  /**
   * Stream responses from the AI
   */
  stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;

  /**
   * Check if the provider is available and configured
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Base class providing common functionality for AI providers
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract name: AIProviderType;
  abstract model: string;

  protected apiKey?: string;
  protected baseUrl?: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  abstract generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;
  abstract stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
  abstract isAvailable(): Promise<boolean>;

  /**
   * Generate a unique ID for the response
   */
  protected generateId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Create timing metrics
   */
  protected createTimingMetrics(startTime: number) {
    const completedAt = Date.now();
    return {
      startedAt: startTime,
      completedAt,
      totalTime: completedAt - startTime,
    };
  }
}
