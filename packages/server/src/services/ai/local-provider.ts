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
        `Local AI streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Try to list models to verify the local server is running
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
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
        try {
          const provider = new LocalProvider(server.baseUrl);
          const available = await provider.isAvailable();
          return { ...server, available };
        } catch {
          return { ...server, available: false };
        }
      }),
    );

    return results;
  }
}
