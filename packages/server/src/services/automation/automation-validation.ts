import {
  API_ERROR_CUSTOM_ANSWERS_KEY_EXCEEDS,
  API_ERROR_CUSTOM_ANSWERS_KEYS,
  API_ERROR_CUSTOM_ANSWERS_MAX_COUNT,
  API_ERROR_CUSTOM_ANSWERS_OBJECT,
  API_ERROR_CUSTOM_ANSWERS_VALUE_EXCEEDS,
  API_ERROR_CUSTOM_ANSWERS_VALUE_MUST_BE_STRING,
  API_ERROR_JOB_URL_ABSOLUTE,
  API_ERROR_JOB_URL_DISALLOWED_HOST,
  API_ERROR_JOB_URL_EXCEEDS_LENGTH,
  API_ERROR_JOB_URL_HTTP_ONLY,
  API_ERROR_JOB_URL_NO_CREDENTIALS,
  API_ERROR_JOB_URL_REQUIRED,
} from "@bao/shared/constants/api-errors";
import {
  AUTOMATION_MAX_CUSTOM_ANSWER_COUNT,
  AUTOMATION_MAX_CUSTOM_ANSWER_KEY_LENGTH,
  AUTOMATION_MAX_CUSTOM_ANSWER_VALUE_LENGTH,
  AUTOMATION_MAX_JOB_URL_LENGTH,
} from "@bao/shared/constants/automation-limits";
import { DEFAULT_HOST, LOOPBACK_HOST_IPV4 } from "@bao/shared/constants/runtime";
import { isLoopbackOrPrivateHost } from "@bao/shared/utils/private-host";
import { config } from "../../config/env";

/** Re-export shared limits for consumers that import from this module. */
export const MAX_CUSTOM_ANSWER_KEY_LENGTH = AUTOMATION_MAX_CUSTOM_ANSWER_KEY_LENGTH;
export const MAX_CUSTOM_ANSWER_VALUE_LENGTH = AUTOMATION_MAX_CUSTOM_ANSWER_VALUE_LENGTH;
export const MAX_CUSTOM_ANSWER_COUNT = AUTOMATION_MAX_CUSTOM_ANSWER_COUNT;

/**
 * Bypass SSRF guards when the process explicitly opts into private hosts.
 * Used by local fixture / integration runs; default remains deny.
 */
const allowAutomationPrivateHostsOptIn = (): boolean => config.allowAutomationPrivateHosts;

/**
 * Validate and normalize an automation URL while blocking unsafe host targets.
 */
export function sanitizeAndValidateJobUrl(rawJobUrl: string): string {
  const jobUrl = rawJobUrl.trim();
  if (!jobUrl) {
    throw new Error(API_ERROR_JOB_URL_REQUIRED);
  }

  if (jobUrl.length > AUTOMATION_MAX_JOB_URL_LENGTH) {
    throw new Error(
      API_ERROR_JOB_URL_EXCEEDS_LENGTH.replace("__MAX__", String(AUTOMATION_MAX_JOB_URL_LENGTH)),
    );
  }

  if (!URL.canParse(jobUrl)) {
    throw new Error(API_ERROR_JOB_URL_ABSOLUTE);
  }
  const parsedUrl = new URL(jobUrl);

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(API_ERROR_JOB_URL_HTTP_ONLY);
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error(API_ERROR_JOB_URL_NO_CREDENTIALS);
  }

  const host = parsedUrl.hostname.toLowerCase();
  if (isDisallowedAutomationHost(host)) {
    throw new Error(API_ERROR_JOB_URL_DISALLOWED_HOST);
  }

  return parsedUrl.toString();
}

/**
 * Normalize custom answers payload by enforcing strict typing and length limits.
 */
export function sanitizeCustomAnswers(
  customAnswers: Record<string, unknown> | undefined,
): Record<string, string> {
  if (!customAnswers) {
    return {};
  }

  if (typeof customAnswers !== "object" || Array.isArray(customAnswers)) {
    throw new Error(API_ERROR_CUSTOM_ANSWERS_OBJECT);
  }

  const entries = Object.entries(customAnswers);
  if (entries.length > MAX_CUSTOM_ANSWER_COUNT) {
    throw new Error(
      API_ERROR_CUSTOM_ANSWERS_MAX_COUNT.replace("__MAX__", String(MAX_CUSTOM_ANSWER_COUNT)),
    );
  }

  const normalized: Record<string, string> = {};
  for (const [rawKey, rawValue] of entries) {
    const key = rawKey.trim();
    if (!key) {
      throw new Error(API_ERROR_CUSTOM_ANSWERS_KEYS);
    }
    if (key.length > MAX_CUSTOM_ANSWER_KEY_LENGTH) {
      throw new Error(
        API_ERROR_CUSTOM_ANSWERS_KEY_EXCEEDS.replace(
          "__MAX__",
          String(MAX_CUSTOM_ANSWER_KEY_LENGTH),
        ),
      );
    }

    if (typeof rawValue !== "string") {
      throw new Error(API_ERROR_CUSTOM_ANSWERS_VALUE_MUST_BE_STRING.replace("__KEY__", key));
    }

    const value = rawValue.trim();
    if (value.length > MAX_CUSTOM_ANSWER_VALUE_LENGTH) {
      throw new Error(
        API_ERROR_CUSTOM_ANSWERS_VALUE_EXCEEDS.replace("__KEY__", key).replace(
          "__MAX__",
          String(MAX_CUSTOM_ANSWER_VALUE_LENGTH),
        ),
      );
    }

    normalized[key] = value;
  }

  return normalized;
}

/**
 * Pure host classification: true when the hostname is loopback, RFC 1918
 * private space, or link-local. Separated from the opt-in policy below so the
 * range boundaries are testable without mutating process environment.
 */
export function isPrivateOrLoopbackAutomationHost(hostname: string): boolean {
  if (hostname === LOOPBACK_HOST_IPV4 || hostname === DEFAULT_HOST) {
    return true;
  }

  return isLoopbackOrPrivateHost(hostname);
}

function isDisallowedAutomationHost(hostname: string): boolean {
  if (!hostname) {
    return true;
  }

  if (allowAutomationPrivateHostsOptIn()) {
    return false;
  }

  return isPrivateOrLoopbackAutomationHost(hostname);
}
