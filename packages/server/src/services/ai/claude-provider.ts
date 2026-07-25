import Anthropic from "@anthropic-ai/sdk";
import {
  AI_DEFAULT_MAX_TOKENS_CLAUDE,
  AI_DEFAULT_TEMPERATURE_CREATIVE,
} from "@bao/shared/constants/ai-generation";
import { API_ERROR_AI_STREAMING_FAILED } from "@bao/shared/constants/api-errors";
import type { AIResponse, GenerateOptions } from "@bao/shared/types/ai";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { settle } from "@bao/shared/utils/promise";
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

  private resolveModel(options?: GenerateOptions): string {
    return typeof options?.model === "string" && options.model.trim().length > 0
      ? options.model.trim()
      : this.model;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const startTime = Date.now();
    const model = this.resolveModel(options);
    const responseResult = await settle(
      this.client.messages.create({
        model,
        max_tokens: options?.maxTokens ?? AI_DEFAULT_MAX_TOKENS_CLAUDE,
        temperature: options?.temperature ?? AI_DEFAULT_TEMPERATURE_CREATIVE,
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
        model,
        content: "",
        error: toErrorMessage(responseResult.reason),
        timing: this.createTimingMetrics(startTime),
      };
    }
    const response = responseResult.value;
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return {
      id: this.generateId(),
      provider: this.name,
      model,
      content: text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      timing: this.createTimingMetrics(startTime),
    };
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    const model = this.resolveModel(options);
    const streamResult = await settle(
      Promise.resolve(
        this.client.messages.stream({
          model,
          max_tokens: options?.maxTokens ?? AI_DEFAULT_MAX_TOKENS_CLAUDE,
          temperature: options?.temperature ?? AI_DEFAULT_TEMPERATURE_CREATIVE,
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
    const model = this.model;
    return (
      (
        await settle(
          this.client.messages.create({
            model,
            max_tokens: 10,
            messages: [{ role: "user", content: "test" }],
          }),
        )
      ).status === "fulfilled"
    );
  }
}
