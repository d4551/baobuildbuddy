import { JOB_TYPES } from "../constants/jobs";
import type { JobType } from "../types/jobs";

/** Boundary value arriving from API payloads or DB rows. */
type JobTypeInput = string | null | undefined;

/**
 * Canonical job-type guard: membership in the shared JOB_TYPES contract.
 */
export const isJobType = (value: JobTypeInput): value is JobType =>
  typeof value === "string" && JOB_TYPES.some((jobType) => jobType === value);

/**
 * Normalizes an untrusted boundary value (API payload, DB row) to a JobType,
 * falling back to "full-time" when the value is not a known job type.
 */
export const normalizeJobType = (value: JobTypeInput): JobType =>
  isJobType(value) ? value : "full-time";
