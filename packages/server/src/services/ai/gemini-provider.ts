import type { AIResponse, GenerateOptions } from "@bao/shared";
import { type GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { BaseAIProvider } from "./provider-interface";

/**
 * Google Gemini AI Provider
 */
export class GeminiProvider extends BaseAIProvider {
  name = "gemini" as const;
  model: string;
  private client: GoogleGenerativeAI;
  private generativeModel: GenerativeModel;

  constructor(apiKey: string, model = "gemini-2.0-flash-exp") {
    super(apiKey);
    this.model = model;
    this.client = new GoogleGenerativeAI(apiKey);
    this.generativeModel = this.client.getGenerativeModel({ model: this.model });
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const startTime = Date.now();
    const generationConfig = {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 2048,
      topP: options?.topP ?? 0.95,
      topK: options?.topK ?? 40,
    };

    // Build the prompt with system prompt if provided
    let fullPrompt = prompt;
    if (options?.systemPrompt) {
      fullPrompt = `${options.systemPrompt}\n\n${prompt}`;
    }

    return this.generativeModel
      .generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
      })
      .then(
        (result): AIResponse => {
          const response = result.response;
          const text = response.text();

          // Extract usage information if available
          const usage = response.usageMetadata
            ? {
                inputTokens: response.usageMetadata.promptTokenCount || 0,
                outputTokens: response.usageMetadata.candidatesTokenCount || 0,
              }
            : undefined;

          return {
            id: this.generateId(),
            provider: this.name,
            model: this.model,
            content: text,
            usage,
            timing: this.createTimingMetrics(startTime),
          };
        },
        (error: unknown): AIResponse => ({
          id: this.generateId(),
          provider: this.name,
          model: this.model,
          content: "",
          error: error instanceof Error ? error.message : "Unknown error",
          timing: this.createTimingMetrics(startTime),
        }),
      );
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    const generationConfig = {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 2048,
      topP: options?.topP ?? 0.95,
      topK: options?.topK ?? 40,
    };

    // Build the prompt with system prompt if provided
    let fullPrompt = prompt;
    if (options?.systemPrompt) {
      fullPrompt = `${options.systemPrompt}\n\n${prompt}`;
    }

    const result = await this.generativeModel
      .generateContentStream({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
      })
      .catch((error: unknown) => {
        throw new Error(
          `Gemini streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      });

    const iterator = result.stream[Symbol.asyncIterator]();
    while (true) {
      const nextChunk = await iterator.next().catch((error: unknown) => {
        throw new Error(
          `Gemini streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      });
      if (nextChunk.done) {
        break;
      }
      const text = nextChunk.value.text();
      if (text) {
        yield text;
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    // Try to list models to verify API key and connectivity
    return Promise.resolve(this.client.getGenerativeModel({ model: "gemini-pro" })).then(
      () => true,
      () => false,
    );
  }
}
