/**
 * Resolves a client identifier for rate limiting from request headers.
 */
export declare function resolveRateLimitClientKey(request: Request): string;
/**
 * Rate limit plugin for expensive AI/automation operations.
 * 30 requests per minute per client.
 */
export declare const automationRateLimit: (app: import("elysia").default) => import("elysia").default<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    error: {};
    typebox: import("@sinclair/typebox").TModule<{}, {}>;
}, {
    schema: {};
    macro: {};
    macroFn: {};
    parser: {};
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
}>;
/**
 * Rate limit plugin for skill analysis (AI) operations.
 * 20 requests per minute per client.
 */
export declare const skillAnalysisRateLimit: (app: import("elysia").default) => import("elysia").default<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    error: {};
    typebox: import("@sinclair/typebox").TModule<{}, {}>;
}, {
    schema: {};
    macro: {};
    macroFn: {};
    parser: {};
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
}>;
