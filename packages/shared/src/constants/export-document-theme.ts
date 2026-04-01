/**
 * Shared professional document theme for non-resume exports so cover letters and portfolios
 * present the same typography, spacing rhythm, and accent treatment.
 */
export const SHARED_DOCUMENT_EXPORT_THEME = {
  pdf: {
    colors: {
      primary: { r: 0.16, g: 0.38, b: 1.0 },
      accent: { r: 0, g: 0.59, b: 0.53 },
      text: { r: 0.13, g: 0.13, b: 0.13 },
      muted: { r: 0.39, g: 0.39, b: 0.39 },
      subtle: { r: 0.58, g: 0.58, b: 0.58 },
      line: { r: 0.82, g: 0.86, b: 0.92 },
    },
  },
  docx: {
    fontFamily: "Calibri",
    primaryColorHex: "2962FF",
    accentColorHex: "009688",
    textColorHex: "222222",
    mutedColorHex: "666666",
    subtleColorHex: "999999",
    lineColorHex: "D1DBE8",
    footerColorHex: "808080",
  },
} as const;

/**
 * Shared cover-letter export theme for PDF and DOCX output.
 */
export const COVER_LETTER_EXPORT_THEME = {
  pdf: {
    colors: {
      primary: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.primary,
      accent: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.accent,
      text: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.text,
      muted: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.muted,
      subtle: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.subtle,
      line: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.line,
    },
  },
  docx: {
    fontFamily: SHARED_DOCUMENT_EXPORT_THEME.docx.fontFamily,
    primaryColorHex: SHARED_DOCUMENT_EXPORT_THEME.docx.primaryColorHex,
    accentColorHex: SHARED_DOCUMENT_EXPORT_THEME.docx.accentColorHex,
    textColorHex: SHARED_DOCUMENT_EXPORT_THEME.docx.textColorHex,
    mutedColorHex: SHARED_DOCUMENT_EXPORT_THEME.docx.mutedColorHex,
    subtleColorHex: SHARED_DOCUMENT_EXPORT_THEME.docx.subtleColorHex,
    lineColorHex: SHARED_DOCUMENT_EXPORT_THEME.docx.lineColorHex,
  },
} as const;

/**
 * Shared portfolio export theme for PDF and DOCX output.
 */
export const PORTFOLIO_EXPORT_THEME = {
  pdf: {
    colors: {
      primary: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.primary,
      text: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.text,
      accent: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.accent,
      muted: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.muted,
      subtle: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.subtle,
      featured: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.accent,
      line: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.line,
      footer: SHARED_DOCUMENT_EXPORT_THEME.pdf.colors.subtle,
    },
  },
  docx: {
    fontFamily: SHARED_DOCUMENT_EXPORT_THEME.docx.fontFamily,
    primaryColorHex: SHARED_DOCUMENT_EXPORT_THEME.docx.primaryColorHex,
    accentColorHex: SHARED_DOCUMENT_EXPORT_THEME.docx.accentColorHex,
    mutedColorHex: SHARED_DOCUMENT_EXPORT_THEME.docx.mutedColorHex,
    subtleColorHex: SHARED_DOCUMENT_EXPORT_THEME.docx.subtleColorHex,
    footerColorHex: SHARED_DOCUMENT_EXPORT_THEME.docx.footerColorHex,
    lineColorHex: SHARED_DOCUMENT_EXPORT_THEME.docx.lineColorHex,
  },
} as const;
