/**
 * Resolves a client identifier for rate limiting from request headers.
 * Checks x-forwarded-for, cf-connecting-ip, x-real-ip; falls back to request host.
 */
export const resolveRateLimitClientKey = (request: Request): string => {
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
};
