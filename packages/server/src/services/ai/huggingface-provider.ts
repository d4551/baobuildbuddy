import { HUGGING_FACE_DEFAULT_MODEL } from "@bao/shared/constants/ai-provider";
import { API_ERROR_AI_STREAMING_FAILED } from "@bao/shared/constants/api-errors";
import type { AIResponse, GenerateOptions } from "@bao/shared/types/ai";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { settle } from "@bao/shared/utils/promise";
import { HfInference } from "@huggingface/inference";
import { BaseAIProvider } from "./provider-interface";
const NUM_1024 = 1024;
const RATIO_0_7 = 0.7;
const RATIO_0_95 = 0.95;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
const buildChatMessages = (prompt: string, systemPrompt?: string): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });
  return messages;
};

const HUGGING_FACE_INFERENCE_PROVIDER = "hf-inference" as const;

/**
 * Hugging Face AI Provider
 * Uses chatCompletion API for conversational models.
 * Works with free tier (no API key required) or with API token for better rate limits.
 */
export class HuggingFaceProvider extends BaseAIProvider {
  name = "huggingface" as const;
  model: string;
  private client: HfInference;

  constructor(apiKey?: string, model?: string) {
    super(apiKey);
    this.model =
      typeof model === "string" && model.trim().length > 0 ? model : HUGGING_FACE_DEFAULT_MODEL;
    this.client = new HfInference(apiKey);
  }

  private resolveModel(options?: GenerateOptions): string {
    return typeof options?.model === "string" && options.model.trim().length > 0
      ? options.model.trim()
      : this.model;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const startTime = Date.now();
    const model = this.resolveModel(options);
    const messages = buildChatMessages(prompt, options?.systemPrompt);

    const responseResult = await settle(
      this.client.chatCompletion({
        provider: HUGGING_FACE_INFERENCE_PROVIDER,
        model,
        messages,
        max_tokens: options?.maxTokens ?? NUM_1024,
        temperature: options?.temperature ?? RATIO_0_7,
        top_p: options?.topP ?? RATIO_0_95,
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

    const content = responseResult.value.choices[0]?.message?.content ?? "";

    return {
      id: this.generateId(),
      provider: this.name,
      model,
      content,
      timing: this.createTimingMetrics(startTime),
    };
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    const model = this.resolveModel(options);
    const messages = buildChatMessages(prompt, options?.systemPrompt);

    const stream = this.client.chatCompletionStream({
      provider: HUGGING_FACE_INFERENCE_PROVIDER,
      model,
      messages,
      max_tokens: options?.maxTokens ?? NUM_1024,
      temperature: options?.temperature ?? RATIO_0_7,
      top_p: options?.topP ?? RATIO_0_95,
    });

    const iterator = stream[Symbol.asyncIterator]();
    const emitTokens = async function* (): AsyncGenerator<string> {
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
      const delta = nextChunk.value.choices?.[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
      yield* emitTokens();
    };

    yield* emitTokens();
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
