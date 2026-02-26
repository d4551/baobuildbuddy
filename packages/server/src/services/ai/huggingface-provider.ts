import type { AIResponse, GenerateOptions } from "@bao/shared";
import { HfInference } from "@huggingface/inference";
import { BaseAIProvider } from "./provider-interface";

const settlePromise = async <T>(operation: Promise<T>): Promise<PromiseSettledResult<T>> => {
  const [result] = await Promise.allSettled([operation]);
  return result;
};
const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const buildChatMessages = (
  prompt: string,
  systemPrompt?: string,
): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });
  return messages;
};

/**
 * Hugging Face AI Provider
 * Uses chatCompletion API for conversational models.
 * Works with free tier (no API key required) or with API token for better rate limits.
 */
export class HuggingFaceProvider extends BaseAIProvider {
  name = "huggingface" as const;
  model: string;
  private client: HfInference;

  constructor(apiKey?: string, model = "Qwen/Qwen2.5-Coder-32B-Instruct") {
    super(apiKey);
    this.model = model;
    this.client = new HfInference(apiKey);
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const startTime = Date.now();
    const messages = buildChatMessages(prompt, options?.systemPrompt);

    const responseResult = await settlePromise(
      this.client.chatCompletion({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 0.95,
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

    const content = responseResult.value.choices[0]?.message?.content ?? "";

    return {
      id: this.generateId(),
      provider: this.name,
      model: this.model,
      content,
      timing: this.createTimingMetrics(startTime),
    };
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    const messages = buildChatMessages(prompt, options?.systemPrompt);

    const stream = this.client.chatCompletionStream({
      model: this.model,
      messages,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.7,
      top_p: options?.topP ?? 0.95,
    });

    const iterator = stream[Symbol.asyncIterator]();
    const emitTokens = async function* (): AsyncGenerator<string> {
      const nextChunkResult = await settlePromise(iterator.next());
      if (nextChunkResult.status === "rejected") {
        throw new Error(`HuggingFace streaming error: ${toErrorMessage(nextChunkResult.reason)}`);
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
