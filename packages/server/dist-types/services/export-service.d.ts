import type { PortfolioMetadata, PortfolioProject, ResumeData } from "@bao/shared";
import type { CoverLetterPayload, CoverLetterUserProfile } from "./export-service-contracts";
/**
 * PDF export service for resumes, cover letters, and portfolios.
 */
export declare class ExportService {
    exportResumePDF(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
    optimizeForOnePage(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
    exportCoverLetterPDF(coverLetter: CoverLetterPayload, userProfile: CoverLetterUserProfile): Promise<Uint8Array>;
    exportPortfolioPDF(metadata: PortfolioMetadata, projects: PortfolioProject[]): Promise<Uint8Array>;
}
export declare const exportService: ExportService;
