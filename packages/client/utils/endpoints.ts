import { API_ENDPOINT_PREFIX } from "@bao/shared/constants/endpoints";

const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i;
const ABSOLUTE_WS_URL_PATTERN = /^wss?:\/\//i;
const TRAILING_SLASH_PATTERN = /\/$/u;
const HTTPS_PROTOCOL_PATTERN = /^https:/i;
const HTTP_PROTOCOL_PATTERN = /^http:/i;

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
  return baseUrl.replace(TRAILING_SLASH_PATTERN, "");
}

/**
 * Resolves the route client base used by Eden Treaty.
 *
 * Treaty route helpers already include the canonical API endpoint prefix, so
 * the base must stop at the parent path or requests will drift to a duplicated
 * API segment.
 *
 * @param configuredBase Runtime-configured API base.
 * @param requestUrl Current request URL.
 * @returns Absolute route client base without a trailing slash.
 */
export function resolveApiRouteBase(configuredBase: string, requestUrl: URL): string {
  const resolvedBase = resolveApiBase(configuredBase, requestUrl);
  const parsedUrl = new URL(resolvedBase);
  const normalizedPath = parsedUrl.pathname.replace(TRAILING_SLASH_PATTERN, "");
  let routeBasePath: string;
  if (normalizedPath === API_ENDPOINT_PREFIX) {
    routeBasePath = "/";
  } else if (normalizedPath.endsWith(API_ENDPOINT_PREFIX)) {
    routeBasePath = normalizedPath.slice(0, -API_ENDPOINT_PREFIX.length) || "/";
  } else {
    routeBasePath = parsedUrl.pathname;
  }

  parsedUrl.pathname = routeBasePath;
  return parsedUrl.toString().replace(TRAILING_SLASH_PATTERN, "");
}

/**
 * Resolves an API endpoint URL against the configured runtime API base.
 *
 * When the base already ends in the API prefix, matching endpoint paths are de-duplicated.
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
  const resolvedBasePath = new URL(resolvedBase).pathname.replace(TRAILING_SLASH_PATTERN, "");
  const baseIncludesApiPrefix =
    resolvedBasePath === API_ENDPOINT_PREFIX || resolvedBasePath.endsWith(API_ENDPOINT_PREFIX);
  const targetPath =
    baseIncludesApiPrefix && normalizedPath.startsWith(`${API_ENDPOINT_PREFIX}/`)
      ? normalizedPath.slice(API_ENDPOINT_PREFIX.length)
      : normalizedPath;
  return `${resolvedBase}${targetPath}`;
}

/**
 * Prefer same-origin `/api/...` paths in the browser so Nuxt's API proxy owns the
 * request. Absolute cross-origin API hosts break blob downloads and CDP capture.
 */
export function resolveBrowserApiFetchUrl(absoluteEndpointUrl: string, pageUrl: URL): string {
  try {
    const endpoint = new URL(absoluteEndpointUrl, pageUrl);
    if (endpoint.pathname === API_ENDPOINT_PREFIX || endpoint.pathname.startsWith(`${API_ENDPOINT_PREFIX}/`)) {
      return `${endpoint.pathname}${endpoint.search}`;
    }
  } catch {
    /* keep absolute */
  }
  return absoluteEndpointUrl;
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
  let wsBase: string;
  if (ABSOLUTE_WS_URL_PATTERN.test(normalizedBase)) {
    wsBase = normalizedBase;
  } else if (requestUrl.protocol === "https:") {
    wsBase = normalizedBase
      .replace(HTTPS_PROTOCOL_PATTERN, "wss:")
      .replace(HTTP_PROTOCOL_PATTERN, "wss:");
  } else {
    wsBase = normalizedBase
      .replace(HTTPS_PROTOCOL_PATTERN, "ws:")
      .replace(HTTP_PROTOCOL_PATTERN, "ws:");
  }
  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  return `${wsBase}${normalizedPath}`;
}
