import {
  COVER_LETTER_EXPORT_THEME,
  type CoverLetterDocxTheme,
  PORTFOLIO_EXPORT_THEME,
  type PortfolioDocxTheme,
} from "@bao/shared/constants/export-document-theme";
import {
  DOCX_COVER_LETTER_FONT_BODY_PT,
  DOCX_COVER_LETTER_FONT_HEADER_PT,
  DOCX_PORTFOLIO_FONT_BODY_PT,
  DOCX_PORTFOLIO_FONT_HEADING_PT,
  DOCX_PORTFOLIO_FONT_TITLE_PT,
  DOCX_RESUME_FONT_ACCENT_PT,
  DOCX_RESUME_FONT_BODY_PT,
  DOCX_RESUME_FONT_HEADER_PT,
  DOCX_RESUME_FONT_NAME_PT,
  RESUME_EXPORT_THEME_CONFIGS,
} from "@bao/shared/constants/export-layout";
import type { ResumeTemplate } from "@bao/shared/constants/resume";
import type { ResumeData } from "@bao/shared/types/resume";
import { BorderStyle, Paragraph, TextRun } from "docx";

export type ResumeExperienceItem = NonNullable<ResumeData["experience"]>[number];
export type ResumeEducationItem = NonNullable<ResumeData["education"]>[number];
export type ResumeProjectItem = NonNullable<ResumeData["projects"]>[number];
export type ResumeSkillsData = NonNullable<ResumeData["skills"]>;
export type ResumePersonalInfo = NonNullable<ResumeData["personalInfo"]>;
export type DocxTemplateConfig = (typeof RESUME_EXPORT_THEME_CONFIGS)[ResumeTemplate]["docx"];

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

export const COVER_LETTER_DOCX_FONT_FAMILY = COVER_LETTER_EXPORT_THEME.docx.fontFamily;
export const PORTFOLIO_DOCX_FONT_FAMILY = PORTFOLIO_EXPORT_THEME.docx.fontFamily;
export const COVER_LETTER_DOCX_PRIMARY_COLOR = COVER_LETTER_EXPORT_THEME.docx.primaryColorHex;
export const COVER_LETTER_DOCX_ACCENT_COLOR = COVER_LETTER_EXPORT_THEME.docx.accentColorHex;
export const COVER_LETTER_DOCX_TEXT_COLOR = COVER_LETTER_EXPORT_THEME.docx.textColorHex;
export const COVER_LETTER_DOCX_MUTED_COLOR = COVER_LETTER_EXPORT_THEME.docx.mutedColorHex;
export const COVER_LETTER_DOCX_SUBTLE_COLOR = COVER_LETTER_EXPORT_THEME.docx.subtleColorHex;
export const COVER_LETTER_DOCX_LINE_COLOR = COVER_LETTER_EXPORT_THEME.docx.lineColorHex;
export const PORTFOLIO_DOCX_PRIMARY_COLOR = PORTFOLIO_EXPORT_THEME.docx.primaryColorHex;
export const PORTFOLIO_DOCX_ACCENT_COLOR = PORTFOLIO_EXPORT_THEME.docx.accentColorHex;
export const PORTFOLIO_DOCX_MUTED_COLOR = PORTFOLIO_EXPORT_THEME.docx.mutedColorHex;
export const PORTFOLIO_DOCX_SUBTLE_COLOR = PORTFOLIO_EXPORT_THEME.docx.subtleColorHex;
export const PORTFOLIO_DOCX_FOOTER_COLOR = PORTFOLIO_EXPORT_THEME.docx.footerColorHex;
export const PORTFOLIO_DOCX_LINE_COLOR = PORTFOLIO_EXPORT_THEME.docx.lineColorHex;

export type { CoverLetterDocxTheme, PortfolioDocxTheme };

export const createDivider = (color: string): Paragraph =>
  new Paragraph({
    spacing: { before: 100, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color },
    },
  });

export const createSectionHeading = (
  label: string,
  color: string,
  pt: number,
  fontFamily: string,
): Paragraph =>
  new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text: label.toUpperCase(),
        bold: true,
        size: pt * 2,
        color,
        font: fontFamily,
      }),
    ],
  });

export {
  DOCX_COVER_LETTER_FONT_BODY_PT,
  DOCX_COVER_LETTER_FONT_HEADER_PT,
  DOCX_PORTFOLIO_FONT_BODY_PT,
  DOCX_PORTFOLIO_FONT_HEADING_PT,
  DOCX_PORTFOLIO_FONT_TITLE_PT,
  DOCX_RESUME_FONT_ACCENT_PT,
  DOCX_RESUME_FONT_BODY_PT,
  DOCX_RESUME_FONT_HEADER_PT,
  DOCX_RESUME_FONT_NAME_PT,
  RESUME_EXPORT_THEME_CONFIGS,
};
