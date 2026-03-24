import Anthropic from "@anthropic-ai/sdk";
import {
  type AIResponse,
  API_ERROR_AI_STREAMING_FAILED,
  type GenerateOptions,
  settle,
  toErrorMessage,
} from "@bao/shared";
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
    const responseResult = await settle(
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
    const streamResult = await settle(
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
      throw new Error(`${API_ERROR_AI_STREAMING_FAILED}: ${toErrorMessage(streamResult.reason)}`);
    }
    const stream = streamResult.value;

    const iterator = stream[Symbol.asyncIterator]();
    const emitTextEvents = async function* (): AsyncGenerator<string> {
      const nextEventResult = await settle(iterator.next());
      if (nextEventResult.status === "rejected") {
        throw new Error(
          `${API_ERROR_AI_STREAMING_FAILED}: ${toErrorMessage(nextEventResult.reason)}`,
        );
      }
      const nextEvent = nextEventResult.value;
      if (nextEvent.done) {
        return;
      }
      const event = nextEvent.value;
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
      yield* emitTextEvents();
    };

    yield* emitTextEvents();
  }

  async isAvailable(): Promise<boolean> {
    // Make a minimal request to verify API key
    return (
      (
        await settle(
          this.client.messages.create({
            model: this.model,
            max_tokens: 10,
            messages: [{ role: "user", content: "test" }],
          }),
        )
      ).status === "fulfilled"
    );
  }
}
