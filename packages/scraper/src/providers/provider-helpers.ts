/**
 * Trims and normalizes repeated whitespace in DOM text.
 *
 * @param value Raw text content from a scraper page.
 * @returns Normalized text string.
 */
export const normalizeWhitespace = (value: string): string => value.replace(/\s+/gu, " ").trim();

/**
 * Trims a string and applies a defensive maximum length.
 *
 * @param value Raw text content.
 * @param maxLength Maximum number of characters to retain.
 * @returns Normalized bounded string.
 */
export const toBoundedText = (value: string, maxLength: number): string =>
  normalizeWhitespace(value).slice(0, maxLength);

/**
 * Resolves a possibly relative href against the current source URL.
 *
 * @param sourceUrl Canonical source URL supplied to the scraper.
 * @param href Raw href extracted from the page.
 * @returns Absolute URL string.
 */
export const toAbsoluteUrl = (sourceUrl: string, href: string): string =>
  new URL(href, sourceUrl).toString();
