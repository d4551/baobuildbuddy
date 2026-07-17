import { HTTP_STATUS_CONFLICT, HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_NOT_FOUND, HTTP_STATUS_UNPROCESSABLE_ENTITY } from "@bao/shared/constants/http";
import type { ErrorEnvelope, RpaRunErrorCode } from "@bao/shared/schemas/error-envelope.schema";
import type { JsonObject } from "@bao/shared/utils/json";
export type AutomationRouteErrorResult = {
    status: typeof HTTP_STATUS_CONFLICT | typeof HTTP_STATUS_INTERNAL_SERVER_ERROR | typeof HTTP_STATUS_NOT_FOUND | typeof HTTP_STATUS_UNPROCESSABLE_ENTITY;
    body: {
        error: ErrorEnvelope;
    };
};
/**
 * Builds an error envelope for automation route responses.
 */
export declare function toRouteError(code: RpaRunErrorCode, message: string, details?: JsonObject): {
    error: ErrorEnvelope;
};
/**
 * Maps automation service errors to HTTP status and error envelope.
 * Single source of truth for automation route error handling.
 */
export declare function mapAutomationRouteError(error: unknown): AutomationRouteErrorResult;
