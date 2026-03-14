/**
 * Resolves a client identifier for rate limiting from request headers.
 * Checks x-forwarded-for, cf-connecting-ip, x-real-ip; falls back to request host.
 */
export declare const resolveRateLimitClientKey: (request: Request) => string;
