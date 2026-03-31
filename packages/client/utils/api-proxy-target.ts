import { API_ENDPOINT_PREFIX } from "@bao/shared/constants/endpoints";

const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//iu;
const TRAILING_SLASH_PATTERN = /\/$/u;
const PROXY_WILDCARD_SUFFIX = "/**";

const trimTrailingSlash = (value: string): string => value.replace(TRAILING_SLASH_PATTERN, "");

export function normalizeApiProxyTarget(target: string): string | undefined {
  const trimmedTarget = target.trim();
  if (!(ABSOLUTE_HTTP_URL_PATTERN.test(trimmedTarget) && URL.canParse(trimmedTarget))) {
    return;
  }

  const resolvedTarget = new URL(trimmedTarget);
  const normalizedPath = trimTrailingSlash(resolvedTarget.pathname);
  const pathnameWithApiPrefix =
    normalizedPath.length === 0 || normalizedPath === "/"
      ? API_ENDPOINT_PREFIX
      : normalizedPath.endsWith(API_ENDPOINT_PREFIX)
        ? normalizedPath
        : `${normalizedPath}${API_ENDPOINT_PREFIX}`;

  resolvedTarget.pathname = pathnameWithApiPrefix;
  resolvedTarget.search = "";
  resolvedTarget.hash = "";
  return trimTrailingSlash(resolvedTarget.toString());
}

export function buildApiProxyWildcardTarget(target: string): string | undefined {
  const normalizedTarget = normalizeApiProxyTarget(target);
  return normalizedTarget ? `${normalizedTarget}${PROXY_WILDCARD_SUFFIX}` : undefined;
}
