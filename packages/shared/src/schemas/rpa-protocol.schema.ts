import z from "zod";
import { AUTOMATION_RUN_STATUSES, AUTOMATION_RUN_TYPES } from "../constants/automation";
import { SCHEMA_MAX_LENGTH_LONG, SCHEMA_MAX_LENGTH_SHORT } from "../constants/schema-limits";

/**
 * Canonical protocol version emitted by Bun automation scripts.
 */
export const RPA_PROTOCOL_VERSION = "1.0" as const;

/**
 * Default bounded line-buffer size used for script stdio capture.
 */
export const RPA_STDIO_BUFFER_LIMIT = 200;

/**
 * Stable protocol version schema for script events.
 */
export const rpaProtocolVersionSchema = z.literal(RPA_PROTOCOL_VERSION);

/**
 * Stable run identifier used across API, websocket, and script payloads.
 */
export const rpaRunIdentifierSchema = z.string().trim().min(8).max(128);

/**
 * Monotonic sequence value for script-emitted events.
 */
export const rpaRunSequenceSchema = z.number().int().nonnegative();

/**
 * Timestamp schema used by script protocol events.
 */
export const rpaTimestampSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => Number.isFinite(Date.parse(value)), "Invalid timestamp");

/**
 * Supported protocol event kinds.
 */
export const rpaEventTypeSchema = z.enum(["progress", "result", "error"]);

/**
 * Supported normalized step status values.
 */
export const rpaStepStatusSchema = z.enum(["pending", "running", "success", "error"]);

/**
 * Artifact categories emitted by automation scripts.
 */
export const rpaArtifactKindSchema = z.enum(["screenshot", "trace", "document", "log"]);

/**
 * Normalized artifact metadata contract.
 */
export const rpaArtifactMetadataSchema = z.object({
  id: z.string().trim().min(1).max(120),
  kind: rpaArtifactKindSchema,
  path: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
  label: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  mimeType: z.string().trim().min(1).max(120).optional(),
});

/**
 * Shared automation run lifecycle status schema.
 */
export const rpaRunStatusSchema = z.enum(AUTOMATION_RUN_STATUSES);

/**
 * Shared automation run type schema.
 */
export const rpaRunTypeSchema = z.enum(AUTOMATION_RUN_TYPES);

/**
 * Deterministic UI states for automation run surfaces.
 */
export const automationRunUiStateSchema = z.enum([
  "idle",
  "loading",
  "success",
  "empty",
  "errorRetryable",
  "errorNonRetryable",
  "unauthorized",
]);

/**
 * Union type of all supported automation UI states.
 */
export type AutomationRunUiState = z.infer<typeof automationRunUiStateSchema>;
