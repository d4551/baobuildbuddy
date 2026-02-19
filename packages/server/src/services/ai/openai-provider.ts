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

    try {
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

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
      });

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
    } catch (error) {
      return {
        id: this.generateId(),
        provider: this.name,
        model: this.model,
        content: "",
        error: error instanceof Error ? error.message : "Unknown error",
        timing: this.createTimingMetrics(startTime),
      };
    }
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    try {
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

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      throw new Error(
        `OpenAI streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // List models to verify API key
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
