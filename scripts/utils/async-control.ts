/**
 * Tagged result for operations that may fail.
 */
export type OperationResult<T> = { ok: true; value: T } | { ok: false; error: Error };

/**
 * Narrows an arbitrary runtime value to a stable Error instance.
 * Kept generic so callers may pass values typed as `any` (e.g. Promise
 * rejection reasons) without widening the public contract to the unsafe top
 * type.
 */
export const asError = <T>(value: T): Error => {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return new Error(value);
  }
  return new Error(String(value));
};

/**
 * Captures a sync or async operation result without using try/catch syntax.
 */
export const captureResult = <T>(operation: () => Promise<T> | T): Promise<OperationResult<T>> =>
  Promise.resolve()
    .then(operation)
    .then(
      (value) => ({ ok: true, value }),
      (error) => ({ ok: false, error: asError(error) }),
    );

/**
 * Runs an operation and always executes the cleanup callback afterward.
 */
export const withCleanup = <T>(
  operation: () => Promise<T> | T,
  cleanup: () => Promise<void> | void,
): Promise<T> =>
  Promise.resolve()
    .then(operation)
    .then(
      (value) => Promise.resolve(cleanup()).then(() => value),
      (error) =>
        Promise.resolve(cleanup()).then(() => {
          throw asError(error);
        }),
    );

/**
 * Converts a rejection value into a human-readable message.
 */
export const toErrorMessage = (error: unknown, fallback: string = "Unexpected error."): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (valueIsNonEmptyString(error)) {
    return error;
  }
  return fallback;
};

const valueIsNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export type PollUntilOptions<T> = {
  /** Probe returning the resolved value, or null/undefined to keep polling. */
  readonly probe: () => Promise<T | null | undefined>;
  /** Delay between probes. */
  readonly intervalMs: number;
  /** Maximum total wait budget. */
  readonly timeoutMs: number;
  /** Sleep implementation (page-bound settle for browser proofs, Bun.sleep elsewhere). */
  readonly sleep: (milliseconds: number) => Promise<unknown>;
};

/**
 * Polls a probe until it resolves a value or the timeout elapses.
 * Recursive by construction: live browser capture requires strictly sequential
 * probing, so recursion is the honest no-await-in-loop shape.
 */
export const pollUntil = async <T>(options: PollUntilOptions<T>): Promise<T | null> => {
  const deadline = Date.now() + options.timeoutMs;
  const attempt = async (): Promise<T | null> => {
    const hit = await options.probe();
    if (hit !== null && hit !== undefined) {
      return hit;
    }
    if (Date.now() >= deadline) {
      return null;
    }
    await options.sleep(options.intervalMs);
    return attempt();
  };
  return attempt();
};
