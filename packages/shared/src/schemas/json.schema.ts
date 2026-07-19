import type { JsonArray, JsonObject, JsonValue } from "@bao/shared/utils/json";
import z from "zod";

/**
 * Primitive JSON value schema.
 */
export const jsonPrimitiveSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

/**
 * Recursive JSON value schema.
 */
export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([jsonPrimitiveSchema, z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)]),
);

/**
 * JSON object schema with string keys.
 */
export const jsonObjectSchema: z.ZodType<JsonObject> = z.record(z.string(), jsonValueSchema);

/**
 * JSON array schema.
 */
export const jsonArraySchema: z.ZodType<JsonArray> = z.array(jsonValueSchema);
