import { AUTH_KEY_PREFIX } from "../constants/auth";
import { SCHEMA_MAX_LENGTH_LONG } from "../constants/schema-limits";
import {
  type AutomationBrowserLaunchFailureDetails,
  type AutomationBrowserLaunchFailureMode,
  type AutomationBrowserLaunchStage,
  automationBrowserLaunchFailureDetailsSchema,
} from "../schemas/error-envelope.schema";
import type { JsonObject } from "./json";
import { CURSOR_SANDBOX_BROWSER_CACHE_MARKER } from "./playwright-browsers-path";

const REDACTED_SECRET = "[REDACTED]";
const REDACTED_HOME = "~";

/**
 * Secret/token shapes that must never leave the host in causeMessage/browsersPath.
 * Classification runs on the raw message; only outbound fields are scrubbed.
 */
const SECRET_LIKE_PATTERNS: readonly RegExp[] = [
  /\bBearer\s+\S+/giu,
  // Case-sensitive: prefix is lowercase `bao_`; ignore SCREAMING_SNAKE env names.
  new RegExp(`\\b${AUTH_KEY_PREFIX}[A-Za-z0-9_-]{8,}`, "gu"),
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{8,}/giu,
  /\b(?:hf_|ghp_|gho_|xox[baprs]-)[A-Za-z0-9_-]{8,}/giu,
  /(?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|authorization|setup[_-]?token)\s*[:=]\s*\S+/giu,
  /\b[A-Z][A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY|AUTH_SETUP_TOKEN|SETUP_TOKEN)\s*=\s*\S+/gu,
];

/** Absolute user-home prefixes (macOS / Linux / Windows) — never echo username dirs. */
const ABS_USER_HOME_PATTERNS: readonly RegExp[] = [
  /\/Users\/[^/\s"'`]+/gu,
  /\/home\/[^/\s"'`]+/gu,
  /(?:[A-Za-z]:)\\Users\\[^\\\s"'`]+/giu,
];

const truncateCauseMessage = (message: string): string => {
  const normalized = message.trim();
  if (normalized.length === 0) {
    return "Unknown browser launch failure";
  }
  if (normalized.length <= SCHEMA_MAX_LENGTH_LONG) {
    return normalized;
  }
  return normalized.slice(0, SCHEMA_MAX_LENGTH_LONG);
};

/**
 * Scrubs secrets/tokens and absolute user-home path prefixes from diagnostic text.
 */
export const sanitizeAutomationBrowserLaunchDiagnostic = (message: string): string => {
  let scrubbed = message;
  for (const pattern of SECRET_LIKE_PATTERNS) {
    pattern.lastIndex = 0;
    scrubbed = scrubbed.replace(pattern, REDACTED_SECRET);
  }
  for (const pattern of ABS_USER_HOME_PATTERNS) {
    pattern.lastIndex = 0;
    scrubbed = scrubbed.replace(pattern, REDACTED_HOME);
  }
  return truncateCauseMessage(scrubbed);
};

const resolveFailureMode = (
  causeMessage: string,
  stage: AutomationBrowserLaunchStage,
  browsersPath: string | undefined,
): AutomationBrowserLaunchFailureMode => {
  const haystack = causeMessage.toLowerCase();
  const pathHint = browsersPath?.toLowerCase() ?? "";

  if (
    pathHint.includes(CURSOR_SANDBOX_BROWSER_CACHE_MARKER) ||
    haystack.includes(CURSOR_SANDBOX_BROWSER_CACHE_MARKER)
  ) {
    return "BROWSER_PATH_POLLUTED";
  }

  if (
    haystack.includes("sigsegv") ||
    haystack.includes("sigabrt") ||
    haystack.includes("signal 11") ||
    haystack.includes("received signal") ||
    haystack.includes("target closed") ||
    haystack.includes("browser has been closed") ||
    haystack.includes("crash")
  ) {
    return "BROWSER_PROCESS_CRASHED";
  }

  if (
    haystack.includes("executable doesn't exist") ||
    haystack.includes("executable does not exist") ||
    haystack.includes("failed to find browser") ||
    haystack.includes("browser was not found") ||
    haystack.includes("enoent") ||
    (haystack.includes("browsertype.launch") && haystack.includes("executable"))
  ) {
    return "BROWSER_EXECUTABLE_MISSING";
  }

  if (stage === "context") {
    return "BROWSER_CONTEXT_FAILED";
  }
  if (stage === "page") {
    return "BROWSER_PAGE_FAILED";
  }
  return "BROWSER_LAUNCH_FAILED";
};

/**
 * Classifies a Playwright browser-session failure into a typed details payload.
 */
export const classifyAutomationBrowserLaunchFailure = (
  reason: Error,
  stage: AutomationBrowserLaunchStage,
  browsersPath?: string | null,
): AutomationBrowserLaunchFailureDetails => {
  const rawCauseMessage = truncateCauseMessage(reason.message);
  const rawPath =
    typeof browsersPath === "string" && browsersPath.trim().length > 0
      ? truncateCauseMessage(browsersPath)
      : undefined;
  const causeMessage = sanitizeAutomationBrowserLaunchDiagnostic(rawCauseMessage);
  const sanitizedPath = rawPath ? sanitizeAutomationBrowserLaunchDiagnostic(rawPath) : undefined;

  return automationBrowserLaunchFailureDetailsSchema.parse({
    failureMode: resolveFailureMode(rawCauseMessage, stage, rawPath),
    causeMessage,
    stage,
    ...(sanitizedPath ? { browsersPath: sanitizedPath } : {}),
  });
};

/**
 * Converts typed launch-failure details into a protocol-safe JSON object.
 */
export const automationBrowserLaunchFailureToDetails = (
  failure: AutomationBrowserLaunchFailureDetails,
): JsonObject => ({
  failureMode: failure.failureMode,
  causeMessage: failure.causeMessage,
  stage: failure.stage,
  ...(failure.browsersPath ? { browsersPath: failure.browsersPath } : {}),
});

export type ParseAutomationBrowserLaunchFailureDetailsResult =
  | { readonly ok: true; readonly details: AutomationBrowserLaunchFailureDetails }
  | { readonly ok: false };

/**
 * Stable human-readable message that keeps failureMode in the envelope message.
 */
export const formatAutomationBrowserLaunchFailureMessage = (
  failure: AutomationBrowserLaunchFailureDetails,
): string => `Unable to launch automation browser (${failure.failureMode}).`;
