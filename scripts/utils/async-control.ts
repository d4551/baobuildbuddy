/**
 * Tagged result for operations that may fail.
 */
export type OperationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: unknown };

/**
 * Captures a sync or async operation result without using try/catch syntax.
 */
export const captureResult = <T>(operation: () => Promise<T> | T): Promise<OperationResult<T>> =>
  Promise.resolve().then(operation).then(
    (value) => ({ ok: true, value }),
    (error: unknown) => ({ ok: false, error }),
  );

/**
 * Runs an operation and always executes the cleanup callback afterward.
 */
export const withCleanup = <T>(
  operation: () => Promise<T> | T,
  cleanup: () => Promise<void> | void,
): Promise<T> => Promise.resolve().then(operation).finally(() => cleanup());

/**
 * Converts an unknown error payload into a stable human-readable message.
 */
export const toErrorMessage = (
  error: unknown,
  fallback: string = "Unexpected error.",
): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  return fallback;
};
