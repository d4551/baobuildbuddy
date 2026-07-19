/**
 * Wraps a single Promise in Promise.allSettled and returns the first (and only) result.
 * Used for consistent error handling without try-catch.
 * Rejection reasons are normalized to Error at the boundary (throw-safe).
 */

export type SettledResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: Error };

export const settle = async <T>(operation: Promise<T>): Promise<SettledResult<T>> => {
  const outcomes = await Promise.allSettled([operation]);
  const result = outcomes[0];
  if (!result) {
    return { status: "rejected", reason: new Error("settle produced no outcome") };
  }
  if (result.status === "fulfilled") {
    return { status: "fulfilled", value: result.value };
  }

  const rejection: { reason?: Error | string | number | boolean | null | object } = result;
  const reason = rejection.reason;
  if (reason instanceof Error) {
    return { status: "rejected", reason };
  }
  if (typeof reason === "string") {
    return { status: "rejected", reason: new Error(reason) };
  }
  if (typeof reason === "number" || typeof reason === "boolean") {
    return { status: "rejected", reason: new Error(String(reason)) };
  }
  if (reason === null || reason === undefined) {
    return { status: "rejected", reason: new Error("null rejection") };
  }
  return { status: "rejected", reason: new Error("object rejection") };
};
