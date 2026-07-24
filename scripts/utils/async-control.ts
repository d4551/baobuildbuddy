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
export const toErrorMessage = <T>(error: T, fallback: string = "Unexpected error."): string => {
  const err = asError(error);
  if (err.message.trim().length > 0) {
    return err.message;
  }
  return fallback;
};
