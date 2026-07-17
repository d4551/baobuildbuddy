import {
  AI_DEFAULT_TEMPERATURE_CREATIVE,
} from "@bao/shared/constants/ai-generation";
import { AI_PROVIDER_CATALOG } from "@bao/shared/constants/ai-provider";
import {
  API_ERROR_OPENAI_V1_GENERATION_FAILED,
  API_ERROR_OPENAI_V1_MODEL_NOT_FOUND,
} from "@bao/shared/constants/api-errors";
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { SCHEMA_MAX_LENGTH_LONG } from "@bao/shared/constants/schema-limits";
import { AI_PROVIDER_IDS, type AIProviderType } from "@bao/shared/types/ai";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { settle } from "@bao/shared/utils/promise";
import { generateId } from "@bao/shared/utils/validation";
import { getAIService } from "./ai-route-support";
import type { OpenAIV1ChatCompletionsBody } from "./openai-v1-route-contracts";

const isAIProviderType = (value: string): value is AIProviderType =>
  (AI_PROVIDER_IDS as readonly string[]).includes(value);

const MODEL_ID_SEPARATOR = "/";
const OPENAI_V1_EPOCH_SECONDS = () => Math.floor(Date.now() / 1000);

export type OpenAIV1ModelRecord = {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
};

const routeResult = <const Status extends number, Body>(status: Status, body: Body) => ({
  status,
  body,
});

export const toOpenAIV1Error = (message: string, type = "invalid_request_error", code: string | null = null) => ({
  error: { message, type, code },
});

export const buildOpenAIV1ModelId = (provider: AIProviderType, model: string): string =>
  `${provider}${MODEL_ID_SEPARATOR}${model}`;

export const parseOpenAIV1ModelId = (
  modelId: string,
): { provider: AIProviderType | null; model: string } => {
  const separatorIndex = modelId.indexOf(MODEL_ID_SEPARATOR);
  if (separatorIndex <= 0) {
    return { provider: null, model: modelId };
  }
  const provider = modelId.slice(0, separatorIndex);
  const model = modelId.slice(separatorIndex + 1);
  return {
    provider: isAIProviderType(provider) ? provider : null,
    model,
  };
};

export const listOpenAIV1Models = async (): Promise<OpenAIV1ModelRecord[]> => {
  const aiService = await getAIService();
  const created = OPENAI_V1_EPOCH_SECONDS();
  const statuses = await aiService.getAvailableProviders();
  const models: OpenAIV1ModelRecord[] = [];

  for (const status of statuses) {
    if (!status.available) {
      continue;
    }
    const activeModel = aiService.getActiveModel(status.provider);
    const modelCandidates = [
      activeModel,
      status.selectedModel,
      status.availableModels?.[0],
      "default",
    ].filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
    const modelName = modelCandidates[0] ?? "default";
    models.push({
      id: buildOpenAIV1ModelId(status.provider, modelName),
      object: "model",
      created,
      owned_by: status.provider,
    });
  }

  // When no live providers are available, expose catalog hints so SDK clients can discover IDs.
  if (models.length === 0) {
    for (const provider of AI_PROVIDER_CATALOG) {
      const hint = provider.modelHints[0] ?? "default";
      models.push({
        id: buildOpenAIV1ModelId(provider.id, hint),
        object: "model",
        created,
        owned_by: provider.id,
      });
    }
  }

  return models;
};

export const getOpenAIV1Model = async (modelId: string) => {
  const models = await listOpenAIV1Models();
  const match = models.find((entry) => entry.id === modelId);
  if (!match) {
    return routeResult(
      HTTP_STATUS_NOT_FOUND,
      toOpenAIV1Error(API_ERROR_OPENAI_V1_MODEL_NOT_FOUND, "invalid_request_error", "model_not_found"),
    );
  }
  return routeResult(HTTP_STATUS_OK, match);
};

const extractUserPrompt = (messages: OpenAIV1ChatCompletionsBody["messages"]): string => {
  const reversed = [...messages].reverse();
  const lastUser = reversed.find((message) => message.role === "user");
  return lastUser?.content ?? messages[messages.length - 1]?.content ?? "";
};

const extractSystemPrompt = (
  messages: OpenAIV1ChatCompletionsBody["messages"],
): string | undefined => {
  const systemMessages = messages.filter((message) => message.role === "system");
  if (systemMessages.length === 0) {
    return;
  }
  return systemMessages.map((message) => message.content).join("\n\n");
};

export const createOpenAIV1ChatCompletion = async (body: OpenAIV1ChatCompletionsBody) => {
  const models = await listOpenAIV1Models();
  const requested = models.find((entry) => entry.id === body.model);
  if (!requested) {
    return routeResult(
      HTTP_STATUS_NOT_FOUND,
      toOpenAIV1Error(API_ERROR_OPENAI_V1_MODEL_NOT_FOUND, "invalid_request_error", "model_not_found"),
    );
  }

  const parsed = parseOpenAIV1ModelId(body.model);
  const aiService = await getAIService();
  const prompt = extractUserPrompt(body.messages);
  const systemPrompt = extractSystemPrompt(body.messages);
  const conversationMessages = body.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  const generationResult = await settle(
    aiService.generate(prompt, {
      purpose: "chat",
      systemPrompt,
      messages: conversationMessages,
      temperature: body.temperature ?? AI_DEFAULT_TEMPERATURE_CREATIVE,
      maxTokens: body.max_tokens ?? SCHEMA_MAX_LENGTH_LONG,
      provider: parsed.provider ?? undefined,
      model: parsed.model || undefined,
    }),
  );

  if (generationResult.status === "rejected") {
    return routeResult(
      HTTP_STATUS_INTERNAL_SERVER_ERROR,
      toOpenAIV1Error(
        toErrorMessage(generationResult.reason, API_ERROR_OPENAI_V1_GENERATION_FAILED),
        "server_error",
      ),
    );
  }

  const response = generationResult.value;
  if (response.error) {
    return routeResult(
      HTTP_STATUS_INTERNAL_SERVER_ERROR,
      toOpenAIV1Error(response.error, "server_error"),
    );
  }

  const completionId = `chatcmpl-${generateId()}`;
  const promptTokens = Math.max(1, Math.ceil(prompt.length / 4));
  const completionTokens = Math.max(1, Math.ceil(response.content.length / 4));

  return routeResult(HTTP_STATUS_OK, {
    id: completionId,
    object: "chat.completion" as const,
    created: OPENAI_V1_EPOCH_SECONDS(),
    model: body.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant" as const,
          content: response.content,
        },
        finish_reason: "stop" as const,
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  });
};

export const createOpenAIV1ChatCompletionStream = async (
  body: OpenAIV1ChatCompletionsBody,
): Promise<Response> => {
  const completionResult = await createOpenAIV1ChatCompletion(body);
  if (completionResult.status !== HTTP_STATUS_OK) {
    return new Response(JSON.stringify(completionResult.body), {
      status: completionResult.status,
      headers: { "content-type": "application/json" },
    });
  }

  const completion = completionResult.body;
  const chunkId = completion.id;
  const content = completion.choices[0]?.message.content ?? "";
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const firstChunk = {
        id: chunkId,
        object: "chat.completion.chunk",
        created: completion.created,
        model: completion.model,
        choices: [
          {
            index: 0,
            delta: { role: "assistant", content },
            finish_reason: null,
          },
        ],
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(firstChunk)}\n\n`));
      const finalChunk = {
        id: chunkId,
        object: "chat.completion.chunk",
        created: completion.created,
        model: completion.model,
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: "stop",
          },
        ],
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalChunk)}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    status: HTTP_STATUS_OK,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
};
