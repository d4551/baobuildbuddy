import type { Static } from "typebox";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
} from "@bao/shared/constants/http";
import { SCHEMA_MAX_ITEMS_LARGE, SCHEMA_MAX_LENGTH_LONG } from "@bao/shared/constants/schema-limits";
import { t } from "elysia";

export const openaiCompatChatMessageSchema = t.Object({
  role: t.Union([t.Literal("system"), t.Literal("user"), t.Literal("assistant")]),
  content: t.String({ maxLength: SCHEMA_MAX_LENGTH_LONG }),
});

export const openaiCompatChatCompletionsBodySchema = t.Object({
  model: t.String({ minLength: 1 }),
  messages: t.Array(openaiCompatChatMessageSchema, {
    minItems: 1,
    maxItems: SCHEMA_MAX_ITEMS_LARGE,
  }),
  temperature: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
  max_tokens: t.Optional(t.Number({ minimum: 1, maximum: SCHEMA_MAX_LENGTH_LONG })),
  stream: t.Optional(t.Boolean()),
});

export type OpenAICompatChatCompletionsBody = Static<typeof openaiCompatChatCompletionsBodySchema>;

export const openaiCompatModelParamsSchema = t.Object({
  model: t.String({ minLength: 1 }),
});

export type OpenAICompatModelParams = Static<typeof openaiCompatModelParamsSchema>;

export const openaiCompatErrorBodySchema = t.Object({
  error: t.Object({
    message: t.String(),
    type: t.String(),
    code: t.Optional(t.Union([t.String(), t.Null()])),
  }),
});

export const openaiCompatModelObjectSchema = t.Object({
  id: t.String(),
  object: t.Literal("model"),
  created: t.Number(),
  owned_by: t.String(),
});

export const openaiCompatModelsListSchema = t.Object({
  object: t.Literal("list"),
  data: t.Array(openaiCompatModelObjectSchema),
});

export const openaiCompatChatChoiceSchema = t.Object({
  index: t.Number(),
  message: t.Object({
    role: t.Literal("assistant"),
    content: t.String(),
  }),
  finish_reason: t.Union([t.Literal("stop"), t.Literal("length"), t.Null()]),
});

export const openaiCompatChatCompletionSchema = t.Object({
  id: t.String(),
  object: t.Literal("chat.completion"),
  created: t.Number(),
  model: t.String(),
  choices: t.Array(openaiCompatChatChoiceSchema),
  usage: t.Object({
    prompt_tokens: t.Number(),
    completion_tokens: t.Number(),
    total_tokens: t.Number(),
  }),
});

export const openaiCompatModelsListResponses = {
  [HTTP_STATUS_OK]: openaiCompatModelsListSchema,
  [HTTP_STATUS_UNAUTHORIZED]: openaiCompatErrorBodySchema,
} as const;

export const openaiCompatModelGetResponses = {
  [HTTP_STATUS_OK]: openaiCompatModelObjectSchema,
  [HTTP_STATUS_NOT_FOUND]: openaiCompatErrorBodySchema,
  [HTTP_STATUS_UNAUTHORIZED]: openaiCompatErrorBodySchema,
} as const;

export const openaiCompatChatCompletionsResponses = {
  [HTTP_STATUS_OK]: openaiCompatChatCompletionSchema,
  [HTTP_STATUS_BAD_REQUEST]: openaiCompatErrorBodySchema,
  [HTTP_STATUS_NOT_FOUND]: openaiCompatErrorBodySchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: openaiCompatErrorBodySchema,
  [HTTP_STATUS_UNAUTHORIZED]: openaiCompatErrorBodySchema,
} as const;
