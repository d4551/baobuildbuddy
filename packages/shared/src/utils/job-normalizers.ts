import { JOB_TYPES } from "../constants/jobs";
import type { JobType } from "../types/jobs";

/**
 * Canonical job-type guard: membership in the shared JOB_TYPES contract.
 */
export const isJobType = (value: unknown): value is JobType =>
  typeof value === "string" && JOB_TYPES.some((jobType) => jobType === value);

/**
 * Normalizes an untrusted boundary value (API payload, DB row) to a JobType,
 * falling back to "full-time" when the value is not a known job type.
 */
export const normalizeJobType = (value: unknown): JobType =>
  isJobType(value) ? value : "full-time";
