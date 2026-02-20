import type { CoverLetterTemplate } from "../types/cover-letter";

/**
 * Canonical cover-letter template options shared across client and server layers.
 */
export const COVER_LETTER_TEMPLATE_OPTIONS = [
  "professional",
  "creative",
  "gaming",
] as const satisfies readonly CoverLetterTemplate[];

/**
 * Default cover-letter template used when no explicit template is selected.
 */
export const COVER_LETTER_DEFAULT_TEMPLATE: CoverLetterTemplate = "professional";

/**
 * Minimum character length required for a company name during generation/edit flows.
 */
export const COVER_LETTER_COMPANY_MIN_LENGTH = 2;

/**
 * Minimum character length required for a target position during generation/edit flows.
 */
export const COVER_LETTER_POSITION_MIN_LENGTH = 2;

/**
 * Minimum character length for optional job-description context when provided.
 */
export const COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH = 50;

/**
 * Maximum character count used for compact cover-letter content previews.
 */
export const COVER_LETTER_CONTENT_PREVIEW_LENGTH = 150;

/**
 * Number of cover letters rendered per page in list views.
 */
export const COVER_LETTER_LIST_PAGE_SIZE = 6;

/**
 * Type-guard for validating cover-letter template values from untyped boundaries.
 *
 * @param value Candidate template value.
 * @returns True when `value` matches one of the canonical cover-letter templates.
 */
export function isCoverLetterTemplate(
  value: string | null | undefined,
): value is CoverLetterTemplate {
  if (!value) return false;
  return COVER_LETTER_TEMPLATE_OPTIONS.some((template) => template === value);
}
