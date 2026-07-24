import z from "zod";
import { SCHEMA_MAX_LENGTH_LONG, SCHEMA_MAX_LENGTH_SHORT } from "../constants/schema-limits";
import { rpaErrorEnvelopeSchema } from "./error-envelope.schema";
import { jsonObjectSchema } from "./json.schema";
import {
  rpaArtifactMetadataSchema,
  rpaEventTypeSchema,
  rpaProtocolVersionSchema,
  rpaRunIdentifierSchema,
  rpaRunSequenceSchema,
  rpaRunStatusSchema,
  rpaRunTypeSchema,
  rpaStepStatusSchema,
  rpaTimestampSchema,
} from "./rpa-protocol.schema";
const NUM_120 = 120;

/**
 * Step-level execution result emitted by the automation script.
 */
export const rpaRunStepSchema = z.object({
  action: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  status: z.enum(["ok", "error"]),
  message: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG).optional(),
});

/**
 * Terminal script result contract emitted by the automation runner.
 */
export const rpaRunResultSchema = z.object({
  success: z.boolean(),
  error: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG).nullable(),
  screenshots: z.array(z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG)).default([]),
  artifacts: z.array(rpaArtifactMetadataSchema).default([]),
  steps: z.array(rpaRunStepSchema).default([]),
});

/**
 * Common metadata present in all protocol events.
 */
export const rpaRunEventBaseSchema = z.object({
  protocolVersion: rpaProtocolVersionSchema,
  runId: rpaRunIdentifierSchema,
  sequence: rpaRunSequenceSchema,
  timestamp: rpaTimestampSchema,
});

/**
 * Progress event payload for in-flight execution updates.
 */
export const rpaProgressEventSchema = rpaRunEventBaseSchema.extend({
  eventType: z.literal(rpaEventTypeSchema.enum.progress),
  action: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  status: rpaStepStatusSchema,
  message: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG).optional(),
  step: z.number().int().nonnegative().optional(),
  totalSteps: z.number().int().positive().optional(),
});

/**
 * Terminal success or business-level failure event from the script.
 */
export const rpaResultEventSchema = rpaRunEventBaseSchema.extend({
  eventType: z.literal(rpaEventTypeSchema.enum.result),
  result: rpaRunResultSchema,
});

/**
 * Terminal protocol/runtime error event from the script.
 */
export const rpaErrorEventSchema = rpaRunEventBaseSchema.extend({
  eventType: z.literal(rpaEventTypeSchema.enum.error),
  error: rpaErrorEnvelopeSchema,
});

/**
 * Discriminated union of all supported RPA protocol events.
 */
export const rpaRunEventSchema = z.discriminatedUnion("eventType", [
  rpaProgressEventSchema,
  rpaResultEventSchema,
  rpaErrorEventSchema,
]);

/**
 * Shared run envelope persisted and returned by automation APIs.
 */
export const rpaRunExecutionEnvelopeSchema = z.object({
  id: rpaRunIdentifierSchema,
  type: rpaRunTypeSchema,
  status: rpaRunStatusSchema,
  jobId: z.string().trim().min(1).max(NUM_120).nullable(),
  userId: z.string().trim().min(1).max(NUM_120).nullable(),
  input: jsonObjectSchema.nullable(),
  output: z.union([rpaRunResultSchema, jsonObjectSchema]).nullable(),
  screenshots: z.array(z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG)).nullable(),
  error: z
    .union([z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG), rpaErrorEnvelopeSchema])
    .nullable(),
  progress: z.number().int().nonnegative().nullable(),
  currentStep: z.number().int().nonnegative().nullable(),
  totalSteps: z.number().int().nonnegative().nullable(),
  startedAt: rpaTimestampSchema.nullable(),
  completedAt: rpaTimestampSchema.nullable(),
  createdAt: rpaTimestampSchema,
  updatedAt: rpaTimestampSchema,
  exitCode: z.number().int().nullable(),
  timedOut: z.boolean(),
  aborted: z.boolean(),
  executionMs: z.number().int().nonnegative().nullable(),
});

/**
 * Union type for every supported protocol event.
 */
export type RpaRunEvent = z.infer<typeof rpaRunEventSchema>;

/**
 * Result payload type emitted by scripts and stored by server services.
 */
export type RpaRunResult = z.infer<typeof rpaRunResultSchema>;

/**
 * Persisted API envelope for an automation run record.
 */
export type RpaRunExecutionEnvelope = z.infer<typeof rpaRunExecutionEnvelopeSchema>;
