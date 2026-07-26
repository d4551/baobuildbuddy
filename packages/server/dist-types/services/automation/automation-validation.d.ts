/** Re-export shared limits for consumers that import from this module. */
export declare const MAX_CUSTOM_ANSWER_KEY_LENGTH = 120;
export declare const MAX_CUSTOM_ANSWER_VALUE_LENGTH = 2000;
export declare const MAX_CUSTOM_ANSWER_COUNT = 50;
/**
 * Validate and normalize an automation URL while blocking unsafe host targets.
 */
export declare function sanitizeAndValidateJobUrl(rawJobUrl: string): string;
/**
 * Normalize custom answers payload by enforcing strict typing and length limits.
 */
export declare function sanitizeCustomAnswers(customAnswers: Record<string, unknown> | undefined): Record<string, string>;
/**
 * Pure host classification: true when the hostname is loopback, RFC 1918
 * private space, or link-local. Separated from the opt-in policy below so the
 * range boundaries are testable without mutating process environment.
 */
export declare function isPrivateOrLoopbackAutomationHost(hostname: string): boolean;
