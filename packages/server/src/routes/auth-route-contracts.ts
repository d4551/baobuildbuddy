import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { t } from "elysia";
import type { Static } from "typebox";
import { simpleErrorResponseSchema } from "./route-error-envelope";

export const authBootstrapBodySchema = t.Object({
  setupToken: t.Optional(t.String({ minLength: 1 })),
});

export type AuthBootstrapBody = Static<typeof authBootstrapBodySchema>;

export const authBootstrapBody = authBootstrapBodySchema;

export const authStatusResponseSchema = t.Object({
  configured: t.Boolean(),
  authRequired: t.Boolean(),
  bootstrapRequired: t.Boolean(),
  setupTokenConfigured: t.Boolean(),
});

export const authInitSuccessResponseSchema = t.Object({
  configured: t.Boolean(),
  apiKey: t.Optional(t.String()),
  message: t.Optional(t.String()),
});

export const authStatusResponses = {
  [HTTP_STATUS_OK]: authStatusResponseSchema,
} as const;

export const authInitResponses = {
  [HTTP_STATUS_OK]: authInitSuccessResponseSchema,
  [HTTP_STATUS_BAD_REQUEST]: simpleErrorResponseSchema,
  [HTTP_STATUS_FORBIDDEN]: simpleErrorResponseSchema,
} as const;
