import { HTTP_STATUS_UNAUTHORIZED } from "@bao/shared/constants/http";
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
export declare const authGuard: import("elysia/types").LocalHookReturn<"", "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, {
    401: {
        readonly error: string;
    };
}>;
export {};
