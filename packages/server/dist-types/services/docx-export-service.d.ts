import type { PortfolioMetadata, PortfolioProject } from "@bao/shared/types/portfolio";
import type { ResumeData } from "@bao/shared/types/resume";
import type { CoverLetterPayload, CoverLetterUserProfile } from "./export-service-contracts";
/**
 * DOCX export service for resumes, cover letters, and portfolios.
 */
export declare class DocxExportService {
    exportResumeDocx(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
    exportCoverLetterDocx(coverLetter: CoverLetterPayload, userProfile: CoverLetterUserProfile): Promise<Uint8Array>;
    exportPortfolioDocx(metadata: PortfolioMetadata, projects: PortfolioProject[], template?: string): Promise<Uint8Array>;
}
/**
 * Singleton DOCX export service instance.
 */
export declare const docxExportService: DocxExportService;
