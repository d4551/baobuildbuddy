/**
 * Shared neutral document theme used as the export baseline.
 */
const BASE_DOCUMENT_EXPORT_THEME = {
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
 * Cover letters use a more formal letter aesthetic than resumes or portfolios.
 */
export const COVER_LETTER_EXPORT_THEME = {
  pdf: {
    colors: {
      primary: { r: 0.14, g: 0.22, b: 0.34 },
      accent: { r: 0.35, g: 0.43, b: 0.56 },
      text: { r: 0.16, g: 0.16, b: 0.17 },
      muted: { r: 0.39, g: 0.39, b: 0.41 },
      subtle: { r: 0.48, g: 0.49, b: 0.53 },
      line: { r: 0.84, g: 0.84, b: 0.86 },
    },
  },
  docx: {
    fontFamily: "Georgia",
    primaryColorHex: "243854",
    accentColorHex: "5A6E8F",
    textColorHex: "292A2C",
    mutedColorHex: "646669",
    subtleColorHex: "7C8087",
    lineColorHex: "D6D8DC",
  },
} as const;

/**
 * Portfolios use a more showcase-oriented accent system and wider visual contrast.
 */
export const PORTFOLIO_EXPORT_THEME = {
  pdf: {
    colors: {
      primary: { r: 0.08, g: 0.34, b: 0.82 },
      text: BASE_DOCUMENT_EXPORT_THEME.pdf.colors.text,
      accent: { r: 0.0, g: 0.58, b: 0.48 },
      muted: BASE_DOCUMENT_EXPORT_THEME.pdf.colors.muted,
      subtle: BASE_DOCUMENT_EXPORT_THEME.pdf.colors.subtle,
      featured: { r: 0.0, g: 0.58, b: 0.48 },
      line: { r: 0.82, g: 0.87, b: 0.94 },
      footer: { r: 0.47, g: 0.5, b: 0.56 },
    },
  },
  docx: {
    fontFamily: "Arial",
    primaryColorHex: "1457D1",
    accentColorHex: "00957A",
    mutedColorHex: BASE_DOCUMENT_EXPORT_THEME.docx.mutedColorHex,
    subtleColorHex: BASE_DOCUMENT_EXPORT_THEME.docx.subtleColorHex,
    footerColorHex: "727782",
    lineColorHex: "D0DDEB",
  },
} as const;
