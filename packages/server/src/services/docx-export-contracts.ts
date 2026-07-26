import type {
  CoverLetterDocxTheme,
  PortfolioDocxTheme,
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
} from "@bao/shared/constants/export-layout";
import { RESUME_EXPORT_THEME_CONFIGS } from "@bao/shared/constants/export-resume-theme";
import type { ResumeTemplate } from "@bao/shared/constants/resume";
import type { ResumeData } from "@bao/shared/types/resume";
import { BorderStyle, Paragraph, TextRun } from "docx";
import type {
  CoverLetterPayload as CanonicalCoverLetterPayload,
  CoverLetterUserProfile as CanonicalCoverLetterUserProfile,
} from "./export-service-contracts";

export type ResumeExperienceItem = NonNullable<ResumeData["experience"]>[number];
export type ResumeEducationItem = NonNullable<ResumeData["education"]>[number];
export type ResumeProjectItem = NonNullable<ResumeData["projects"]>[number];
export type ResumeSkillsData = NonNullable<ResumeData["skills"]>;
export type ResumePersonalInfo = NonNullable<ResumeData["personalInfo"]>;
export type DocxTemplateConfig = (typeof RESUME_EXPORT_THEME_CONFIGS)[ResumeTemplate]["docx"];

export type CoverLetterPayload = CanonicalCoverLetterPayload;
export type CoverLetterUserProfile = CanonicalCoverLetterUserProfile;

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
