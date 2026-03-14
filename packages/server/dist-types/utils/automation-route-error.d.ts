import type { ErrorEnvelope, JsonObject } from "@bao/shared";
import { type RpaRunErrorCode } from "@bao/shared";
export type AutomationRouteErrorResult = {
    status: number;
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
