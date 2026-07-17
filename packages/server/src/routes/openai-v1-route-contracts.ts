import type { Static } from "typebox";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
} from "@bao/shared/constants/http";
import {
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_LENGTH_LONG,
} from "@bao/shared/constants/schema-limits";
import { t } from "elysia";

export const openaiV1ChatMessageSchema = t.Object({
  role: t.Union([t.Literal("system"), t.Literal("user"), t.Literal("assistant")]),
  content: t.String({ maxLength: SCHEMA_MAX_LENGTH_LONG }),
});

export const openaiV1ChatCompletionsBodySchema = t.Object({
  model: t.String({ minLength: 1 }),
  messages: t.Array(openaiV1ChatMessageSchema, {
    minItems: 1,
    maxItems: SCHEMA_MAX_ITEMS_LARGE,
  }),
  temperature: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
  max_tokens: t.Optional(t.Number({ minimum: 1, maximum: SCHEMA_MAX_LENGTH_LONG })),
  stream: t.Optional(t.Boolean()),
});

export type OpenAIV1ChatCompletionsBody = Static<typeof openaiV1ChatCompletionsBodySchema>;

export const openaiV1ModelParamsSchema = t.Object({
  model: t.String({ minLength: 1 }),
});

export type OpenAIV1ModelParams = Static<typeof openaiV1ModelParamsSchema>;

export const openaiV1ErrorBodySchema = t.Object({
  error: t.Object({
    message: t.String(),
    type: t.String(),
    code: t.Optional(t.Union([t.String(), t.Null()])),
  }),
});

export const openaiV1ModelObjectSchema = t.Object({
  id: t.String(),
  object: t.Literal("model"),
  created: t.Number(),
  owned_by: t.String(),
});

export const openaiV1ModelsListSchema = t.Object({
  object: t.Literal("list"),
  data: t.Array(openaiV1ModelObjectSchema),
});

export const openaiV1ChatChoiceSchema = t.Object({
  index: t.Number(),
  message: t.Object({
    role: t.Literal("assistant"),
    content: t.String(),
  }),
  finish_reason: t.Union([t.Literal("stop"), t.Literal("length"), t.Null()]),
});

export const openaiV1ChatCompletionSchema = t.Object({
  id: t.String(),
  object: t.Literal("chat.completion"),
  created: t.Number(),
  model: t.String(),
  choices: t.Array(openaiV1ChatChoiceSchema),
  usage: t.Object({
    prompt_tokens: t.Number(),
    completion_tokens: t.Number(),
    total_tokens: t.Number(),
  }),
});

export const openaiV1ModelsListResponses = {
  [HTTP_STATUS_OK]: openaiV1ModelsListSchema,
  [HTTP_STATUS_UNAUTHORIZED]: openaiV1ErrorBodySchema,
} as const;

export const openaiV1ModelGetResponses = {
  [HTTP_STATUS_OK]: openaiV1ModelObjectSchema,
  [HTTP_STATUS_NOT_FOUND]: openaiV1ErrorBodySchema,
  [HTTP_STATUS_UNAUTHORIZED]: openaiV1ErrorBodySchema,
} as const;

export const openaiV1ChatCompletionsResponses = {
  [HTTP_STATUS_OK]: openaiV1ChatCompletionSchema,
  [HTTP_STATUS_BAD_REQUEST]: openaiV1ErrorBodySchema,
  [HTTP_STATUS_NOT_FOUND]: openaiV1ErrorBodySchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: openaiV1ErrorBodySchema,
  [HTTP_STATUS_UNAUTHORIZED]: openaiV1ErrorBodySchema,
} as const;
