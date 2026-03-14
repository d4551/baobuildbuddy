import {
  API_ERROR_INTERNAL_SERVER,
  API_ERROR_NOT_FOUND,
  API_ERROR_VALIDATION_FAILED,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@bao/shared";
import { Elysia } from "elysia";
import { createServerLogger } from "../utils/logger";

/**
 * Collects validation details from Elysia error shapes when available.
 *
 * @param error Validation error payload.
 * @returns Flattened field-level details when present.
 */
interface ErrorWithAll {
  all?: unknown;
}

function hasAllProperty(obj: object): obj is ErrorWithAll {
  return "all" in obj;
}

function readValidationFields(error: unknown): unknown[] | undefined {
  if (typeof error !== "object" || error === null) {
    return;
  }

  const details = hasAllProperty(error) ? error.all : undefined;
  if (isUnknownArray(details)) return details;
  if (isValueFactory(details)) {
    const computed = details();
    return isUnknownArray(computed) ? computed : undefined;
  }

  return;
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
      return { error: API_ERROR_NOT_FOUND, code };
    }

    if (code === "VALIDATION") {
      set.status = HTTP_STATUS_BAD_REQUEST;
      return {
        error: API_ERROR_VALIDATION_FAILED,
        code,
        fields: readValidationFields(error),
      };
    }

    // Log internally but don't leak raw error details to the client
    logger.error(`[${code}]`, error instanceof Error ? error.message : error);
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: API_ERROR_INTERNAL_SERVER, code };
  },
);
