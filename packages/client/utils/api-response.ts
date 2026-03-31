import { isRecord } from "@bao/shared/utils/type-guards";

/**
 * Unwraps canonical API envelopes while preserving raw array/object payloads.
 */
export function unwrapApiResponsePayload(response: unknown): unknown {
  if (isRecord(response) && "data" in response) {
    return response.data;
  }

  return response;
}

/**
 * Returns whether an API response uses the repo-standard error envelope.
 */
export function hasApiResponseError(response: unknown): boolean {
  return isRecord(response) && "error" in response && Boolean(response.error);
}

/**
 * Requires a valid API payload and throws with the supplied fallback message when invalid.
 */
export function requireApiResponsePayload(response: unknown, fallbackMessage: string): unknown {
  if (!(isRecord(response) || Array.isArray(response))) {
    throw new Error(fallbackMessage);
  }

  if (hasApiResponseError(response)) {
    throw new Error(fallbackMessage);
  }

  return unwrapApiResponsePayload(response);
}
