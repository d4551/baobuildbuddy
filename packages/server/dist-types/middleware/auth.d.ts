import { HTTP_STATUS_UNAUTHORIZED } from "@bao/shared/constants/http";
import { Elysia } from "elysia";
type AuthFailure = {
    error: string;
    status: typeof HTTP_STATUS_UNAUTHORIZED;
};
/**
 * Validates Bearer API key against the persisted profile key.
 *
 * Returns a failure envelope when validation fails; returns `null`
 * when the request is authenticated, auth is disabled, or no profile
 * key has been configured yet.
 *
 * @param request Incoming Elysia request (HTTP or WebSocket upgrade).
 * @returns Unauthorized envelope or null on success.
 */
export declare function authenticateApiKey(request: Request): Promise<AuthFailure | null>;
/**
 * Elysia plugin that validates Bearer API key for protected HTTP routes.
 * Skipped only when auth is explicitly disabled via the config module.
 */
export declare const authGuard: Elysia<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {
        401: {
            readonly error: string;
        };
    };
}>;
export {};
