import type { AIResponse, GenerateOptions } from "@bao/shared";
import { LOCAL_AI_DEFAULT_ENDPOINT, LOCAL_AI_DEFAULT_MODEL, LOCAL_AI_SERVERS } from "@bao/shared";
import OpenAI from "openai";
import { BaseAIProvider } from "./provider-interface";

const settlePromise = async <T>(operation: Promise<T>): Promise<PromiseSettledResult<T>> => {
  const [result] = await Promise.allSettled([operation]);
  return result;
};
const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

/**
 * Local AI Provider for RamaLama, Ollama, and other OpenAI-compatible local servers
 * Uses the OpenAI SDK pointed at a local endpoint
 */
export class LocalProvider extends BaseAIProvider {
  name = "local" as const;
  model: string;
  private client: OpenAI;

  constructor(
    baseUrl = LOCAL_AI_DEFAULT_ENDPOINT,
    model = LOCAL_AI_DEFAULT_MODEL,
    apiKey = "not-needed",
  ) {
    super(apiKey, baseUrl);
    this.model = model;
    this.client = new OpenAI({
      apiKey, // Local servers usually don't need a real key
      baseURL: baseUrl,
    });
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

    const responseResult = await settlePromise(
      this.client.chat.completions.create({
        model: this.model,
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
        model: this.model,
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

    const streamResult = await settlePromise(
      this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
        stream: true,
      }),
    );
    if (streamResult.status === "rejected") {
      throw new Error(`Local AI streaming error: ${toErrorMessage(streamResult.reason)}`);
    }
    const stream = streamResult.value;

    const iterator = stream[Symbol.asyncIterator]();
    while (true) {
      const nextChunkResult = await settlePromise(iterator.next());
      if (nextChunkResult.status === "rejected") {
        throw new Error(`Local AI streaming error: ${toErrorMessage(nextChunkResult.reason)}`);
      }
      const nextChunk = nextChunkResult.value;
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
    // Try to list models to verify the local server is running
    return (await settlePromise(this.client.models.list())).status === "fulfilled";
  }

  /**
   * Static method to detect local AI servers
   */
  static async detectLocalServers(): Promise<
    Array<{ id?: string; baseUrl: string; name: string; available: boolean }>
  > {
    const servers = LOCAL_AI_SERVERS.map((server) => ({
      id: server.id,
      baseUrl: server.baseUrl,
      name: server.name,
    }));

    const results = await Promise.all(
      servers.map(async (server) => {
        const result = await settlePromise(
          Promise.resolve().then(async () => {
            const provider = new LocalProvider(server.baseUrl);
            const available = await provider.isAvailable();
            return { ...server, available };
          }),
        );
        if (result.status === "rejected") {
          return { ...server, available: false };
        }
        return result.value;
      }),
    );

    return results;
  }
}
