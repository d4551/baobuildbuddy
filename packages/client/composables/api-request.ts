import { $fetch } from "ofetch";
import { useRequestURL, useRuntimeConfig } from "#imports";
import { getStoredApiKey } from "~/plugins/eden";
import { resolveApiEndpoint } from "~/utils/endpoints";

const CONTENT_DISPOSITION_ENCODED_FILENAME_PATTERN = /filename\*=UTF-8''([^;]+)/i;
const CONTENT_DISPOSITION_QUOTED_FILENAME_PATTERN = /filename="([^"]+)"/i;
const CONTENT_DISPOSITION_PLAIN_FILENAME_PATTERN = /filename=([^;]+)/i;

export interface ClientApiRequestRuntime {
  apiBase: string;
  requestUrl: URL;
}

interface ClientApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: BodyInit | object | null;
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

export const buildClientApiHeaders = (
  headers: Record<string, string> = {},
): Record<string, string> => ({
  ...buildAuthorizationHeaders(),
  ...headers,
});

function isBodyInitValue(value: BodyInit | object | null | undefined): value is BodyInit {
  return (
    typeof value === "string" ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    value instanceof ReadableStream
  );
}

function createRequestBody(body: BodyInit | object | null | undefined): BodyInit | undefined {
  if (body == null) {
    return;
  }

  if (isBodyInitValue(body)) {
    return body;
  }

  return JSON.stringify(body);
}

function resolveDownloadFilename(
  contentDisposition: string | null,
  fallbackFilename: string,
): string {
  if (!contentDisposition) {
    return fallbackFilename;
  }

  const encodedMatch = CONTENT_DISPOSITION_ENCODED_FILENAME_PATTERN.exec(contentDisposition);
  if (encodedMatch?.[1]) {
    return encodedMatch[1];
  }

  const quotedMatch = CONTENT_DISPOSITION_QUOTED_FILENAME_PATTERN.exec(contentDisposition);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const plainMatch = CONTENT_DISPOSITION_PLAIN_FILENAME_PATTERN.exec(contentDisposition);
  return plainMatch?.[1]?.trim() || fallbackFilename;
}

function triggerFileDownload(blob: Blob, filename: string): void {
  if (!import.meta.client) {
    return;
  }
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadApiFile(
  runtime: ClientApiRequestRuntime,
  endpoint: string,
  options: ClientApiRequestOptions = {},
  fallbackFilename: string,
): Promise<void> {
  const body = createRequestBody(options.body);
  const headers = buildClientApiHeaders(options.headers);
  const shouldSetJsonContentType =
    body !== undefined && !isBodyInitValue(options.body) && !("Content-Type" in headers);

  const response = await fetch(resolveApiEndpoint(runtime.apiBase, runtime.requestUrl, endpoint), {
    method: options.method ?? "GET",
    body,
    headers: shouldSetJsonContentType
      ? {
          ...headers,
          "Content-Type": "application/json",
        }
      : headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const blob = await response.blob();
  triggerFileDownload(
    blob,
    resolveDownloadFilename(response.headers.get("content-disposition"), fallbackFilename),
  );
}

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
    headers: buildClientApiHeaders(options.headers),
  });
}
