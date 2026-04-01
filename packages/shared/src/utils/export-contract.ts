import { EXPORT_DATE_LOCALE } from "../constants/export-layout";
import { isResumeTemplate, RESUME_TEMPLATE_DEFAULT } from "../constants/resume";
import type { ResumeTemplate } from "../constants/resume";
import { isRecord } from "./type-guards";

const EXPORT_DATE_FORMATTER = new Intl.DateTimeFormat(EXPORT_DATE_LOCALE, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const normalizeParagraphInput = (value: unknown): string[] => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
};

/**
 * Collects only defined, non-empty string values.
 */
export const collectDefinedStringValues = (values: ReadonlyArray<string | undefined>): string[] =>
  values.filter((value): value is string => typeof value === "string" && value.trim().length > 0);

/**
 * Resolves the canonical resume export template from explicit and persisted values.
 */
export const resolveResumeExportTemplate = (
  templateName?: string,
  resumeTemplate?: string,
): ResumeTemplate => {
  if (isResumeTemplate(templateName)) {
    return templateName;
  }

  if (isResumeTemplate(resumeTemplate)) {
    return resumeTemplate;
  }

  return RESUME_TEMPLATE_DEFAULT;
};

/**
 * Formats export dates with the shared locale contract.
 */
export const formatExportDate = (date: Date): string => EXPORT_DATE_FORMATTER.format(date);

/**
 * Normalizes cover-letter content into canonical paragraph blocks for all export renderers.
 */
export const toCoverLetterParagraphs = (content: unknown): string[] => {
  if (typeof content === "string") {
    return content
      .split("\n\n")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  if (!isRecord(content)) {
    return [];
  }

  return [
    ...normalizeParagraphInput(content.opening).concat(
      normalizeParagraphInput(content.introduction),
    ),
    ...normalizeParagraphInput(content.body).concat(normalizeParagraphInput(content.main)),
    ...normalizeParagraphInput(content.closing).concat(normalizeParagraphInput(content.conclusion)),
  ];
};
