import Anthropic from "@anthropic-ai/sdk";
import type { AIResponse, GenerateOptions } from "@bao/shared";
import { BaseAIProvider } from "./provider-interface";

/**
 * Anthropic Claude AI Provider
 */
export class ClaudeProvider extends BaseAIProvider {
  name = "claude" as const;
  model: string;
  private client: Anthropic;

  constructor(apiKey: string, model = "claude-sonnet-4-5-20250929") {
    super(apiKey);
    this.model = model;
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
        system: options?.systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // Extract text from content blocks
      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as { type: "text"; text: string }).text)
        .join("");

      return {
        id: this.generateId(),
        provider: this.name,
        model: this.model,
        content: text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
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
      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
        system: options?.systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield event.delta.text;
        }
      }
    } catch (error) {
      throw new Error(
        `Claude streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Make a minimal request to verify API key
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: "user", content: "test" }],
      });
      return true;
    } catch (error) {
      // Check if it's an auth error vs other errors
      if (error instanceof Error && error.message.includes("authentication")) {
        return false;
      }
      // Other errors might be temporary, so consider it available
      return false;
    }
  }
}
