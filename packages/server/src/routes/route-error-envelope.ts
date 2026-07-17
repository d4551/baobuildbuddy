import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import Type, { StandardSchemaV1 } from "baobox";

/**
 * Canonical HTTP route error body (baobox SSOT for API error envelopes).
 * Matches automation route error shape used across handlers.
 */
export const routeErrorBodySchema = Type.Object({
  error: Type.Object({
    code: Type.String({ minLength: 1 }),
    message: Type.String({ minLength: 1 }),
    details: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  }),
});

/**
 * Simple `{ error, code?, fields? }` envelope used by global error handler / app model.
 */
export const simpleErrorBodySchema = Type.Object(
  {
    error: Type.String(),
    code: Type.Optional(Type.String()),
    fields: Type.Optional(Type.Array(Type.String())),
  },
  { required: ["error"] },
);

export const simpleErrorResponseSchema = StandardSchemaV1(simpleErrorBodySchema);

/**
 * Standard error status map for routes that return the nested automation-style envelope.
 */
export const nestedRouteErrorResponses = {
  [HTTP_STATUS_BAD_REQUEST]: StandardSchemaV1(routeErrorBodySchema),
  [HTTP_STATUS_NOT_FOUND]: StandardSchemaV1(routeErrorBodySchema),
  [HTTP_STATUS_CONFLICT]: StandardSchemaV1(routeErrorBodySchema),
  [HTTP_STATUS_UNPROCESSABLE_ENTITY]: StandardSchemaV1(routeErrorBodySchema),
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: StandardSchemaV1(routeErrorBodySchema),
} as const;

/**
 * Standard error status map for routes that return the simple `{ error }` envelope.
 */
export const simpleRouteErrorResponses = {
  [HTTP_STATUS_BAD_REQUEST]: simpleErrorResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
  [HTTP_STATUS_UNPROCESSABLE_ENTITY]: simpleErrorResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
} as const;
