import { isIP } from "node:net";

/**
 * Shared limits for job application automation request validation.
 */
export const MAX_JOB_URL_LENGTH = 2_048;
export const MAX_CUSTOM_ANSWER_KEY_LENGTH = 120;
export const MAX_CUSTOM_ANSWER_VALUE_LENGTH = 2_000;
export const MAX_CUSTOM_ANSWER_COUNT = 50;

const DISALLOWED_IPV4_PREFIXES = [
  [127, 0],
  [10, 0],
  [169, 254],
  [192, 168],
];

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

/**
 * Validate and normalize an automation URL while blocking unsafe host targets.
 */
export function sanitizeAndValidateJobUrl(rawJobUrl: string): string {
  const jobUrl = rawJobUrl.trim();
  if (!jobUrl) {
    throw new Error("jobUrl is required");
  }

  if (jobUrl.length > MAX_JOB_URL_LENGTH) {
    throw new Error(`jobUrl exceeds ${MAX_JOB_URL_LENGTH} characters`);
  }

  if (!URL.canParse(jobUrl)) {
    throw new Error("jobUrl must be an absolute URL");
  }
  const parsedUrl = new URL(jobUrl);

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Only http and https job URLs are allowed");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("jobUrl must not contain credentials");
  }

  const host = parsedUrl.hostname.toLowerCase();
  if (isDisallowedAutomationHost(host)) {
    throw new Error("jobUrl resolves to a disallowed host");
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
    throw new Error("customAnswers must be an object map");
  }

  const entries = Object.entries(customAnswers);
  if (entries.length > MAX_CUSTOM_ANSWER_COUNT) {
    throw new Error(`Maximum ${MAX_CUSTOM_ANSWER_COUNT} custom answers allowed`);
  }

  const normalized: Record<string, string> = {};
  for (const [rawKey, rawValue] of entries) {
    const key = rawKey.trim();
    if (!key) {
      throw new Error("customAnswers keys must not be empty");
    }
    if (key.length > MAX_CUSTOM_ANSWER_KEY_LENGTH) {
      throw new Error(`customAnswers key exceeds ${MAX_CUSTOM_ANSWER_KEY_LENGTH} characters`);
    }

    if (typeof rawValue !== "string") {
      throw new Error(`customAnswers[${key}] must be a string value`);
    }

    const value = rawValue.trim();
    if (value.length > MAX_CUSTOM_ANSWER_VALUE_LENGTH) {
      throw new Error(`customAnswers[${key}] exceeds ${MAX_CUSTOM_ANSWER_VALUE_LENGTH} characters`);
    }

    normalized[key] = value;
  }

  return normalized;
}

function isDisallowedAutomationHost(hostname: string): boolean {
  if (!hostname) {
    return true;
  }

  if (hostname === "127.0.0.1" || hostname === "0.0.0.0") {
    return true;
  }

  if (DISALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return true;
  }

  const ipType = isIP(hostname);
  if (ipType === 4) {
    return isDisallowedIpv4(hostname);
  }

  if (ipType === 6) {
    return isDisallowedIpv6(hostname);
  }

  return false;
}

function isDisallowedIpv4(hostname: string): boolean {
  const segments = hostname.split(".").map((segment) => Number.parseInt(segment, 10));
  const [first, second] = segments;
  if (Number.isNaN(first) || Number.isNaN(second)) {
    return false;
  }

  return DISALLOWED_IPV4_PREFIXES.some(
    ([disallowedFirst, disallowedSecond]) =>
      first === disallowedFirst && (disallowedSecond === 0 ? true : second === disallowedSecond),
  );
}

function isDisallowedIpv6(hostname: string): boolean {
  return hostname === "::1" || /^fc|^fd|^fe80/i.test(hostname);
}
