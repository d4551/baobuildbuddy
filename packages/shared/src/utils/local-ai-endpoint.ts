import { LOOPBACK_HOST, LOOPBACK_HOST_IPV4, LOOPBACK_HOST_IPV6 } from "../constants/runtime";

export type LocalAiEndpointValidationResult =
  | { readonly ok: true; readonly endpoint: string }
  | {
      readonly ok: false;
      readonly code: "INVALID_URL" | "DISALLOWED_PROTOCOL" | "DISALLOWED_HOST" | "CREDENTIALS";
    };

const ALLOWED_LOCAL_AI_HOSTS = new Set<string>([
  LOOPBACK_HOST,
  LOOPBACK_HOST_IPV4,
  LOOPBACK_HOST_IPV6,
]);

/**
 * Validates a local-inference endpoint for server-side fetch.
 * Default-deny: only loopback hosts may be probed (SSRF fail-closed).
 */
export const validateLocalAiEndpoint = (rawEndpoint: string): LocalAiEndpointValidationResult => {
  const trimmed = rawEndpoint.trim();
  if (!trimmed || !URL.canParse(trimmed)) {
    return { ok: false, code: "INVALID_URL" };
  }

  const parsed = new URL(trimmed);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, code: "DISALLOWED_PROTOCOL" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, code: "CREDENTIALS" };
  }

  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_LOCAL_AI_HOSTS.has(host)) {
    return { ok: false, code: "DISALLOWED_HOST" };
  }

  return { ok: true, endpoint: parsed.toString() };
};
