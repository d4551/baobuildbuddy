import type { AIResponse, GenerateOptions } from "@bao/shared";
import { type GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { BaseAIProvider } from "./provider-interface";

const settlePromise = async <T>(operation: Promise<T>): Promise<PromiseSettledResult<T>> => {
  const [result] = await Promise.allSettled([operation]);
  return result;
};
const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

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

    const resultResponse = await settlePromise(
      this.generativeModel.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
      }),
    );
    if (resultResponse.status === "rejected") {
      return {
        id: this.generateId(),
        provider: this.name,
        model: this.model,
        content: "",
        error: toErrorMessage(resultResponse.reason),
        timing: this.createTimingMetrics(startTime),
      };
    }

    const response = resultResponse.value.response;
    const text = response.text();
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

    const streamResult = await settlePromise(
      this.generativeModel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
      }),
    );
    if (streamResult.status === "rejected") {
      throw new Error(`Gemini streaming error: ${toErrorMessage(streamResult.reason)}`);
    }
    const result = streamResult.value;

    const iterator = result.stream[Symbol.asyncIterator]();
    while (true) {
      const nextChunkResult = await settlePromise(iterator.next());
      if (nextChunkResult.status === "rejected") {
        throw new Error(`Gemini streaming error: ${toErrorMessage(nextChunkResult.reason)}`);
      }
      const nextChunk = nextChunkResult.value;
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
    return (
      await settlePromise(Promise.resolve(this.client.getGenerativeModel({ model: "gemini-pro" })))
    ).status === "fulfilled";
  }
}
