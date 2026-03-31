import { AI_CHAT_CONTEXT_MESSAGE_LIMIT } from "@bao/shared/constants/ai-chat";
import { API_ERROR_ALL_PROVIDERS_STREAM_FAILED } from "@bao/shared/constants/api-errors";
import type { AIProviderType, AIResponse, GenerateOptions } from "@bao/shared/types/ai";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { settle } from "@bao/shared/utils/promise";
import { createServerLogger } from "../../utils/logger";
import type { AIProvider } from "./provider-interface";

const aiFallbackLogger = createServerLogger("ai-provider-fallback");

export type ProviderFailure = { provider: AIProviderType; error: string };

interface FallbackRequest {
  providers: Map<AIProviderType, AIProvider>;
  providerOrder: AIProviderType[];
  contextualPrompt: string;
  providerOptions: Omit<GenerateOptions, "messages"> | undefined;
}

const describeProviderError = (
  providerName: AIProviderType,
  operation: string,
  error: unknown,
): string => {
  const errorMessage = toErrorMessage(error);
  aiFallbackLogger.error("AI provider operation failed", {
    providerName,
    operation,
    error: errorMessage,
  });
  return errorMessage;
};

const pushProviderError = (
  errors: ProviderFailure[],
  provider: AIProviderType,
  error: string,
): void => {
  errors.push({ provider, error });
};

export const buildFailureMessage = (errors: ProviderFailure[]): string =>
  errors.map((entry) => `${entry.provider}: ${entry.error}`).join("; ");

export const mergePromptWithContext = (prompt: string, options?: GenerateOptions): string => {
  const messageHistory = options?.messages;
  if (!messageHistory || messageHistory.length === 0) {
    return prompt;
  }

  const historyLines = messageHistory
    .slice(-AI_CHAT_CONTEXT_MESSAGE_LIMIT)
    .map((message, index) => `${index + 1}. ${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  return [
    "Use the following conversation history to keep responses contextually consistent.",
    "Conversation history:",
    historyLines,
    "Current user message:",
    prompt,
  ].join("\n\n");
};

export const toProviderOptions = (
  routingTarget: {
    purpose: GenerateOptions["purpose"] extends infer P ? P : string;
    provider: AIProviderType;
    model?: string;
  },
  options?: GenerateOptions,
): Omit<GenerateOptions, "messages"> | undefined => {
  if (!options) {
    return routingTarget.model
      ? {
          purpose: routingTarget.purpose,
          provider: routingTarget.provider,
          model: routingTarget.model,
        }
      : {
          purpose: routingTarget.purpose,
          provider: routingTarget.provider,
        };
  }

  const { temperature, maxTokens, topP, topK, timeout, systemPrompt } = options;
  return {
    purpose: routingTarget.purpose,
    provider: routingTarget.provider,
    model: routingTarget.model,
    temperature,
    maxTokens,
    topP,
    topK,
    timeout,
    systemPrompt,
  };
};

const resolveAvailableProvider = async (
  providers: Map<AIProviderType, AIProvider>,
  providerName: AIProviderType,
  errors: ProviderFailure[],
): Promise<AIProvider | null> => {
  const provider = providers.get(providerName);
  if (!provider) {
    return null;
  }

  const availabilityResult = await settle(provider.isAvailable());
  if (availabilityResult.status === "rejected") {
    pushProviderError(
      errors,
      providerName,
      describeProviderError(providerName, "isAvailable", availabilityResult.reason),
    );
    return null;
  }
  if (!availabilityResult.value) {
    pushProviderError(errors, providerName, "Provider not available");
    return null;
  }
  return provider;
};

const generateFromProvider = async (
  request: FallbackRequest,
  providerName: AIProviderType,
  errors: ProviderFailure[],
): Promise<AIResponse | null> => {
  const provider = await resolveAvailableProvider(request.providers, providerName, errors);
  if (!provider) {
    return null;
  }

  const generationResult = await settle(
    provider.generate(request.contextualPrompt, request.providerOptions),
  );
  if (generationResult.status === "rejected") {
    pushProviderError(
      errors,
      providerName,
      describeProviderError(providerName, "generate", generationResult.reason),
    );
    return null;
  }

  if (!generationResult.value) {
    return null;
  }
  if (generationResult.value.error) {
    pushProviderError(errors, providerName, generationResult.value.error);
    return null;
  }
  return generationResult.value;
};

export const generateWithFallback = async (
  request: FallbackRequest,
): Promise<{ response: AIResponse | null; errors: ProviderFailure[] }> => {
  const errors: ProviderFailure[] = [];
  const response = await generateWithFallbackAtIndex(request, errors, 0);
  return { response, errors };
};

const generateWithFallbackAtIndex = async (
  request: FallbackRequest,
  errors: ProviderFailure[],
  index: number,
): Promise<AIResponse | null> => {
  const providerName = request.providerOrder[index];
  if (!providerName) {
    return null;
  }

  const response = await generateFromProvider(request, providerName, errors);
  if (response) {
    return response;
  }

  return generateWithFallbackAtIndex(request, errors, index + 1);
};

export const buildGenerateFailureResponse = (
  errors: ProviderFailure[],
  fallbackProvider: AIProviderType,
): AIResponse => {
  const now = Date.now();
  const errorMessage = buildFailureMessage(errors);
  return {
    id: `failed-${now}`,
    provider: fallbackProvider,
    model: "none",
    content: "",
    error: `All providers failed: ${errorMessage}`,
    timing: {
      startedAt: now,
      completedAt: now,
      totalTime: 0,
    },
  };
};

export const streamWithFallback = async function* (
  request: FallbackRequest,
): AsyncGenerator<
  { chunk: string; provider: AIProviderType },
  { streamed: boolean; errors: ProviderFailure[] }
> {
  const errors: ProviderFailure[] = [];
  return yield* streamWithFallbackAtIndex(request, errors, 0);
};

const streamProviderIterator = async function* (
  providerName: AIProviderType,
  iterator: AsyncIterator<string>,
  errors: ProviderFailure[],
  hasYielded: boolean,
): AsyncGenerator<
  { chunk: string; provider: AIProviderType },
  { hasYielded: boolean; failed: boolean }
> {
  const nextChunkResult = await settle(iterator.next());
  if (nextChunkResult.status === "rejected") {
    pushProviderError(
      errors,
      providerName,
      describeProviderError(providerName, "stream", nextChunkResult.reason),
    );
    return { hasYielded, failed: true };
  }
  if (nextChunkResult.value.done) {
    return { hasYielded, failed: false };
  }
  yield { chunk: nextChunkResult.value.value, provider: providerName };
  return yield* streamProviderIterator(providerName, iterator, errors, true);
};

const streamWithFallbackAtIndex = async function* (
  request: FallbackRequest,
  errors: ProviderFailure[],
  index: number,
): AsyncGenerator<
  { chunk: string; provider: AIProviderType },
  { streamed: boolean; errors: ProviderFailure[] }
> {
  const providerName = request.providerOrder[index];
  if (!providerName) {
    return { streamed: false, errors };
  }

  const provider = await resolveAvailableProvider(request.providers, providerName, errors);
  if (!provider) {
    return yield* streamWithFallbackAtIndex(request, errors, index + 1);
  }

  const providerStream = provider.stream(request.contextualPrompt, request.providerOptions);
  const iterator = providerStream[Symbol.asyncIterator]();
  const streamResult = yield* streamProviderIterator(providerName, iterator, errors, false);
  if (streamResult.hasYielded && !streamResult.failed) {
    return { streamed: true, errors };
  }

  return yield* streamWithFallbackAtIndex(request, errors, index + 1);
};

export const buildStreamFailure = (errors: ProviderFailure[]): Error =>
  new Error(`${API_ERROR_ALL_PROVIDERS_STREAM_FAILED}: ${buildFailureMessage(errors)}`);
