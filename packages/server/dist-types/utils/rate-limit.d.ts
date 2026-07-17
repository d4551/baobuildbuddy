export { resolveRateLimitClientKey } from "./request";
type CreateRateLimitOptions = {
    durationMs: number;
    max: number;
    name: string;
    generator?: (request: Request) => string;
};
/**
 * Builds an in-memory Elysia 2 rate-limit plugin keyed by client IP headers.
 */
export declare function createRateLimitPlugin(options: CreateRateLimitOptions): import("elysia/types").LocalHookReturn<"", "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, {
    200: {
        error: string;
        code: string;
    };
}>;
/**
 * Rate limit plugin for expensive AI/automation operations.
 */
export declare const automationRateLimit: import("elysia/types").LocalHookReturn<"", "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, {
    200: {
        error: string;
        code: string;
    };
}>;
/**
 * Rate limit plugin for skill analysis (AI) operations.
 */
export declare const skillAnalysisRateLimit: import("elysia/types").LocalHookReturn<"", "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, {
    200: {
        error: string;
        code: string;
    };
}>;
/**
 * Factory matching previous `elysia-rate-limit` call sites.
 */
export declare function rateLimit(options: {
    duration: number;
    max: number;
    generator?: (request: Request) => string;
    scoping?: string;
}): import("elysia/types").LocalHookReturn<"", "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, {
    200: {
        error: string;
        code: string;
    };
}>;
