/**
 * Shared limits for job application automation request validation.
 */
export declare const MAX_JOB_URL_LENGTH = 2048;
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
