/**
 * Shared document export themes — cover letter + portfolio variants.
 * Resume themes live in export-layout.ts (RESUME_EXPORT_THEME_CONFIGS).
 */
import type { CoverLetterTemplate } from "./cover-letter";

type PdfRgb = { r: number; g: number; b: number };

type CoverLetterPdfPalette = {
  primary: PdfRgb;
  accent: PdfRgb;
  text: PdfRgb;
  muted: PdfRgb;
  subtle: PdfRgb;
  line: PdfRgb;
};

type PortfolioPdfPalette = {
  primary: PdfRgb;
  text: PdfRgb;
  accent: PdfRgb;
  muted: PdfRgb;
  subtle: PdfRgb;
  featured: PdfRgb;
  line: PdfRgb;
  footer: PdfRgb;
};

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
 * Default formal cover-letter aesthetic (professional template).
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
    } satisfies CoverLetterPdfPalette,
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
 * Per-template cover-letter PDF palettes — must produce visually distinct PDFs.
 */
export const COVER_LETTER_EXPORT_THEME_BY_TEMPLATE = {
  professional: COVER_LETTER_EXPORT_THEME.pdf.colors,
  creative: {
    primary: { r: 0.62, g: 0.18, b: 0.42 },
    accent: { r: 0.93, g: 0.42, b: 0.22 },
    text: { r: 0.14, g: 0.12, b: 0.16 },
    muted: { r: 0.42, g: 0.36, b: 0.4 },
    subtle: { r: 0.55, g: 0.48, b: 0.52 },
    line: { r: 0.92, g: 0.82, b: 0.86 },
  },
  gaming: {
    primary: { r: 0.54, g: 0.17, b: 0.89 },
    accent: { r: 0.0, g: 0.9, b: 0.55 },
    text: { r: 0.94, g: 0.94, b: 0.96 },
    muted: { r: 0.65, g: 0.65, b: 0.72 },
    subtle: { r: 0.45, g: 0.45, b: 0.55 },
    line: { r: 0.35, g: 0.2, b: 0.5 },
  },
  executive: {
    primary: { r: 0.1, g: 0.14, b: 0.49 },
    accent: { r: 0.79, g: 0.69, b: 0.22 },
    text: { r: 0.12, g: 0.12, b: 0.12 },
    muted: { r: 0.4, g: 0.4, b: 0.4 },
    subtle: { r: 0.55, g: 0.55, b: 0.55 },
    line: { r: 0.8, g: 0.78, b: 0.7 },
  },
  technical: {
    primary: { r: 0.0, g: 0.41, b: 0.36 },
    accent: { r: 0.01, g: 0.47, b: 0.74 },
    text: { r: 0.1, g: 0.12, b: 0.14 },
    muted: { r: 0.35, g: 0.4, b: 0.42 },
    subtle: { r: 0.5, g: 0.55, b: 0.58 },
    line: { r: 0.75, g: 0.85, b: 0.88 },
  },
} as const satisfies Record<CoverLetterTemplate, CoverLetterPdfPalette>;

export type PortfolioExportTemplate = "modern" | "gaming" | "minimal" | "showcase";
export type PortfolioExportTheme = "light" | "dark" | "gaming" | "neon";

export const PORTFOLIO_EXPORT_TEMPLATE_OPTIONS = [
  "modern",
  "gaming",
  "minimal",
  "showcase",
] as const satisfies readonly PortfolioExportTemplate[];

export const PORTFOLIO_EXPORT_THEME_OPTIONS = [
  "light",
  "dark",
  "gaming",
  "neon",
] as const satisfies readonly PortfolioExportTheme[];

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
    } satisfies PortfolioPdfPalette,
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

/**
 * Portfolio PDF palettes keyed by template (theme overlays dark/neon backgrounds via text/bg).
 */
export const PORTFOLIO_EXPORT_THEME_BY_TEMPLATE = {
  modern: PORTFOLIO_EXPORT_THEME.pdf.colors,
  gaming: {
    primary: { r: 0.54, g: 0.17, b: 0.89 },
    text: { r: 0.94, g: 0.94, b: 0.96 },
    accent: { r: 0.0, g: 0.95, b: 0.55 },
    muted: { r: 0.65, g: 0.65, b: 0.72 },
    subtle: { r: 0.45, g: 0.45, b: 0.55 },
    featured: { r: 1.0, g: 0.0, b: 0.39 },
    line: { r: 0.35, g: 0.2, b: 0.5 },
    footer: { r: 0.55, g: 0.55, b: 0.65 },
  },
  minimal: {
    primary: { r: 0.12, g: 0.12, b: 0.12 },
    text: { r: 0.15, g: 0.15, b: 0.15 },
    accent: { r: 0.35, g: 0.35, b: 0.35 },
    muted: { r: 0.45, g: 0.45, b: 0.45 },
    subtle: { r: 0.6, g: 0.6, b: 0.6 },
    featured: { r: 0.2, g: 0.2, b: 0.2 },
    line: { r: 0.88, g: 0.88, b: 0.88 },
    footer: { r: 0.55, g: 0.55, b: 0.55 },
  },
  showcase: {
    primary: { r: 0.9, g: 0.35, b: 0.1 },
    text: { r: 0.12, g: 0.12, b: 0.14 },
    accent: { r: 0.1, g: 0.45, b: 0.85 },
    muted: { r: 0.4, g: 0.4, b: 0.45 },
    subtle: { r: 0.55, g: 0.55, b: 0.6 },
    featured: { r: 0.95, g: 0.55, b: 0.1 },
    line: { r: 0.9, g: 0.85, b: 0.78 },
    footer: { r: 0.5, g: 0.48, b: 0.45 },
  },
} as const satisfies Record<PortfolioExportTemplate, PortfolioPdfPalette>;

export const resolveCoverLetterPdfPalette = (
  template: CoverLetterTemplate | string | undefined | null,
): CoverLetterPdfPalette => {
  if (template && template in COVER_LETTER_EXPORT_THEME_BY_TEMPLATE) {
    return COVER_LETTER_EXPORT_THEME_BY_TEMPLATE[template as CoverLetterTemplate];
  }
  return COVER_LETTER_EXPORT_THEME_BY_TEMPLATE.professional;
};

export const resolvePortfolioPdfPalette = (
  template: PortfolioExportTemplate | string | undefined | null,
): PortfolioPdfPalette => {
  if (template && template in PORTFOLIO_EXPORT_THEME_BY_TEMPLATE) {
    return PORTFOLIO_EXPORT_THEME_BY_TEMPLATE[template as PortfolioExportTemplate];
  }
  return PORTFOLIO_EXPORT_THEME_BY_TEMPLATE.modern;
};
