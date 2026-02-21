import { API_ENDPOINT_PREFIX } from "@bao/shared";

const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i;
const ABSOLUTE_WS_URL_PATTERN = /^wss?:\/\//i;

/**
 * Resolves runtime API base from public config and current request URL.
 *
 * @param configuredBase Runtime-configured API base.
 * @param requestUrl Current request URL.
 * @returns Absolute, normalized base URL without trailing slash.
 */
export function resolveApiBase(configuredBase: string, requestUrl: URL): string {
  const baseUrl = ABSOLUTE_HTTP_URL_PATTERN.test(configuredBase)
    ? configuredBase
    : new URL(configuredBase, requestUrl).toString();
  return baseUrl.replace(/\/$/, "");
}

/**
 * Resolves an API endpoint URL against the configured runtime API base.
 *
 * When the base already ends in `/api`, endpoint paths that include `/api` are de-duplicated.
 *
 * @param configuredBase Runtime-configured API base.
 * @param requestUrl Current request URL.
 * @param endpointPath Canonical endpoint path.
 * @returns Absolute endpoint URL.
 */
export function resolveApiEndpoint(
  configuredBase: string,
  requestUrl: URL,
  endpointPath: string,
): string {
  const resolvedBase = resolveApiBase(configuredBase, requestUrl);
  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  const resolvedBasePath = new URL(resolvedBase).pathname.replace(/\/$/, "");
  const baseIncludesApiPrefix =
    resolvedBasePath === API_ENDPOINT_PREFIX || resolvedBasePath.endsWith(API_ENDPOINT_PREFIX);
  const targetPath =
    baseIncludesApiPrefix && normalizedPath.startsWith(`${API_ENDPOINT_PREFIX}/`)
      ? normalizedPath.slice(API_ENDPOINT_PREFIX.length)
      : normalizedPath;
  return `${resolvedBase}${targetPath}`;
}

/**
 * Resolves a WebSocket endpoint URL from runtime config and request context.
 *
 * @param configuredBase Runtime-configured WebSocket or API base.
 * @param requestUrl Current request URL.
 * @param endpointPath Canonical WebSocket endpoint path.
 * @returns Absolute WebSocket URL.
 */
export function resolveWebSocketEndpoint(
  configuredBase: string,
  requestUrl: URL,
  endpointPath: string,
): string {
  const resolvedBase = resolveApiBase(configuredBase, requestUrl);
  const normalizedBase = resolvedBase.endsWith("/") ? resolvedBase.slice(0, -1) : resolvedBase;
  const wsBase = ABSOLUTE_WS_URL_PATTERN.test(normalizedBase)
    ? normalizedBase
    : requestUrl.protocol === "https:"
      ? normalizedBase.replace(/^https:/i, "wss:").replace(/^http:/i, "wss:")
      : normalizedBase.replace(/^https:/i, "ws:").replace(/^http:/i, "ws:");
  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  return `${wsBase}${normalizedPath}`;
}
