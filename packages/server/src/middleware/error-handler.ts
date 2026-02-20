import { Elysia } from "elysia";

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
    return undefined;
  }

  const details = Reflect.get(error, "all");
  if (Array.isArray(details)) return details;
  if (typeof details === "function") {
    const computed = details();
    return Array.isArray(computed) ? computed : undefined;
  }

  return undefined;
}

/**
 * Centralized Elysia error envelope for deterministic API responses.
 */
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
    console.error(`[${code}]`, error instanceof Error ? error.message : error);
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: "Internal server error", code };
  },
);
