/**
 * Number of resumes rendered per page in resume list views.
 */
export const RESUME_LIST_PAGE_SIZE = 6;

/**
 * Canonical fallback name used when a resume payload omits the display name.
 */
export const RESUME_DEFAULT_NAME = "Untitled Resume" as const;

/**
 * Canonical fallback theme used for resume rendering and persistence.
 */
export const RESUME_DEFAULT_THEME = "light" as const;

/**
 * Canonical resume template options shared across client and server layers.
 */
export const RESUME_TEMPLATE_OPTIONS = [
  "modern",
  "classic",
  "creative",
  "minimal",
  "google-xyz",
  "gaming",
  "executive",
  "technical",
] as const;

/**
 * Resume template union derived from canonical options.
 */
export type ResumeTemplate = (typeof RESUME_TEMPLATE_OPTIONS)[number];

/**
 * Resume template used when no explicit template is provided.
 */
export const RESUME_TEMPLATE_DEFAULT: ResumeTemplate = RESUME_TEMPLATE_OPTIONS[0];

/**
 * Canonical resume export format values shared across client and server layers.
 */
export const RESUME_EXPORT_FORMATS = ["pdf", "docx", "html", "json", "markdown"] as const;

/**
 * Resume export format union derived from canonical options.
 */
export type ResumeExportFormat = (typeof RESUME_EXPORT_FORMATS)[number];

/**
 * Type guard for supported resume templates.
 */
export function isResumeTemplate(value: string | undefined | null): value is ResumeTemplate {
  if (!value) return false;
  return RESUME_TEMPLATE_OPTIONS.some((template) => template === value);
}

/**
 * Type guard for supported resume export formats.
 */
export function isResumeExportFormat(
  value: string | undefined | null,
): value is ResumeExportFormat {
  if (!value) return false;
  return RESUME_EXPORT_FORMATS.some((format) => format === value);
}
