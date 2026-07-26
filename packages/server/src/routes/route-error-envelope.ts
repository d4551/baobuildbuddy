import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import { t } from "elysia";

/**
 * Canonical HTTP route error body (TypeBox SSOT for API error envelopes).
 * Matches automation route error shape used across handlers.
 */
export const routeErrorBodySchema = t.Object({
  error: t.Object({
    code: t.String({ minLength: 1 }),
    message: t.String({ minLength: 1 }),
    details: t.Optional(t.Record(t.String(), t.Unknown())),
  }),
});

/**
 * Simple `{ error, code?, fields? }` envelope used by global error handler / app model.
 */
export const simpleErrorBodySchema = t.Object(
  {
    error: t.String(),
    code: t.Optional(t.String()),
    details: t.Optional(t.String()),
    fields: t.Optional(t.Array(t.String())),
    id: t.Optional(t.String()),
  },
  { required: ["error"] },
);

export const simpleErrorResponseSchema = simpleErrorBodySchema;

/**
 * Standard error status map for routes that return the simple `{ error }` envelope.
 */
export const simpleRouteErrorResponses = {
  [HTTP_STATUS_BAD_REQUEST]: simpleErrorResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
  [HTTP_STATUS_UNPROCESSABLE_ENTITY]: simpleErrorResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
} as const;
