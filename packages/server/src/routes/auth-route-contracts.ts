import Type, { StandardSchemaV1, type StaticParse } from "baobox";

export const authBootstrapBodySchema = Type.Object({
  setupToken: Type.Optional(Type.String({ minLength: 1 })),
});

export type AuthBootstrapBody = StaticParse<typeof authBootstrapBodySchema>;

export const authBootstrapBody = StandardSchemaV1(authBootstrapBodySchema);
