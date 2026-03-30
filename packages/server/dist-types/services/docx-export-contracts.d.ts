import { DOCX_COVER_LETTER_FONT_BODY_PT, DOCX_COVER_LETTER_FONT_HEADER_PT, DOCX_PORTFOLIO_FONT_BODY_PT, DOCX_PORTFOLIO_FONT_HEADING_PT, DOCX_PORTFOLIO_FONT_TITLE_PT, DOCX_RESUME_FONT_ACCENT_PT, DOCX_RESUME_FONT_BODY_PT, DOCX_RESUME_FONT_HEADER_PT, DOCX_RESUME_FONT_NAME_PT, RESUME_EXPORT_THEME_CONFIGS, type ResumeData, type ResumeTemplate } from "@bao/shared";
import { Paragraph } from "docx";
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
}
export interface CoverLetterUserProfile {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
}
export declare const COVER_LETTER_DOCX_FONT_FAMILY: "Times New Roman";
export declare const PORTFOLIO_DOCX_FONT_FAMILY: "Calibri";
export declare const COVER_LETTER_DOCX_TEXT_COLOR: "000000";
export declare const COVER_LETTER_DOCX_MUTED_COLOR: "666666";
export declare const PORTFOLIO_DOCX_PRIMARY_COLOR: "331A80";
export declare const PORTFOLIO_DOCX_MUTED_COLOR: "666666";
export declare const PORTFOLIO_DOCX_SUBTLE_COLOR: "999999";
export declare const PORTFOLIO_DOCX_FOOTER_COLOR: "999999";
export declare const createDivider: (color: string) => Paragraph;
export declare const createSectionHeading: (label: string, color: string, pt: number, fontFamily: string) => Paragraph;
export { DOCX_COVER_LETTER_FONT_BODY_PT, DOCX_COVER_LETTER_FONT_HEADER_PT, DOCX_PORTFOLIO_FONT_BODY_PT, DOCX_PORTFOLIO_FONT_HEADING_PT, DOCX_PORTFOLIO_FONT_TITLE_PT, DOCX_RESUME_FONT_ACCENT_PT, DOCX_RESUME_FONT_BODY_PT, DOCX_RESUME_FONT_HEADER_PT, DOCX_RESUME_FONT_NAME_PT, RESUME_EXPORT_THEME_CONFIGS, };
