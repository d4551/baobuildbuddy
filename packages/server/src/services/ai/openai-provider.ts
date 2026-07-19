import { API_ERROR_AI_STREAMING_FAILED } from "@bao/shared/constants/api-errors";
import type { AIResponse, GenerateOptions } from "@bao/shared/types/ai";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { settle } from "@bao/shared/utils/promise";
import OpenAI from "openai";
import { BaseAIProvider } from "./provider-interface";

/**
 * OpenAI AI Provider
 */
export class OpenAIProvider extends BaseAIProvider {
  name = "openai" as const;
  model: string;
  private client: OpenAI;

  constructor(apiKey: string, model = "gpt-4o") {
    super(apiKey);
    this.model = model;
    this.client = new OpenAI({ apiKey });
  }

  private resolveModel(options?: GenerateOptions): string {
    return typeof options?.model === "string" && options.model.trim().length > 0
      ? options.model.trim()
      : this.model;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const startTime = Date.now();
    const model = this.resolveModel(options);
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (options?.systemPrompt) {
      messages.push({
        role: "system",
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    const responseResult = await settle(
      this.client.chat.completions.create({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
      }),
    );
    if (responseResult.status === "rejected") {
      return {
        id: this.generateId(),
        provider: this.name,
        model,
        content: "",
        error: toErrorMessage(responseResult.reason),
        timing: this.createTimingMetrics(startTime),
      };
    }
    const response = responseResult.value;
    const text = response.choices[0]?.message?.content || "";
    return {
      id: this.generateId(),
      provider: this.name,
      model,
      content: text,
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          }
        : undefined,
      timing: this.createTimingMetrics(startTime),
    };
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    const model = this.resolveModel(options);
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (options?.systemPrompt) {
      messages.push({
        role: "system",
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    const streamResult = await settle(
      this.client.chat.completions.create({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
        stream: true,
      }),
    );
    if (streamResult.status === "rejected") {
      throw new Error(`${API_ERROR_AI_STREAMING_FAILED}: ${toErrorMessage(streamResult.reason)}`);
    }
    const stream = streamResult.value;

    const iterator = stream[Symbol.asyncIterator]();
    const emitContentChunks = async function* (): AsyncGenerator<string> {
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
      const content = nextChunk.value.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
      yield* emitContentChunks();
    };

    yield* emitContentChunks();
  }

  async isAvailable(): Promise<boolean> {
    // List models to verify API key
    return (await settle(this.client.models.list())).status === "fulfilled";
  }
}
