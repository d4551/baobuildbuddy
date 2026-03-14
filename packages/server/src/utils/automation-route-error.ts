import type { ErrorEnvelope, JsonObject } from "@bao/shared";
import {
  API_ERROR_AUTOMATION_PROCESS_FAILED,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
  type RpaRunErrorCode,
} from "@bao/shared";
import {
  AutomationConcurrencyLimitError,
  AutomationDependencyMissingError,
  AutomationRunNotFoundError,
  AutomationValidationError,
} from "../services/automation/application-automation-service";

export type AutomationRouteErrorResult = {
  status: number;
  body: { error: ErrorEnvelope };
};

/**
 * Builds an error envelope for automation route responses.
 */
export function toRouteError(
  code: RpaRunErrorCode,
  message: string,
  details?: JsonObject,
): { error: ErrorEnvelope } {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

/**
 * Maps automation service errors to HTTP status and error envelope.
 * Single source of truth for automation route error handling.
 */
export function mapAutomationRouteError(error: unknown): AutomationRouteErrorResult {
  if (error instanceof AutomationValidationError) {
    return {
      status: HTTP_STATUS_UNPROCESSABLE_ENTITY,
      body: toRouteError("OUTPUT_VALIDATION_ERROR", error.message),
    };
  }
  if (
    error instanceof AutomationDependencyMissingError ||
    error instanceof AutomationRunNotFoundError
  ) {
    return {
      status: HTTP_STATUS_NOT_FOUND,
      body: toRouteError("OUTPUT_VALIDATION_ERROR", error.message),
    };
  }
  if (error instanceof AutomationConcurrencyLimitError) {
    return {
      status: HTTP_STATUS_CONFLICT,
      body: toRouteError("NETWORK_ERROR", error.message, {
        runningRuns: error.runningRuns,
        maxConcurrentRuns: error.maxConcurrentRuns,
      }),
    };
  }

  return {
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    body: toRouteError(
      "UNKNOWN_ERROR",
      error instanceof Error ? error.message : API_ERROR_AUTOMATION_PROCESS_FAILED,
    ),
  };
}
