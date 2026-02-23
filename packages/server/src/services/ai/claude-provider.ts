import Anthropic from "@anthropic-ai/sdk";
import type { AIResponse, GenerateOptions } from "@bao/shared";
import { BaseAIProvider } from "./provider-interface";

const settlePromise = async <T>(operation: Promise<T>): Promise<PromiseSettledResult<T>> => {
  const [result] = await Promise.allSettled([operation]);
  return result;
};
const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

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
    const responseResult = await settlePromise(
      this.client.messages.create({
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
    );
    if (responseResult.status === "rejected") {
      return {
        id: this.generateId(),
        provider: this.name,
        model: this.model,
        content: "",
        error: toErrorMessage(responseResult.reason),
        timing: this.createTimingMetrics(startTime),
      };
    }
    const response = responseResult.value;
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
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    const streamResult = await settlePromise(
      Promise.resolve(
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
      ),
    );
    if (streamResult.status === "rejected") {
      throw new Error(`Claude streaming error: ${toErrorMessage(streamResult.reason)}`);
    }
    const stream = streamResult.value;

    const iterator = stream[Symbol.asyncIterator]();
    while (true) {
      const nextEventResult = await settlePromise(iterator.next());
      if (nextEventResult.status === "rejected") {
        throw new Error(`Claude streaming error: ${toErrorMessage(nextEventResult.reason)}`);
      }
      const nextEvent = nextEventResult.value;
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
    return (
      await settlePromise(
        this.client.messages.create({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: "user", content: "test" }],
        }),
      )
    ).status === "fulfilled";
  }
}
