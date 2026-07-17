import {
  LOCAL_AI_AUTO_DETECT_MODEL,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
} from "@bao/shared/constants/ai-provider";
import { API_ERROR_AI_STREAMING_FAILED } from "@bao/shared/constants/api-errors";
import type {
  AIProviderDiagnostic,
  AIProviderType,
  AIResponse,
  GenerateOptions,
} from "@bao/shared/types/ai";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { safeParseJson } from "@bao/shared/utils/json";
import { settle } from "@bao/shared/utils/promise";
import OpenAI from "openai";
import {
  detectFirstLocalProviderModel,
  detectLocalProviderServers,
  inspectLocalProviderEndpoint,
} from "./local-provider-diagnostics";
import { BaseAIProvider } from "./provider-interface";

const buildLocalProviderMessages = (
  prompt: string,
  systemPrompt?: string,
): OpenAI.Chat.ChatCompletionMessageParam[] => {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }
  messages.push({
    role: "user",
    content: prompt,
  });
  return messages;
};

const isJsonRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const readMessageReasoning = (completion: OpenAI.Chat.ChatCompletion): string => {
  const serializedMessage = JSON.stringify(completion.choices[0]?.message ?? null);
  const parsedMessage = safeParseJson(serializedMessage);
  if (!isJsonRecord(parsedMessage)) {
    return "";
  }

  return readNonEmptyString(parsedMessage.reasoning) ?? "";
};

const readCompletionContent = (
  completion: OpenAI.Chat.ChatCompletion,
  options?: GenerateOptions,
): string => {
  const content = completion.choices[0]?.message?.content;
  if (typeof content === "string" && content.trim().length > 0) {
    return content;
  }

  if (
    options?.purpose === "coverLetter" ||
    options?.purpose === "scrapeEnrichment" ||
    options?.purpose === "emailResponse"
  ) {
    return readMessageReasoning(completion);
  }

  return "";
};

/**
 * Local AI Provider for RamaLama, Ollama, and other OpenAI Chat Completions local servers
 * Uses the OpenAI SDK pointed at a local endpoint
 */
export class LocalProvider extends BaseAIProvider {
  name: AIProviderType = "local";
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

  private async resolveRequestedModel(requestedModel?: string): Promise<string | null> {
    if (typeof requestedModel === "string" && requestedModel.trim().length > 0) {
      return requestedModel.trim();
    }

    const resolved = await this.resolveModelIfNeeded();
    return resolved ? this.model : null;
  }

  private async createCompletion(
    prompt: string,
    model: string,
    options?: GenerateOptions,
  ): Promise<OpenAI.Chat.ChatCompletion> {
    const messages = buildLocalProviderMessages(prompt, options?.systemPrompt);
    return this.client.chat.completions.create({
      model,
      messages,
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
      top_p: options?.topP ?? 1,
      stream: false,
    });
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const startTime = Date.now();
    const model = await this.resolveRequestedModel(options?.model);
    if (!model) {
      return {
        id: this.generateId(),
        provider: this.name,
        model: "",
        content: "",
        error: "No local model available",
        timing: this.createTimingMetrics(startTime),
      };
    }
    const responseResult = await settle(this.createCompletion(prompt, model, options));
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
    const text = readCompletionContent(response, options);
    return {
      id: this.generateId(),
      provider: this.name,
      model,
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
    const model = await this.resolveRequestedModel(options?.model);
    if (!model) {
      throw new Error("No local model available");
    }
    const messages = buildLocalProviderMessages(prompt, options?.systemPrompt);

    const streamResult = await settle(
      this.client.chat.completions.create({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
        stream: true,
      }),
    );
    if (streamResult.status === "rejected") {
      throw new Error(`${API_ERROR_AI_STREAMING_FAILED}: ${toErrorMessage(streamResult.reason)}`);
    }
    const stream = streamResult.value;

    const iterator = stream[Symbol.asyncIterator]();
    const emitContentChunks = async function* (): AsyncGenerator<string> {
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
      const content = nextChunk.value.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
      yield* emitContentChunks();
    };

    yield* emitContentChunks();
  }

  async isAvailable(): Promise<boolean> {
    const resolvedModel = await this.resolveModelIfNeeded();
    if (!resolvedModel) {
      return false;
    }
    return (await settle(this.client.models.list())).status === "fulfilled";
  }

  private async resolveModelIfNeeded(): Promise<boolean> {
    if (this.model && this.model !== LOCAL_AI_AUTO_DETECT_MODEL) {
      return true;
    }

    if (!this.baseUrl || typeof this.baseUrl !== "string" || this.baseUrl.trim().length === 0) {
      return false;
    }

    const detected = await settle(LocalProvider.detectFirstModel(this.baseUrl));
    if (detected.status === "rejected" || !detected.value) {
      return false;
    }

    this.model = detected.value;
    return true;
  }

  /**
   * Query the local server for available models and return the first one.
   * Returns null if the server is unreachable or has no models.
   */
  static async detectFirstModel(baseUrl: string): Promise<string | null> {
    return await detectFirstLocalProviderModel(baseUrl);
  }

  /**
   * Inspect a local OpenAI Chat Completions endpoint and return structured diagnostics.
   */
  static async inspectEndpoint(
    baseUrl: string,
    selectedModel?: string,
  ): Promise<AIProviderDiagnostic> {
    return await inspectLocalProviderEndpoint(baseUrl, selectedModel);
  }

  /**
   * Static method to detect local AI servers
   */
  static async detectLocalServers(): Promise<
    Array<{
      id?: string;
      baseUrl: string;
      name: string;
      available: boolean;
      availableModels?: readonly string[];
      diagnosticCode?: AIProviderDiagnostic["code"];
      message?: string;
    }>
  > {
    return await detectLocalProviderServers();
  }
}
