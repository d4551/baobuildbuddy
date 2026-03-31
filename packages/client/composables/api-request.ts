import { useRequestURL, useRuntimeConfig } from "#imports";
import { $fetch } from "ofetch";
import { getStoredApiKey } from "~/plugins/eden";
import { resolveApiEndpoint } from "~/utils/endpoints";

export interface ClientApiRequestRuntime {
  apiBase: string;
  requestUrl: URL;
}

interface ClientApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: BodyInit | Record<string, unknown> | null;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

/**
 * Resolves the canonical client request runtime for direct API endpoint calls.
 */
export function useClientApiRequestRuntime(): ClientApiRequestRuntime {
  return {
    apiBase: String(useRuntimeConfig().public.apiBase || "/"),
    requestUrl: useRequestURL(),
  };
}

const buildAuthorizationHeaders = (): Record<string, string> => {
  const key = getStoredApiKey();
  return key ? { Authorization: `Bearer ${key}` } : {};
};

/**
 * Executes a typed client API request against a canonical shared endpoint.
 */
export function requestApi<TResponse>(
  runtime: ClientApiRequestRuntime,
  endpoint: string,
  options: ClientApiRequestOptions = {},
): Promise<TResponse> {
  return $fetch<TResponse>(resolveApiEndpoint(runtime.apiBase, runtime.requestUrl, endpoint), {
    ...options,
    headers: {
      ...buildAuthorizationHeaders(),
      ...(options.headers ?? {}),
    },
  });
}
