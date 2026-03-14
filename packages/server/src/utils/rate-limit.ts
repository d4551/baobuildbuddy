import { rateLimit } from "elysia-rate-limit";
import {
  RATE_LIMIT_DURATION_MS,
  RATE_LIMIT_MAX_AUTOMATION,
  RATE_LIMIT_MAX_SKILL_ANALYSIS,
} from "../config/rate-limit";

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
  duration: RATE_LIMIT_DURATION_MS,
  max: RATE_LIMIT_MAX_AUTOMATION,
  generator: (request) => resolveRateLimitClientKey(request),
});

/**
 * Rate limit plugin for skill analysis (AI) operations.
 */
export const skillAnalysisRateLimit = rateLimit({
  scoping: "scoped",
  duration: RATE_LIMIT_DURATION_MS,
  max: RATE_LIMIT_MAX_SKILL_ANALYSIS,
  generator: (request) => resolveRateLimitClientKey(request),
});
