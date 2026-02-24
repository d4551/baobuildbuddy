import { Elysia } from "elysia";
import { createServerLogger } from "../utils/logger";

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

/**
 * Collects validation details from Elysia error shapes when available.
 *
 * @param error Validation error payload.
 * @returns Flattened field-level details when present.
 */
function readValidationFields(error: unknown): unknown[] | undefined {
  if (typeof error !== "object" || error === null) {
    return ;
  }

  const details = "all" in error ? (error as { all?: unknown }).all : undefined;
  if (isUnknownArray(details)) return details;
  if (isValueFactory(details)) {
    const computed = details();
    return isUnknownArray(computed) ? computed : undefined;
  }

  return ;
}

/**
 * Narrows an unknown value to a parameterless function returning unknown.
 */
function isValueFactory(value: unknown): value is () => unknown {
  return typeof value === "function";
}

/**
 * Narrows unknown values to unknown arrays without leaking any.
 */
function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Centralized Elysia error envelope for deterministic API responses.
 */
const logger = createServerLogger("error-handler");

export const errorHandler = new Elysia({ name: "error-handler" }).onError(
  ({ code, error, set }) => {
    if (code === "NOT_FOUND") {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: "Not found", code };
    }

    if (code === "VALIDATION") {
      set.status = HTTP_STATUS_BAD_REQUEST;
      return {
        error: "Validation failed",
        code,
        fields: readValidationFields(error),
      };
    }

    // Log internally but don't leak raw error details to the client
    logger.error(`[${code}]`, error instanceof Error ? error.message : error);
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: "Internal server error", code };
  },
);
