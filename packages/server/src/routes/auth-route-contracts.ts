import type { Static } from "typebox";
import { t } from "elysia";

export const authBootstrapBodySchema = t.Object({
  setupToken: t.Optional(t.String({ minLength: 1 })),
});

export type AuthBootstrapBody = Static<typeof authBootstrapBodySchema>;

export const authBootstrapBody = authBootstrapBodySchema;
