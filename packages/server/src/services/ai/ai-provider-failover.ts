import { AI_CHAT_CONTEXT_MESSAGE_LIMIT } from "@bao/shared/constants/ai-chat";
import {
  HUGGING_FACE_SUPPORTED_MODELS,
  LOCAL_AI_AUTO_DETECT_MODEL,
} from "@bao/shared/constants/ai-provider";
import {
  API_ERROR_ALL_PROVIDERS_GENERATE_FAILED,
  API_ERROR_ALL_PROVIDERS_STREAM_FAILED,
} from "@bao/shared/constants/api-errors";
import type { AIProviderType, AIResponse, GenerateOptions } from "@bao/shared/types/ai";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { settle } from "@bao/shared/utils/promise";
import { createServerLogger } from "../../utils/logger";
import type { AIProvider } from "./provider-interface";

const aiFailoverLogger = createServerLogger("ai-provider-failover");

export type ProviderFailure = { provider: AIProviderType; error: string };

interface FailoverRequest {
  providers: Map<AIProviderType, AIProvider>;
  providerOrder: AIProviderType[];
  routingTarget: {
    purpose: GenerateOptions["purpose"] extends infer P ? P : string;
    provider: AIProviderType;
    model?: string;
  };
  contextualPrompt: string;
  providerOptions: Omit<GenerateOptions, "messages"> | undefined;
}

const describeProviderError = (
  providerName: AIProviderType,
  operation: string,
  error: unknown,
): string => {
  const errorMessage = toErrorMessage(error);
  aiFailoverLogger.error("AI provider operation failed", {
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

const withRequestedProvider = (
  providerName: AIProviderType,
  providerOptions?: Omit<GenerateOptions, "messages">,
): Omit<GenerateOptions, "messages"> | undefined => {
  if (!providerOptions) {
    return { provider: providerName };
  }

  return {
    ...providerOptions,
    provider: providerName,
  };
};

const isNonEmptyString = (value?: string): value is string =>
  typeof value === "string" && value.trim().length > 0;

const NON_CONCRETE_MODELS = new Set([LOCAL_AI_AUTO_DETECT_MODEL, "auto-router"]);
const isSupportedHuggingFaceModel = (
  value: string,
): value is (typeof HUGGING_FACE_SUPPORTED_MODELS)[number] =>
  HUGGING_FACE_SUPPORTED_MODELS.some((model) => model === value);

const resolveProviderModel = (
  provider: AIProvider,
  providerName: AIProviderType,
  routingTarget: FailoverRequest["routingTarget"],
  providerOptions?: Omit<GenerateOptions, "messages">,
): string | undefined => {
  const providerModel = isNonEmptyString(provider.model) ? provider.model.trim() : undefined;
  const requestedModel =
    providerName === routingTarget.provider && isNonEmptyString(providerOptions?.model)
      ? providerOptions.model.trim()
      : undefined;
  const requestedModelIsConcrete =
    requestedModel &&
    !NON_CONCRETE_MODELS.has(requestedModel) &&
    (providerName !== "huggingface" || isSupportedHuggingFaceModel(requestedModel));

  return (requestedModelIsConcrete ? requestedModel : undefined) ?? providerModel;
};

const buildProviderOptionsForProvider = (
  request: FailoverRequest,
  providerName: AIProviderType,
  provider: AIProvider,
): Omit<GenerateOptions, "messages"> | undefined => {
  const providerOptions = withRequestedProvider(providerName, request.providerOptions);
  const model = resolveProviderModel(
    provider,
    providerName,
    request.routingTarget,
    providerOptions,
  );

  if (!providerOptions) {
    return model
      ? {
          purpose: request.routingTarget.purpose,
          provider: providerName,
          model,
        }
      : {
          purpose: request.routingTarget.purpose,
          provider: providerName,
        };
  }

  const { temperature, maxTokens, topP, topK, timeout, systemPrompt } = providerOptions;
  return {
    purpose: request.routingTarget.purpose,
    provider: providerName,
    ...(model ? { model } : {}),
    temperature,
    maxTokens,
    topP,
    topK,
    timeout,
    systemPrompt,
  };
};

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
  request: FailoverRequest,
  providerName: AIProviderType,
  errors: ProviderFailure[],
): Promise<AIResponse | null> => {
  const provider = await resolveAvailableProvider(request.providers, providerName, errors);
  if (!provider) {
    return null;
  }

  const providerOptions = buildProviderOptionsForProvider(request, providerName, provider);
  const generationResult = await settle(
    provider.generate(request.contextualPrompt, providerOptions),
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

export type GenerateFailoverResult =
  | { success: true; data: AIResponse; errors: ProviderFailure[] }
  | {
      success: false;
      error: { code: "ALL_PROVIDERS_GENERATE_FAILED"; message: string };
      errors: ProviderFailure[];
    };

export const generateWithProviderFailover = async (
  request: FailoverRequest,
): Promise<GenerateFailoverResult> => {
  const errors: ProviderFailure[] = [];
  const response = await generateWithFailoverAtIndex(request, errors, 0);
  if (response) {
    return { success: true, data: response, errors };
  }

  aiFailoverLogger.error("All providers failed to generate", {
    failures: errors,
  });

  return {
    success: false,
    error: {
      code: "ALL_PROVIDERS_GENERATE_FAILED",
      message: API_ERROR_ALL_PROVIDERS_GENERATE_FAILED,
    },
    errors,
  };
};

const generateWithFailoverAtIndex = async (
  request: FailoverRequest,
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

  return generateWithFailoverAtIndex(request, errors, index + 1);
};

export const buildGenerateFailure = (errors: ProviderFailure[]): Error => {
  aiFailoverLogger.error("All providers failed to generate", {
    failures: errors,
  });
  return new Error(API_ERROR_ALL_PROVIDERS_GENERATE_FAILED);
};

export const streamWithProviderFailover = async function* (
  request: FailoverRequest,
): AsyncGenerator<
  { chunk: string; provider: AIProviderType },
  { streamed: boolean; errors: ProviderFailure[] }
> {
  const errors: ProviderFailure[] = [];
  return yield* streamWithFailoverAtIndex(request, errors, 0);
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

const streamWithFailoverAtIndex = async function* (
  request: FailoverRequest,
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
    return yield* streamWithFailoverAtIndex(request, errors, index + 1);
  }

  const providerStream = provider.stream(
    request.contextualPrompt,
    buildProviderOptionsForProvider(request, providerName, provider),
  );
  const iterator = providerStream[Symbol.asyncIterator]();
  const streamResult = yield* streamProviderIterator(providerName, iterator, errors, false);
  if (streamResult.hasYielded && !streamResult.failed) {
    return { streamed: true, errors };
  }

  return yield* streamWithFailoverAtIndex(request, errors, index + 1);
};

export const buildStreamFailure = (errors: ProviderFailure[]): Error => {
  aiFailoverLogger.error("All providers failed to stream", {
    failures: errors,
  });
  return new Error(API_ERROR_ALL_PROVIDERS_STREAM_FAILED);
};
