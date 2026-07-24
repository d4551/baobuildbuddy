import {
  API_ERROR_INTERNAL_SERVER,
  API_ERROR_NOT_FOUND,
  API_ERROR_VALIDATION_FAILED,
} from "@bao/shared/constants/api-errors";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@bao/shared/constants/http";
import { TRACE_ID_HEADER } from "@bao/shared/constants/runtime";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { Elysia } from "elysia";
import { createServerLogger } from "../utils/logger";

interface ValidationField {
  path: string;
  message: string;
}

interface HasValidationAll {
  all: readonly ValidationField[] | (() => readonly ValidationField[]);
}

function hasValidationAll(value: object): value is HasValidationAll {
  return "all" in value && value.all !== null && value.all !== undefined;
}

function hasArrayAll(value: object): value is { all: readonly ValidationField[] } {
  return hasValidationAll(value) && Array.isArray(value.all);
}

function collectValidationFields(error: object): ValidationField[] | undefined {
  if (hasArrayAll(error)) {
    const entries = error.all;
    return entries.length > 0 ? [...entries] : undefined;
  }
  if (hasValidationAll(error)) {
    const fn = error.all;
    if (typeof fn === "function") {
      const entries = fn();
      return entries.length > 0 ? [...entries] : undefined;
    }
  }
  return undefined;
}

const logger = createServerLogger("error-handler");

/**
 * Centralized error handler for Elysia that extracts trace IDs and returns
 * typed JSON error responses for each error category.
 */
export const errorHandler = new Elysia({ name: "error-handler" }).error((context) => {
  const { error, set } = context;
  const code = "code" in context && typeof context.code === "string" ? context.code : undefined;
  const headerTrace = set.headers[TRACE_ID_HEADER];
  const traceId = typeof headerTrace === "string" ? headerTrace : undefined;

  if (code === "NOT_FOUND") {
    set.status = HTTP_STATUS_NOT_FOUND;
    return { error: API_ERROR_NOT_FOUND, code, traceId };
  }

  const isValidation =
    code === "VALIDATION" ||
    (typeof error === "object" &&
      error !== null &&
      "constructor" in error &&
      error.constructor.name === "ValidationError");

  if (isValidation && typeof error === "object" && error !== null) {
    const fields = collectValidationFields(error);
    set.status = HTTP_STATUS_BAD_REQUEST;
    return {
      error: API_ERROR_VALIDATION_FAILED,
      code: "VALIDATION",
      fields: fields ? fields.map((f) => f.path) : undefined,
      traceId,
    };
  }

  if (isValidation) {
    set.status = HTTP_STATUS_BAD_REQUEST;
    return { error: API_ERROR_VALIDATION_FAILED, code: "VALIDATION", traceId };
  }

  logger.error(
    `[${code}] traceId=${traceId}`,
    error instanceof Error ? error.message : String(error),
    toErrorMessage(error),
  _unused?: never,
  );
  set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
  return { error: API_ERROR_INTERNAL_SERVER, code, traceId };
});
