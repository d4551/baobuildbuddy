/**
 * Shared error message extraction. Single source of truth for server and client.
 * Handles Error, Eden/API error shapes (Record with message, value.message).
 */
import { API_ERROR_UNKNOWN } from "../constants/api-errors";
import { isRecord } from "./type-guards";

function toMessage(value: string | number | boolean | null | object | undefined): string | null {
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
  if (error instanceof Error) {
    const message = toMessage(error.message);
    if (message) {
      return message;
    }
  }

  if (isRecord(error)) {
    const messageValue = error.message;
    const directMessage = toMessage(
      typeof messageValue === "string" ||
        typeof messageValue === "number" ||
        typeof messageValue === "boolean" ||
        messageValue === null ||
        typeof messageValue === "object"
        ? messageValue
        : undefined,
    );
    if (directMessage) {
      return directMessage;
    }

    const value = error.value;
    if (isRecord(value)) {
      const nestedValue = value.message;
      const nestedMessage = toMessage(
        typeof nestedValue === "string" ||
          typeof nestedValue === "number" ||
          typeof nestedValue === "boolean" ||
          nestedValue === null ||
          typeof nestedValue === "object"
          ? nestedValue
          : undefined,
      );
      if (nestedMessage) {
        return nestedMessage;
      }
    }
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallback ?? API_ERROR_UNKNOWN;
}
