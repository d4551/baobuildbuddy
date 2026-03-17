import {
  DECIMAL_RADIX,
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
  AUTOMATION_MAX_CUSTOM_ANSWER_COUNT,
  AUTOMATION_MAX_CUSTOM_ANSWER_KEY_LENGTH,
  AUTOMATION_MAX_CUSTOM_ANSWER_VALUE_LENGTH,
  AUTOMATION_MAX_JOB_URL_LENGTH,
} from "@bao/shared";
import { DEFAULT_HOST, LOOPBACK_HOST_IPV4 } from "@bao/shared";
import { config } from "../../config/env";

/** Re-export shared limits for consumers that import from this module. */
export const MAX_JOB_URL_LENGTH = AUTOMATION_MAX_JOB_URL_LENGTH;
export const MAX_CUSTOM_ANSWER_KEY_LENGTH = AUTOMATION_MAX_CUSTOM_ANSWER_KEY_LENGTH;
export const MAX_CUSTOM_ANSWER_VALUE_LENGTH = AUTOMATION_MAX_CUSTOM_ANSWER_VALUE_LENGTH;
export const MAX_CUSTOM_ANSWER_COUNT = AUTOMATION_MAX_CUSTOM_ANSWER_COUNT;

const DISALLOWED_IPV4_PREFIXES = [
  [127, 0],
  [10, 0],
  [169, 254],
  [192, 168],
];

const IP_SEGMENT_REGEX = /^\d+$/;
const IPV6_SEGMENT_REGEX = /^[0-9a-f:.]+$/i;

const DISALLOWED_HOST_PATTERNS = [
  /^localhost$/i,
  /^localhost\.localdomain$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/i,
  /^fc[0-9a-f]+/i,
  /^fd[0-9a-f]+/i,
  /^fe80/i,
  /\.localhost$/i,
  /\.internal$/i,
];

const DISALLOWED_IPV6_PREFIX_PATTERN = /^(fc|fd|fe80)/i;

const allowAutomationPrivateHosts = (): boolean => {
  return config.allowAutomationPrivateHosts;
};

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

function isDisallowedAutomationHost(hostname: string): boolean {
  if (!hostname) {
    return true;
  }

  if (allowAutomationPrivateHosts()) {
    return false;
  }

  if (hostname === LOOPBACK_HOST_IPV4 || hostname === DEFAULT_HOST) {
    return true;
  }

  if (DISALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return true;
  }

  if (isIpv4Address(hostname)) {
    return isDisallowedIpv4(hostname);
  }

  if (isIpv6Address(hostname)) {
    return isDisallowedIpv6(hostname);
  }

  return false;
}

function isDisallowedIpv4(hostname: string): boolean {
  const segments = hostname.split(".").map((segment) => Number.parseInt(segment, DECIMAL_RADIX));
  const [first, second] = segments;
  if (Number.isNaN(first) || Number.isNaN(second)) {
    return false;
  }

  return DISALLOWED_IPV4_PREFIXES.some(
    ([disallowedFirst, disallowedSecond]) =>
      first === disallowedFirst && (disallowedSecond === 0 ? true : second === disallowedSecond),
  );
}

function isIpv4Address(hostname: string): boolean {
  const segments = hostname.split(".");
  if (segments.length !== 4) {
    return false;
  }

  for (const segment of segments) {
    if (!IP_SEGMENT_REGEX.test(segment)) {
      return false;
    }

    const parsed = Number.parseInt(segment, DECIMAL_RADIX);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 255) {
      return false;
    }
  }

  return true;
}

function isIpv6Address(hostname: string): boolean {
  return hostname.includes(":") && IPV6_SEGMENT_REGEX.test(hostname);
}

function isDisallowedIpv6(hostname: string): boolean {
  return hostname === "::1" || DISALLOWED_IPV6_PREFIX_PATTERN.test(hostname);
}
