/**
 * Shared error message extraction. Single source of truth for server and client.
 * Handles Error, Eden/API error shapes (Record with message, value.message).
 */
import { API_ERROR_UNKNOWN } from "../constants/api-errors";
import { isRecord } from "./type-guards";

function toMessage(value: string | undefined): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
}

/**
 * Extracts a user-facing error message from boundary error values.
 * Supports Error instances, Eden API error shape (Record with message/value.message).
 *
 * @param error - Boundary error value (Error, API response, etc.)
 * @param fallback - Fallback when no message can be extracted. Defaults to API_ERROR_UNKNOWN.
 */
export function toErrorMessage<T>(error: T, fallback?: string): string {
  const resolvedFallback = fallback ?? API_ERROR_UNKNOWN;

  if (error instanceof Error) {
    return toMessage(error.message) ?? resolvedFallback;
  }

  if (typeof error === "string") {
    return toMessage(error) ?? resolvedFallback;
  }

  if (!isRecord(error)) {
    return resolvedFallback;
  }

  const direct = toMessage(typeof error.message === "string" ? error.message : undefined);
  if (direct) {
    return direct;
  }

  const nested = error.value;
  if (!isRecord(nested)) {
    return resolvedFallback;
  }

  return (
    toMessage(typeof nested.message === "string" ? nested.message : undefined) ?? resolvedFallback
  );
}
