/**
 * PDF export layout constants.
 * Single source of truth for resume, cover letter, and portfolio PDF dimensions.
 */

/** A4 page size in PDF points (width, height). */
export const A4_PAGE_SIZE: [number, number] = [595.28, 841.89];

export const A4_PAGE_WIDTH = A4_PAGE_SIZE[0];
export const A4_PAGE_HEIGHT = A4_PAGE_SIZE[1];

/** Resume layout. */
export const RESUME_SECTION_SPACE = 60;
export const RESUME_BODY_LINE_GAP = 4;
export const RESUME_HEADER_NAME_SPACING = 30;
export const RESUME_CONTACT_SPACING = 15;
export const RESUME_LINKS_SPACING = 25;
export const RESUME_DIVIDER_SPACING = 20;
export const RESUME_SECTION_HEADER_SPACING = 18;

/** Cover letter layout. */
export const COVER_LETTER_MARGIN = 60;
export const COVER_LETTER_PARAGRAPH_SIZE = 11;
export const COVER_LETTER_LINE_HEIGHT = 16;
export const COVER_LETTER_PARAGRAPH_GAP = 10;

/** Portfolio layout. */
export const PORTFOLIO_MARGIN = 50;
export const PORTFOLIO_PROJECT_SPACE = 100;
export const PORTFOLIO_FOOTER_Y = 30;
export const PORTFOLIO_FOOTER_X_OFFSET = 30;

/** Locale for PDF date formatting (cover letters). */
export const EXPORT_DATE_LOCALE = "en-US";
