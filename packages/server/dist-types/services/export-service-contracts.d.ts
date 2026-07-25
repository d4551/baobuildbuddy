import { type CoverLetterExportLayout, type PortfolioExportLayout } from "@bao/shared/constants/export-document-theme";
import type { ResumePdfThemeConfig } from "@bao/shared/constants/export-layout";
import { A4_PAGE_HEIGHT, A4_PAGE_WIDTH } from "@bao/shared/constants/export-layout";
import type { ResumeData } from "@bao/shared/types/resume";
import { type Color, type PDFDocument, type PDFFont, type PDFPage } from "pdf-lib";
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
    palette: {
        primary: Color;
        text: Color;
        line: Color;
        accent: Color;
    };
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
    layout: CoverLetterExportLayout;
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
    layout: PortfolioExportLayout;
}
export declare const COVER_LETTER_PDF_COLORS: {
    primary: Color;
    accent: Color;
    text: Color;
    muted: Color;
    subtle: Color;
    line: Color;
};
export declare const PORTFOLIO_PDF_COLORS: {
    primary: Color;
    text: Color;
    accent: Color;
    muted: Color;
    subtle: Color;
    featured: Color;
    line: Color;
    footer: Color;
};
export declare const toCoverLetterPdfColors: (template?: string | null) => CoverLetterPdfColors;
export declare const toPortfolioPdfColors: (template?: string | null) => PortfolioPdfColors;
export declare const addA4Page: (pdfDoc: PDFDocument) => PDFPage;
export declare const toPdfColor: (color: RGB) => Color;
export { A4_PAGE_HEIGHT, A4_PAGE_WIDTH };
