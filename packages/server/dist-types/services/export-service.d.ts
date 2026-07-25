import type { PortfolioMetadata, PortfolioProject } from "@bao/shared/types/portfolio";
import type { ResumeData } from "@bao/shared/types/resume";
import type { CoverLetterPayload, CoverLetterUserProfile } from "./export-service-contracts";
/**
 * PDF export service for resumes, cover letters, and portfolios.
 */
export declare class ExportService {
    exportResumePDF(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
    optimizeForOnePage(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
    exportCoverLetterPDF(coverLetter: CoverLetterPayload, userProfile: CoverLetterUserProfile): Promise<Uint8Array>;
    exportPortfolioPDF(metadata: PortfolioMetadata, projects: PortfolioProject[], template?: string | null): Promise<Uint8Array>;
}
export declare const exportService: ExportService;
