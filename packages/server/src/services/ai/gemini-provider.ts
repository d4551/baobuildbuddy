import {
  AI_DEFAULT_MAX_TOKENS,
  AI_DEFAULT_TEMPERATURE_CREATIVE,
  AI_DEFAULT_TOP_P,
} from "@bao/shared/constants/ai-generation";
import { API_ERROR_AI_STREAMING_FAILED } from "@bao/shared/constants/api-errors";
import { COUNT_FORTY } from "@bao/shared/constants/numeric";
import type { AIResponse, GenerateOptions } from "@bao/shared/types/ai";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { settle } from "@bao/shared/utils/promise";
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

  private resolveModel(options?: GenerateOptions): string {
    return typeof options?.model === "string" && options.model.trim().length > 0
      ? options.model.trim()
      : this.model;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const startTime = Date.now();
    const model = this.resolveModel(options);
    const generativeModel =
      model === this.model ? this.generativeModel : this.client.getGenerativeModel({ model });
    const generationConfig = {
      temperature: options?.temperature ?? AI_DEFAULT_TEMPERATURE_CREATIVE,
      maxOutputTokens: options?.maxTokens ?? AI_DEFAULT_MAX_TOKENS,
      topP: options?.topP ?? AI_DEFAULT_TOP_P,
      topK: options?.topK ?? COUNT_FORTY,
    };

    let fullPrompt = prompt;
    if (options?.systemPrompt) {
      fullPrompt = `${options.systemPrompt}\n\n${prompt}`;
    }

    const resultResponse = await settle(
      generativeModel.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
      }),
    );
    if (resultResponse.status === "rejected") {
      return {
        id: this.generateId(),
        provider: this.name,
        model,
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
      model,
      content: text,
      usage,
      timing: this.createTimingMetrics(startTime),
    };
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    const model = this.resolveModel(options);
    const generativeModel =
      model === this.model ? this.generativeModel : this.client.getGenerativeModel({ model });
    const generationConfig = {
      temperature: options?.temperature ?? AI_DEFAULT_TEMPERATURE_CREATIVE,
      maxOutputTokens: options?.maxTokens ?? AI_DEFAULT_MAX_TOKENS,
      topP: options?.topP ?? AI_DEFAULT_TOP_P,
      topK: options?.topK ?? COUNT_FORTY,
    };

    let fullPrompt = prompt;
    if (options?.systemPrompt) {
      fullPrompt = `${options.systemPrompt}\n\n${prompt}`;
    }

    const streamResult = await settle(
      generativeModel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
      }),
    );
    if (streamResult.status === "rejected") {
      throw new Error(`${API_ERROR_AI_STREAMING_FAILED}: ${toErrorMessage(streamResult.reason)}`);
    }
    const result = streamResult.value;

    const iterator = result.stream[Symbol.asyncIterator]();
    const emitTextChunks = async function* (): AsyncGenerator<string> {
      const nextChunkResult = await settle(iterator.next());
      if (nextChunkResult.status === "rejected") {
        throw new Error(
          `${API_ERROR_AI_STREAMING_FAILED}: ${toErrorMessage(nextChunkResult.reason)}`,
        );
      }
      const nextChunk = nextChunkResult.value;
      if (nextChunk.done) {
        return;
      }
      const text = nextChunk.value.text();
      if (text) {
        yield text;
      }
      yield* emitTextChunks();
    };

    yield* emitTextChunks();
  }

  async isAvailable(): Promise<boolean> {
    // Try to list models to verify API key and connectivity
    return (
      (await settle(Promise.resolve(this.client.getGenerativeModel({ model: "gemini-pro" }))))
        .status === "fulfilled"
    );
  }
}
