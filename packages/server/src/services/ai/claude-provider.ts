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
    return this.client.messages
      .create({
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
      })
      .then(
        (response): AIResponse => {
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
    const stream = await Promise.resolve()
      .then(() =>
        this.client.messages.stream({
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
        }),
      )
      .catch((error: unknown) => {
        throw new Error(
          `Claude streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      });

    const iterator = stream[Symbol.asyncIterator]();
    while (true) {
      const nextEvent = await iterator.next().catch((error: unknown) => {
        throw new Error(
          `Claude streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      });
      if (nextEvent.done) {
        break;
      }
      const event = nextEvent.value;
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    // Make a minimal request to verify API key
    return this.client.messages
      .create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: "user", content: "test" }],
      })
      .then(
        () => true,
        () => false,
      );
  }
}
