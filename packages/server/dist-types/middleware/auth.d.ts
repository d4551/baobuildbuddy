import { HTTP_STATUS_UNAUTHORIZED } from "@bao/shared/constants/http";
import { Elysia } from "elysia";
type AuthFailure = {
    error: string;
    status: typeof HTTP_STATUS_UNAUTHORIZED;
};
/**
 * Validates a bearer API key against the persisted SHA-256 hash.
 *
 * The API key is hashed at creation and only the hash is stored in the
 * database. Verification re-hashes the provided bearer token and
 * compares it against the stored hash using `timingSafeEqual`.
 *
 * Keys are checked for revocation and expiry before hash comparison.
 */
export declare function authenticateApiKey(request: Request): Promise<AuthFailure | null>;
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
