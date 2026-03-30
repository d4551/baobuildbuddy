import type { PortfolioMetadata, PortfolioProject, ResumeData } from "@bao/shared";
import type { CoverLetterPayload, CoverLetterUserProfile } from "./docx-export-contracts";
/**
 * DOCX export service for resumes, cover letters, and portfolios.
 */
export declare class DocxExportService {
    exportResumeDocx(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
    exportCoverLetterDocx(coverLetter: CoverLetterPayload, userProfile: CoverLetterUserProfile): Promise<Uint8Array>;
    exportPortfolioDocx(metadata: PortfolioMetadata, projects: PortfolioProject[]): Promise<Uint8Array>;
}
/**
 * Singleton DOCX export service instance.
 */
export declare const docxExportService: DocxExportService;
