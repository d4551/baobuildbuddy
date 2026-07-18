import { HTTP_STATUS_UNAUTHORIZED } from "@bao/shared/constants/http";
import { Elysia } from "elysia";
type AuthFailure = {
    error: string;
    status: typeof HTTP_STATUS_UNAUTHORIZED;
};
/**
 * Validates Bearer API key against the persisted profile key.
 *
 * Default deny: missing/empty/mismatched key and missing configured
 * profile key all return unauthorized. Returns `null` only when the
 * request is authenticated or auth is explicitly disabled.
 *
 * @param request Incoming Elysia request (HTTP or WebSocket upgrade).
 * @returns Unauthorized envelope or null on success.
 */
export declare function authenticateApiKey(request: Request): Promise<AuthFailure | null>;
/**
 * Elysia plugin that validates Bearer API key for protected HTTP routes.
 * `.as("global")` lifts the hook so sibling route plugins registered after
 * this guard inherit default-deny auth. Routes mounted before the guard
 * (auth bootstrap) remain public. Skipped only when auth is explicitly
 * disabled via config.
 */
export declare const authGuard: Elysia<"", "local", {
    decorator: {};
    store: {};
    derive: {};
}, {
    typebox: {};
    error: [];
}, {
    schema: {};
    schemas: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {
        401: {
            readonly error: string;
        };
    };
}, {}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral>;
export {};
