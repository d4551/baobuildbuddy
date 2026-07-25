import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
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

export const authConfiguredResponseSchema = t.Object({
  configured: t.Boolean(),
});

export const authInitSuccessResponseSchema = t.Object({
  configured: t.Boolean(),
  apiKey: t.Optional(t.String()),
  message: t.Optional(t.String()),
});

export const authStatusResponses = {
  [HTTP_STATUS_OK]: authStatusResponseSchema,
} as const;

export const authConfiguredResponses = {
  [HTTP_STATUS_OK]: authConfiguredResponseSchema,
} as const;

export const authInitResponses = {
  [HTTP_STATUS_OK]: authInitSuccessResponseSchema,
  [HTTP_STATUS_BAD_REQUEST]: simpleErrorResponseSchema,
  [HTTP_STATUS_FORBIDDEN]: simpleErrorResponseSchema,
} as const;

export const authRotateResponses = {
  [HTTP_STATUS_OK]: authInitSuccessResponseSchema,
  [HTTP_STATUS_UNAUTHORIZED]: simpleErrorResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
} as const;

export const authRevokeResponseSchema = t.Object({
  revoked: t.Boolean(),
  message: t.Optional(t.String()),
});

export const authRevokeResponses = {
  [HTTP_STATUS_OK]: authRevokeResponseSchema,
  [HTTP_STATUS_UNAUTHORIZED]: simpleErrorResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
} as const;
