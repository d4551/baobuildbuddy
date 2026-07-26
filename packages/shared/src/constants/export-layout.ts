/**
 * Export layout constants.
 * Single source of truth for resume, cover letter, and portfolio PDF/DOCX dimensions.
 */

import type { PortfolioExportLayout } from "./export-document-theme";

/** A4 width in PDF points. */
export const A4_PAGE_WIDTH_PT = 595.28;
/** A4 height in PDF points. */
export const A4_PAGE_HEIGHT_PT = 841.89;

/** A4 page size in PDF points (width, height). */
export const A4_PAGE_SIZE: [number, number] = [A4_PAGE_WIDTH_PT, A4_PAGE_HEIGHT_PT];

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

/** Cover-letter PDF geometry per export layout. */
export const COVER_LETTER_ACCENT_RAIL_WIDTH = 14;
export const COVER_LETTER_ACCENT_RAIL_MARGIN_BONUS = 10;
export const COVER_LETTER_BANNER_HEIGHT = 72;
export const COVER_LETTER_BANNER_TITLE_Y_OFFSET = 90;
export const COVER_LETTER_FORMAL_DIVIDER_THICKNESS = 2.5;
export const COVER_LETTER_NAME_SIZE_BANNER = 22;
export const COVER_LETTER_NAME_SIZE_DEFAULT = 24;
export const COVER_LETTER_CONTACT_LINE_SIZE = 9;
/** Company / signature / signer lines in cover-letter PDFs. */
export const COVER_LETTER_META_LINE_SIZE = 11;
export const COVER_LETTER_BADGE_PADDING_X = 16;
export const COVER_LETTER_BADGE_OFFSET_Y = 4;
export const COVER_LETTER_BADGE_TEXT_INSET_X = 8;
/** Sender name rendered on banner-dark covers. */
export const COVER_LETTER_BANNER_NAME_COLOR = { r: 0.98, g: 0.98, b: 1 } as const;
/** Contact line rendered on banner-dark covers. */
export const COVER_LETTER_BANNER_MUTED_COLOR = { r: 0.92, g: 0.92, b: 0.96 } as const;
/** Badge label rendered on technical-badge covers. */
export const COVER_LETTER_BADGE_TEXT_COLOR = { r: 1, g: 1, b: 1 } as const;

/** Portfolio layout. */
export const PORTFOLIO_MARGIN = 50;
export const PORTFOLIO_PROJECT_SPACE = 100;
export const PORTFOLIO_FOOTER_Y = 30;
export const PORTFOLIO_FOOTER_X_OFFSET = 30;
/** Margin reduction applied to the compact portfolio layout. */
export const PORTFOLIO_COMPACT_MARGIN_DELTA = 10;

/** Portfolio cover banner geometry per export layout. */
export const PORTFOLIO_SHOWCASE_BANNER_HEIGHT = 110;
export const PORTFOLIO_SHOWCASE_TITLE_Y_OFFSET = 48;
export const PORTFOLIO_DARK_BANNER_HEIGHT = 84;
export const PORTFOLIO_DARK_TITLE_Y_OFFSET = 42;
/** Vertical position reset after the author line inside banner covers. */
export const PORTFOLIO_BANNER_AUTHOR_Y_OFFSET = 130;

/** Portfolio cover title font size per export layout. */
export const PORTFOLIO_COVER_TITLE_SIZE_BY_LAYOUT = {
  standard: 28,
  "banner-dark": 28,
  compact: 22,
  showcase: 32,
} as const satisfies Record<PortfolioExportLayout, number>;

/** Portfolio cover author font size per export layout. */
export const PORTFOLIO_COVER_AUTHOR_SIZE_BY_LAYOUT = {
  standard: 12,
  "banner-dark": 12,
  compact: 10,
  showcase: 12,
} as const satisfies Record<PortfolioExportLayout, number>;

/** Portfolio projects section heading per export layout. */
export const PORTFOLIO_PROJECTS_HEADING_BY_LAYOUT = {
  standard: "SELECTED CASE STUDIES",
  "banner-dark": "SELECTED CASE STUDIES",
  compact: "Projects",
  showcase: "SHOWCASE",
} as const satisfies Record<PortfolioExportLayout, string>;

/** Portfolio projects section heading size per export layout. */
export const PORTFOLIO_PROJECTS_HEADING_SIZE_BY_LAYOUT = {
  standard: 16,
  "banner-dark": 16,
  compact: 13,
  showcase: 16,
} as const satisfies Record<PortfolioExportLayout, number>;

/** Portfolio project title size per export layout. */
export const PORTFOLIO_PROJECT_TITLE_SIZE_BY_LAYOUT = {
  standard: 18,
  "banner-dark": 18,
  compact: 14,
  showcase: 18,
} as const satisfies Record<PortfolioExportLayout, number>;

/** Horizontal inset of the FEATURED badge label inside its filled banner. */
export const PORTFOLIO_FEATURED_BADGE_INSET_X = 8;
/** Filled FEATURED badge banner geometry (showcase layout). */
export const PORTFOLIO_FEATURED_BADGE_WIDTH = 88;
export const PORTFOLIO_FEATURED_BADGE_HEIGHT = 14;
/** Banner drop below the label baseline so the text sits centred in the fill. */
export const PORTFOLIO_FEATURED_BADGE_BASELINE_OFFSET_Y = 2;

/** Portfolio project body copy sizes. */
export const PORTFOLIO_PROJECT_LABEL_SIZE = 9;
export const PORTFOLIO_PROJECT_BODY_SIZE = 10;
export const PORTFOLIO_PROJECT_TAGS_SIZE = 8;
/** Gap below the wrapped project description block. */
export const PORTFOLIO_PROJECT_DESCRIPTION_GAP = 10;
/** Separator rule thickness drawn between projects. */
export const PORTFOLIO_PROJECT_SEPARATOR_THICKNESS = 0.5;

/** Title text rendered on portfolio cover banners. */
export const PORTFOLIO_BANNER_TITLE_COLOR = { r: 1, g: 1, b: 1 } as const;
/** Muted author text rendered on portfolio cover banners. */
export const PORTFOLIO_BANNER_MUTED_COLOR = { r: 0.95, g: 0.95, b: 0.97 } as const;

/** Locale for date formatting (cover letters). */
export const EXPORT_DATE_LOCALE = "en-US";

/** Fixed page fill for dark export covers (pdf-lib RGB triple). */
export const EXPORT_DARK_PAGE_BACKGROUND = { r: 0.1, g: 0.1, b: 0.14 } as const;

/** DOCX MIME type for Word document responses. */
export const MIME_TYPE_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** DOCX resume font sizes in points. */
export const DOCX_RESUME_FONT_NAME_PT = 24;
export const DOCX_RESUME_FONT_HEADER_PT = 14;
export const DOCX_RESUME_FONT_BODY_PT = 11;
export const DOCX_RESUME_FONT_ACCENT_PT = 9;

/** DOCX cover-letter font sizes in points. */
export const DOCX_COVER_LETTER_FONT_BODY_PT = 11;
export const DOCX_COVER_LETTER_FONT_HEADER_PT = 14;

/** DOCX portfolio font sizes in points. */
export const DOCX_PORTFOLIO_FONT_TITLE_PT = 36;
export const DOCX_PORTFOLIO_FONT_HEADING_PT = 16;
export const DOCX_PORTFOLIO_FONT_BODY_PT = 10;
