import { rateLimit } from "elysia-rate-limit";

/**
 * Resolves a client identifier for rate limiting from request headers.
 */
export function resolveRateLimitClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.trim().length > 0) {
    const firstHop = forwardedFor.split(",")[0]?.trim();
    if (firstHop) return firstHop;
  }

  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp && cloudflareIp.trim().length > 0) {
    return cloudflareIp.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return new URL(request.url).host;
}

/**
 * Rate limit plugin for expensive AI/automation operations.
 * 30 requests per minute per client.
 */
export const automationRateLimit = rateLimit({
  scoping: "scoped",
  duration: 60_000,
  max: 30,
  generator: (request) => resolveRateLimitClientKey(request),
});

/**
 * Rate limit plugin for skill analysis (AI) operations.
 * 20 requests per minute per client.
 */
export const skillAnalysisRateLimit = rateLimit({
  scoping: "scoped",
  duration: 60_000,
  max: 20,
  generator: (request) => resolveRateLimitClientKey(request),
});
