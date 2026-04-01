import { StandardSchemaV1 } from "baobox";
import Type, { type StaticParse } from "baobox";

export type RouteSetState = {
  status?: number | string;
};

export const authBootstrapBodySchema = Type.Object({
  setupToken: Type.Optional(Type.String({ minLength: 1 })),
});

export type AuthBootstrapBody = StaticParse<typeof authBootstrapBodySchema>;

export const authBootstrapBody = StandardSchemaV1(authBootstrapBodySchema);
