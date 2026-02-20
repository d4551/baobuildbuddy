import type { Ref } from "vue";

type SettledPromise<T> = { ok: true; value: T } | { ok: false; error: Error };

const loadingCounters = new WeakMap<Ref<boolean>, number>();

const toError = (value: unknown, fallbackMessage: string): Error => {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return new Error(value);
  }
  return new Error(fallbackMessage);
};

/**
 * Executes an async task while maintaining a reference-counted loading state.
 *
 * Nested calls that share the same `loading` ref remain loading until the outermost task finishes.
 */
export function withLoadingState<T>(loading: Ref<boolean>, task: () => Promise<T>): Promise<T> {
  const activeCount = (loadingCounters.get(loading) ?? 0) + 1;
  loadingCounters.set(loading, activeCount);
  loading.value = true;

  return task().finally(() => {
    const pendingCount = (loadingCounters.get(loading) ?? 1) - 1;
    if (pendingCount <= 0) {
      loadingCounters.delete(loading);
      loading.value = false;
      return;
    }
    loadingCounters.set(loading, pendingCount);
    loading.value = true;
  });
}

/**
 * Throws a deterministic error when an Eden response contains an error payload.
 */
export function assertApiResponse<TError>(error: TError | null | undefined, message: string): void {
  if (!error) {
    return;
  }
  throw new Error(message);
}

/**
 * Requires a nullable value to be present and returns it as non-nullable.
 */
export function requireValue<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
}

/**
 * Resolves a promise into a typed success/error union without `try/catch`.
 */
export function settlePromise<T>(
  promise: Promise<T>,
  fallbackMessage: string,
): Promise<SettledPromise<T>> {
  return promise.then(
    (value) => ({ ok: true, value }),
    (reason: unknown) => ({ ok: false, error: toError(reason, fallbackMessage) }),
  );
}
