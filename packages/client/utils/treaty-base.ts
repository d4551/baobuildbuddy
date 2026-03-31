import { API_ENDPOINT_PREFIX } from "@bao/shared/constants/endpoints";
import { resolveApiRouteBase } from "./endpoints";

const TRAILING_SLASHES_PATTERN = /\/+$/u;

function normalizeTreatyPath(pathname: string): string {
  const trimmedPath =
    pathname.length > 1 ? pathname.replace(TRAILING_SLASHES_PATTERN, "") : pathname;
  if (trimmedPath === API_ENDPOINT_PREFIX) {
    return "/";
  }

  return trimmedPath.endsWith(API_ENDPOINT_PREFIX)
    ? trimmedPath.slice(0, -API_ENDPOINT_PREFIX.length) || "/"
    : trimmedPath;
}

export function resolveTreatyBase(configuredBase: string, requestUrl: URL): string {
  const resolvedApiBase = resolveApiRouteBase(configuredBase, requestUrl);
  const treatyBase = new URL(resolvedApiBase);
  treatyBase.pathname = normalizeTreatyPath(treatyBase.pathname);

  const normalized = treatyBase.toString();
  return treatyBase.pathname === "/" && normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
}
