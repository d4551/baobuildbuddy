import { API_ERROR_RATE_LIMIT_EXCEEDED } from "@bao/shared/constants/api-errors";
import { HTTP_STATUS_TOO_MANY_REQUESTS } from "@bao/shared/constants/http";
import { MS_PER_SECOND } from "@bao/shared/constants/time";
import { Elysia } from "elysia";
import {
  RATE_LIMIT_DURATION_MS,
  RATE_LIMIT_MAX_AUTOMATION,
  RATE_LIMIT_MAX_SKILL_ANALYSIS,
} from "../config/rate-limit";
import { resolveRateLimitClientKey } from "./request";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type CreateRateLimitOptions = {
  durationMs: number;
  max: number;
  name: string;
  generator?: (request: Request) => string;
};

/**
 * Builds an in-memory Elysia 2 rate-limit plugin keyed by client IP headers.
 */
export function createRateLimitPlugin(options: CreateRateLimitOptions) {
  const buckets = new Map<string, RateLimitBucket>();
  const resolveKey = options.generator ?? resolveRateLimitClientKey;

  return new Elysia({ name: options.name }).beforeHandle(({ request, set }) => {
    const now = Date.now();
    const key = resolveKey(request);
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.durationMs });
      set.headers["x-ratelimit-limit"] = String(options.max);
      set.headers["x-ratelimit-remaining"] = String(options.max - 1);
      return;
    }

    existing.count += 1;
    buckets.set(key, existing);

    const remaining = Math.max(0, options.max - existing.count);
    set.headers["x-ratelimit-limit"] = String(options.max);
    set.headers["x-ratelimit-remaining"] = String(remaining);
    set.headers["x-ratelimit-reset"] = String(Math.ceil(existing.resetAt / MS_PER_SECOND));

    if (existing.count > options.max) {
      set.status = HTTP_STATUS_TOO_MANY_REQUESTS;
      return {
        error: API_ERROR_RATE_LIMIT_EXCEEDED,
        code: "RATE_LIMIT_EXCEEDED",
      };
    }
  });
}

/**
 * Rate limit plugin for expensive AI/automation operations.
 */
export const automationRateLimit = createRateLimitPlugin({
  name: "rate-limit-automation",
  durationMs: RATE_LIMIT_DURATION_MS,
  max: RATE_LIMIT_MAX_AUTOMATION,
});

/**
 * Rate limit plugin for skill analysis (AI) operations.
 */
export const skillAnalysisRateLimit = createRateLimitPlugin({
  name: "rate-limit-skill-analysis",
  durationMs: RATE_LIMIT_DURATION_MS,
  max: RATE_LIMIT_MAX_SKILL_ANALYSIS,
});

/**
 * Factory matching previous `elysia-rate-limit` call sites.
 */
export function rateLimit(options: {
  duration: number;
  max: number;
  generator?: (request: Request) => string;
  scoping?: string;
}) {
  return createRateLimitPlugin({
    name: `rate-limit-${options.max}-${options.duration}`,
    durationMs: options.duration,
    max: options.max,
    generator: options.generator,
  });
}
