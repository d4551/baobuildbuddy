import type { Static } from "typebox";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { t } from "elysia";

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
} as const;
