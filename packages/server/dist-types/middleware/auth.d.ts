import { Elysia } from "elysia";
/**
 * Elysia plugin that validates Bearer API key for protected routes.
 * Skipped when config.disableAuth is true (local dev).
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
            readonly error: "Missing or invalid Authorization header";
        } | {
            readonly error: "Empty API key";
        } | {
            readonly error: "Invalid API key";
        };
    };
}>;
