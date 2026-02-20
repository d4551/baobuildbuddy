import { LOCAL_AI_DEFAULT_ENDPOINT, LOCAL_AI_DEFAULT_MODEL, LOCAL_AI_SERVERS } from "@bao/shared";
import type { AIResponse, GenerateOptions } from "@bao/shared";
import OpenAI from "openai";
import { BaseAIProvider } from "./provider-interface";

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
          `Local AI streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      });

    const iterator = stream[Symbol.asyncIterator]();
    while (true) {
      const nextChunk = await iterator.next().catch((error: unknown) => {
        throw new Error(
          `Local AI streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
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
    // Try to list models to verify the local server is running
    return this.client.models.list().then(
      () => true,
      () => false,
    );
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
      servers.map((server) =>
        Promise.resolve()
          .then(async () => {
            const provider = new LocalProvider(server.baseUrl);
            const available = await provider.isAvailable();
            return { ...server, available };
          })
          .catch(() => ({ ...server, available: false })),
      ),
    );

    return results;
  }
}
