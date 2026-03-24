import {
  type AIProviderDiagnostic,
  type AIResponse,
  API_ERROR_AI_STREAMING_FAILED,
  type GenerateOptions,
  LOCAL_AI_AUTO_DETECT_MODEL,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
  LOCAL_AI_SERVERS,
  settle,
  toErrorMessage,
} from "@bao/shared";
import OpenAI from "openai";
import { BaseAIProvider } from "./provider-interface";

const LOCAL_PROVIDER_HEALTH_TIMEOUT_MS = 3_000;
const TRAILING_SLASH_PATTERN = /\/$/;

const getModelIdFromPayloadEntry = (entry: unknown): string | null => {
  if (typeof entry !== "object" || entry === null || !("id" in entry)) {
    return null;
  }

  const candidateId = entry.id;
  return typeof candidateId === "string" && candidateId.trim().length > 0
    ? candidateId.trim()
    : null;
};

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

type LocalDiagnosticInput = {
  code: AIProviderDiagnostic["code"];
  endpoint: string;
  checkedAt: string;
  selectedModel?: string;
  message?: string;
  availableModels?: string[];
};

type LocalModelDiscoveryResult =
  | {
      endpoint: string;
      checkedAt: string;
      availableModels: string[];
    }
  | {
      diagnostic: AIProviderDiagnostic;
    };

const buildDiagnosticResponse = ({
  code,
  endpoint,
  checkedAt,
  selectedModel,
  message,
  availableModels,
}: LocalDiagnosticInput): AIProviderDiagnostic => ({
  provider: "local",
  code,
  checkedAt,
  endpoint,
  selectedModel,
  availableModels,
  ...(message ? { message } : {}),
});

const buildModelsUrl = (endpoint: string): string =>
  endpoint.endsWith("/models") ? endpoint : `${endpoint.replace(TRAILING_SLASH_PATTERN, "")}/models`;

const extractAvailableModels = (payload: unknown): string[] => {
  const data =
    typeof payload === "object" && payload !== null && "data" in payload ? payload.data : null;
  return Array.isArray(data)
    ? data.flatMap((entry) => {
        const id = getModelIdFromPayloadEntry(entry);
        return id ? [id] : [];
      })
    : [];
};

const buildFetchFailureDiagnostic = (
  endpoint: string,
  checkedAt: string,
  selectedModel: string | undefined,
  error: unknown,
): AIProviderDiagnostic => {
  const message = toErrorMessage(error);
  return buildDiagnosticResponse({
    code: message.toLowerCase().includes("timeout") ? "timeout" : "unreachable",
    endpoint,
    checkedAt,
    selectedModel,
    message,
  });
};

const loadAvailableModels = async (
  endpoint: string,
  checkedAt: string,
  selectedModel?: string,
): Promise<LocalModelDiscoveryResult> => {
  const responseResult = await settle(
    fetch(buildModelsUrl(endpoint), {
      method: "GET",
      signal: AbortSignal.timeout(LOCAL_PROVIDER_HEALTH_TIMEOUT_MS),
    }),
  );

  if (responseResult.status === "rejected") {
    return {
      diagnostic: buildFetchFailureDiagnostic(
        endpoint,
        checkedAt,
        selectedModel,
        responseResult.reason,
      ),
    };
  }

  const response = responseResult.value;
  if (!response.ok) {
    return {
      diagnostic: buildDiagnosticResponse({
        code: "unreachable",
        endpoint,
        checkedAt,
        selectedModel,
        message: `HTTP ${response.status}`,
      }),
    };
  }

  const payloadResult = await settle(response.json() as Promise<unknown>);
  if (payloadResult.status === "rejected") {
    return {
      diagnostic: buildDiagnosticResponse({
        code: "error",
        endpoint,
        checkedAt,
        selectedModel,
        message: toErrorMessage(payloadResult.reason),
      }),
    };
  }

  const availableModels = extractAvailableModels(payloadResult.value);
  if (availableModels.length === 0) {
    return {
      diagnostic: buildDiagnosticResponse({
        code: "empty-model-list",
        endpoint,
        checkedAt,
        selectedModel,
        message: "Endpoint responded without any available models",
        availableModels,
      }),
    };
  }

  return {
    endpoint,
    checkedAt,
    availableModels,
  };
};

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
    const text = response.choices[0]?.message?.content || "";
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
    const diagnostics = await LocalProvider.inspectEndpoint(baseUrl);
    return diagnostics.availableModels?.[0] ?? null;
  }

  /**
   * Inspect a local OpenAI-compatible endpoint and return structured diagnostics.
   */
  static async inspectEndpoint(
    baseUrl: string,
    selectedModel?: string,
  ): Promise<AIProviderDiagnostic> {
    const checkedAt = new Date().toISOString();
    const endpoint = baseUrl.trim();
    const modelDiscovery = await loadAvailableModels(endpoint, checkedAt, selectedModel);
    if ("diagnostic" in modelDiscovery) {
      return modelDiscovery.diagnostic;
    }
    const { availableModels } = modelDiscovery;

    if (
      selectedModel &&
      selectedModel !== LOCAL_AI_AUTO_DETECT_MODEL &&
      !availableModels.includes(selectedModel)
    ) {
      return buildDiagnosticResponse({
        code: "invalid-model",
        endpoint,
        checkedAt,
        selectedModel,
        message: "Configured model was not returned by the endpoint",
        availableModels,
      });
    }

    return buildDiagnosticResponse({
      code: "healthy",
      endpoint,
      checkedAt,
      selectedModel:
        selectedModel && selectedModel !== LOCAL_AI_AUTO_DETECT_MODEL
          ? selectedModel
          : availableModels[0],
      availableModels,
    });
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
      availableModels?: string[];
      diagnosticCode?: AIProviderDiagnostic["code"];
      message?: string;
    }>
  > {
    const servers = LOCAL_AI_SERVERS.map((server) => ({
      id: server.id,
      baseUrl: server.baseUrl,
      name: server.name,
    }));

    const results = await Promise.all(
      servers.map(async (server) => {
        const result = await settle(
          Promise.resolve().then(async () => {
            const diagnostics = await LocalProvider.inspectEndpoint(server.baseUrl);
            return {
              ...server,
              available: diagnostics.code === "healthy",
              availableModels: diagnostics.availableModels,
              diagnosticCode: diagnostics.code,
              message: diagnostics.message,
            };
          }),
        );
        if (result.status === "rejected") {
          return {
            ...server,
            available: false,
            diagnosticCode: "error" as const,
            message: toErrorMessage(result.reason),
          };
        }
        return result.value;
      }),
    );

    return results;
  }
}
