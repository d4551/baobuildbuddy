import { z } from "zod";
import { jsonObjectSchema } from "./json.schema";

/**
 * Canonical automation/runtime error classification.
 */
export const rpaRunErrorCodeSchema = z.enum([
  "PYTHON_RUNTIME_ERROR",
  "PYTHON_TIMEOUT",
  "PYTHON_CANCELLED",
  "SCRIPT_PROTOCOL_ERROR",
  "SCRIPT_OUTPUT_INVALID",
  "OUTPUT_PERSISTENCE_ERROR",
  "OUTPUT_VALIDATION_ERROR",
  "NETWORK_ERROR",
  "UNKNOWN_ERROR",
]);

/**
 * Error detail envelope shared across backend and UI contracts.
 */
export const errorEnvelopeSchema = z.object({
  code: rpaRunErrorCodeSchema,
  message: z.string().min(1).max(2_000),
  details: jsonObjectSchema.optional(),
});

/**
 * Result payload from a strict validator without control-flow exceptions.
 */
export interface ErrorEnvelopeResult {
  code: z.infer<typeof rpaRunErrorCodeSchema>;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Zod schema for typed error envelopes.
 */
export const rpaErrorEnvelopeSchema = errorEnvelopeSchema.extend({
  source: z.string().min(1).max(200),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
export type RpaRunErrorCode = z.infer<typeof rpaRunErrorCodeSchema>;
