import { API_ENDPOINTS } from "../constants/endpoints";
import { TRACE_ID_HEADER } from "../constants/runtime";
import { healthResponseSchema } from "../schemas/health.schema";
import { parseJson } from "./json";

/**
 * Identity probe for the API base the dev stack hands to the client.
 *
 * The dev stack tells Nuxt `NUXT_PUBLIC_API_BASE=http://127.0.0.1:<serverPort>`
 * and assumes that address is served by the server it just spawned. That
 * assumption is not safe: a foreign process bound to the IPv4 loopback wins the
 * address even when our own server starts cleanly, because our server binds the
 * IPv6 wildcard and therefore never raises `EADDRINUSE`. When that happens the
 * whole client talks to somebody else's backend, and every symptom reads like an
 * app bug (dead API calls, 500 preflights) rather than a port clash.
 *
 * So the probe interrogates the advertised base — not the bind address — and
 * requires two independent proofs of ownership before the stack is declared up:
 * the `x-trace-id` response header this app stamps on every response, and the
 * health payload contract. A foreign responder has to reproduce both to pass.
 *
 * This lives in shared rather than beside the dev-stack script so the server can
 * assert its own health response still satisfies it (see
 * `packages/server/src/routes/health-contract.test.ts`) without a cross-package
 * relative import dragging shared source into the server's compilation root.
 */

/** Response facts the probe classifies. */
export type BackendProbeResponse = {
  /** HTTP status, or `BACKEND_PROBE_NO_RESPONSE_STATUS` when no response arrived. */
  status: number;
  /** Value of the trace-id response header, or null when absent. */
  traceIdHeader: string | null;
  /** Raw response body text. */
  bodyText: string;
};

/** Outcome of classifying one probe response. */
export type BackendProbeVerdict =
  | { kind: "ours" }
  | { kind: "foreign"; reason: string }
  | { kind: "unreachable"; reason: string };

/** Health endpoint path appended to the advertised API base. */
export const BACKEND_PROBE_PATH = API_ENDPOINTS.health;

/** Sentinel status meaning the probe request never produced a response. */
export const BACKEND_PROBE_NO_RESPONSE_STATUS = 0;

const TRAILING_SLASH_PATTERN = /\/$/u;
const WHITESPACE_RUN_PATTERN = /\s+/gu;
const BODY_EXCERPT_LENGTH = 120;

/**
 * Builds the probe URL for an advertised API base.
 *
 * @param apiBase Advertised API base URL, with or without a trailing slash.
 * @returns Absolute health-probe URL.
 */
export const toBackendProbeUrl = (apiBase: string): string =>
  `${apiBase.replace(TRAILING_SLASH_PATTERN, "")}${BACKEND_PROBE_PATH}`;

/**
 * Collapses a response body into a single-line diagnostic excerpt.
 */
const toBodyExcerpt = (bodyText: string): string => {
  const collapsed = bodyText.trim().replaceAll(WHITESPACE_RUN_PATTERN, " ");
  return collapsed.length > BODY_EXCERPT_LENGTH
    ? `${collapsed.slice(0, BODY_EXCERPT_LENGTH)}…`
    : collapsed;
};

/**
 * Classifies a probe response as our backend, a foreign responder, or unreachable.
 *
 * @param response Facts gathered from the probe request.
 * @returns Verdict describing what answered on the advertised API base.
 */
export const classifyBackendProbe = (response: BackendProbeResponse): BackendProbeVerdict => {
  if (response.status === BACKEND_PROBE_NO_RESPONSE_STATUS) {
    return { kind: "unreachable", reason: "no response from the advertised API base" };
  }

  const excerpt = toBodyExcerpt(response.bodyText);
  if (response.traceIdHeader === null || response.traceIdHeader.length === 0) {
    return {
      kind: "foreign",
      reason: `response carries no ${TRACE_ID_HEADER} header (status ${response.status}, body: ${excerpt})`,
    };
  }

  if (parseJson(response.bodyText, healthResponseSchema) === null) {
    return {
      kind: "foreign",
      reason: `response does not satisfy the health contract (status ${response.status}, body: ${excerpt})`,
    };
  }

  return { kind: "ours" };
};

/**
 * Builds the operator-facing message for a foreign responder on the API base.
 *
 * @param apiBase Advertised API base handed to the client.
 * @param reason Why the responder was classified as foreign.
 * @returns Multi-line diagnostic naming the clash and how to resolve it.
 */
export const describeForeignBackend = (apiBase: string, reason: string): string =>
  [
    `another process is answering on ${apiBase}: ${reason}`,
    "the client would talk to that backend instead of this one",
    "free the port or start the stack elsewhere: bun run dev -- --server-port <port> --client-port <port>",
  ].join("\n[bao/dev-stack] ");
