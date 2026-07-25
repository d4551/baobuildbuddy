/**
 * Timing and step indexes for deterministic automation verification runs.
 */

/** Yield between verify progress events so consumers observe intermediate steps. */
export const VERIFY_PROGRESS_YIELD_MS = 50;

/** Stable step count for verify-run progress emission. */
export const VERIFY_TOTAL_STEPS = 3 as const;

/** Progress step indexes for the deterministic verify path. */
export const VERIFY_STEP_INDEX = {
  bootstrap: 1,
  fields: 2,
  submission: VERIFY_TOTAL_STEPS,
} as const;
