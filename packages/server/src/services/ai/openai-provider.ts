import type { AIResponse, GenerateOptions } from "@bao/shared";
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

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const startTime = Date.now();
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system message if provided
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

    return this.client.chat.completions
      .create({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
      })
      .then(
        (response): AIResponse => {
          const text = response.choices[0]?.message?.content || "";
          return {
            id: this.generateId(),
            provider: this.name,
            model: this.model,
            content: text,
            usage: response.usage
              ? {
                  inputTokens: response.usage.prompt_tokens,
                  outputTokens: response.usage.completion_tokens,
                }
              : undefined,
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
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system message if provided
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

    const stream = await this.client.chat.completions
      .create({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
        stream: true,
      })
      .catch((error: unknown) => {
        throw new Error(
          `OpenAI streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      });

    const iterator = stream[Symbol.asyncIterator]();
    while (true) {
      const nextChunk = await iterator.next().catch((error: unknown) => {
        throw new Error(
          `OpenAI streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      });
      if (nextChunk.done) {
        break;
      }
      const content = nextChunk.value.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    // List models to verify API key
    return this.client.models.list().then(
      () => true,
      () => false,
    );
  }
}
