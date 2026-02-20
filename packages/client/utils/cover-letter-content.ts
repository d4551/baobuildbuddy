import type { CoverLetterData } from "@bao/shared";

const COVER_LETTER_PRIMARY_SECTION_KEYS = [
  "opening",
  "introduction",
  "body",
  "closing",
  "conclusion",
  "signature",
] as const;

/**
 * Converts structured cover-letter content into readable multiline text for previews/editing.
 *
 * @param content Structured cover-letter content map.
 * @returns Concatenated plain-text content with paragraph spacing.
 */
export function coverLetterContentToPlainText(
  content: CoverLetterData["content"] | undefined,
): string {
  if (!content) return "";

  const sectionKeys = new Set<string>();
  const orderedSections: string[] = [];

  for (const key of COVER_LETTER_PRIMARY_SECTION_KEYS) {
    sectionKeys.add(key);
    const value = content[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      orderedSections.push(trimmed);
    }
  }

  const additionalSections = Object.entries(content).flatMap(([key, value]) => {
    if (sectionKeys.has(key) || typeof value !== "string") {
      return [];
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? [trimmedValue] : [];
  });

  if (additionalSections.length > 0) {
    orderedSections.push(...additionalSections);
  }

  return orderedSections.join("\n\n");
}

/**
 * Converts user-edited plain text into canonical structured cover-letter content.
 *
 * @param value Editable plain-text cover-letter input.
 * @returns Structured cover-letter content suitable for API payloads.
 */
export function plainTextToCoverLetterContent(value: string): CoverLetterData["content"] {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) return {};

  const sections = trimmedValue
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter((section) => section.length > 0);

  if (sections.length === 1) {
    return {
      body: sections[0],
    };
  }

  if (sections.length === 2) {
    return {
      introduction: sections[0],
      body: sections[1],
    };
  }

  return {
    introduction: sections[0],
    body: sections.slice(1, -1).join("\n\n"),
    conclusion: sections[sections.length - 1],
  };
}
