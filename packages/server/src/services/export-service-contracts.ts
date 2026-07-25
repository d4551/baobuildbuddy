import {
  COVER_LETTER_EXPORT_THEME,
  PORTFOLIO_EXPORT_THEME,
  resolveCoverLetterPdfPalette,
  resolvePortfolioPdfPalette,
} from "@bao/shared/constants/export-document-theme";
import type { ResumePdfThemeConfig } from "@bao/shared/constants/export-layout";
import { A4_PAGE_HEIGHT, A4_PAGE_SIZE, A4_PAGE_WIDTH } from "@bao/shared/constants/export-layout";
import type { ResumeData } from "@bao/shared/types/resume";
import { type Color, type PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type ResumeTemplateDefinition = ResumePdfThemeConfig;
export type ResumeExperienceItem = NonNullable<ResumeData["experience"]>[number];
export type ResumeEducationItem = NonNullable<ResumeData["education"]>[number];
export type ResumeProjectItem = NonNullable<ResumeData["projects"]>[number];
export type ResumeSkillsData = NonNullable<ResumeData["skills"]>;
export type ResumePersonalInfo = NonNullable<ResumeData["personalInfo"]>;

export interface WrappedTextOptions {
  text: string;
  x: number;
  size: number;
  color: Color;
  font: PDFFont;
  maxWidth: number;
  lineGap?: number;
}

export interface ResumeRenderContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  width: number;
  height: number;
  margin: number;
  yPosition: number;
  fonts: ResumeTemplateDefinition["fonts"];
  layout: ResumeTemplateDefinition["layout"];
  palette: { primary: Color; text: Color; line: Color; accent: Color };
  background: RGB;
  font: PDFFont;
  boldFont: PDFFont;
}

export interface ResumeSkillGroupOptions {
  label: string | null;
  items: string[] | undefined;
  separator: string;
  labelColor: Color;
  trailingGap: number;
}

export interface CoverLetterPayload {
  company: string;
  position: string;
  content: unknown;
  template?: string;
}

export interface CoverLetterUserProfile {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
}

export type CoverLetterPdfColors = {
  primary: Color;
  accent: Color;
  text: Color;
  muted: Color;
  subtle: Color;
  line: Color;
};

export interface CoverLetterRenderContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  width: number;
  height: number;
  margin: number;
  yPosition: number;
  font: PDFFont;
  boldFont: PDFFont;
  colors: CoverLetterPdfColors;
  darkBackground: boolean;
}

export type PortfolioPdfColors = {
  primary: Color;
  text: Color;
  accent: Color;
  muted: Color;
  subtle: Color;
  featured: Color;
  line: Color;
  footer: Color;
};

export interface PortfolioRenderContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  width: number;
  height: number;
  margin: number;
  yPosition: number;
  font: PDFFont;
  boldFont: PDFFont;
  colors: PortfolioPdfColors;
  darkBackground: boolean;
}

const toStaticPdfColor = (color: RGB): Color => rgb(color.r, color.g, color.b);

export const COVER_LETTER_PDF_COLORS = {
  primary: toStaticPdfColor(COVER_LETTER_EXPORT_THEME.pdf.colors.primary),
  accent: toStaticPdfColor(COVER_LETTER_EXPORT_THEME.pdf.colors.accent),
  text: toStaticPdfColor(COVER_LETTER_EXPORT_THEME.pdf.colors.text),
  muted: toStaticPdfColor(COVER_LETTER_EXPORT_THEME.pdf.colors.muted),
  subtle: toStaticPdfColor(COVER_LETTER_EXPORT_THEME.pdf.colors.subtle),
  line: toStaticPdfColor(COVER_LETTER_EXPORT_THEME.pdf.colors.line),
};

export const PORTFOLIO_PDF_COLORS = {
  primary: toStaticPdfColor(PORTFOLIO_EXPORT_THEME.pdf.colors.primary),
  text: toStaticPdfColor(PORTFOLIO_EXPORT_THEME.pdf.colors.text),
  accent: toStaticPdfColor(PORTFOLIO_EXPORT_THEME.pdf.colors.accent),
  muted: toStaticPdfColor(PORTFOLIO_EXPORT_THEME.pdf.colors.muted),
  subtle: toStaticPdfColor(PORTFOLIO_EXPORT_THEME.pdf.colors.subtle),
  featured: toStaticPdfColor(PORTFOLIO_EXPORT_THEME.pdf.colors.featured),
  line: toStaticPdfColor(PORTFOLIO_EXPORT_THEME.pdf.colors.line),
  footer: toStaticPdfColor(PORTFOLIO_EXPORT_THEME.pdf.colors.footer),
};

export const toCoverLetterPdfColors = (template?: string | null): CoverLetterPdfColors => {
  const palette = resolveCoverLetterPdfPalette(template);
  return {
    primary: toStaticPdfColor(palette.primary),
    accent: toStaticPdfColor(palette.accent),
    text: toStaticPdfColor(palette.text),
    muted: toStaticPdfColor(palette.muted),
    subtle: toStaticPdfColor(palette.subtle),
    line: toStaticPdfColor(palette.line),
  };
};

export const toPortfolioPdfColors = (template?: string | null): PortfolioPdfColors => {
  const palette = resolvePortfolioPdfPalette(template);
  return {
    primary: toStaticPdfColor(palette.primary),
    text: toStaticPdfColor(palette.text),
    accent: toStaticPdfColor(palette.accent),
    muted: toStaticPdfColor(palette.muted),
    subtle: toStaticPdfColor(palette.subtle),
    featured: toStaticPdfColor(palette.featured),
    line: toStaticPdfColor(palette.line),
    footer: toStaticPdfColor(palette.footer),
  };
};

export const addA4Page = (pdfDoc: PDFDocument): PDFPage => pdfDoc.addPage([...A4_PAGE_SIZE]);
export const toPdfColor = (color: RGB): Color => rgb(color.r, color.g, color.b);

export { A4_PAGE_HEIGHT, A4_PAGE_WIDTH };
