/**
 * Shared error message extraction. Single source of truth for server and client.
 * Handles Error, Eden/API error shapes (Record with message, value.message).
 */
import { API_ERROR_UNKNOWN } from "../constants/api-errors";
import { isRecord } from "./type-guards";

function toMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
}

/**
 * Extracts a user-facing error message from unknown error values.
 * Supports Error instances, Eden API error shape (Record with message/value.message).
 *
 * @param error - Unknown error (Error, API response, etc.)
 * @param fallback - Fallback when no message can be extracted. Defaults to API_ERROR_UNKNOWN.
 */
export function toErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof Error) {
    const message = toMessage(error.message);
    if (message) {
      return message;
    }
  }

  if (isRecord(error)) {
    const directMessage = toMessage(error.message);
    if (directMessage) {
      return directMessage;
    }

    const value = error.value;
    if (isRecord(value)) {
      const nestedMessage = toMessage(value.message);
      if (nestedMessage) {
        return nestedMessage;
      }
    }
  }

  return fallback ?? API_ERROR_UNKNOWN;
}
