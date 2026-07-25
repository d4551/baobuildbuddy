import type { PortfolioMetadata, PortfolioProject } from "@bao/shared/types/portfolio";
import type { ResumeData } from "@bao/shared/types/resume";
import type { CoverLetterPayload, CoverLetterUserProfile } from "./export-service-contracts";
import { exportCoverLetterPdf } from "./export-service-cover-letter";
import { exportPortfolioPdf } from "./export-service-portfolio";
import { exportResumePdf, optimizeResumePdfForOnePage } from "./export-service-resume";

/**
 * PDF export service for resumes, cover letters, and portfolios.
 */
export class ExportService {
  async exportResumePDF(resume: ResumeData, templateName?: string): Promise<Uint8Array> {
    return exportResumePdf(resume, templateName);
  }

  async optimizeForOnePage(resume: ResumeData, templateName?: string): Promise<Uint8Array> {
    return optimizeResumePdfForOnePage(resume, templateName);
  }

  async exportCoverLetterPDF(
    coverLetter: CoverLetterPayload,
    userProfile: CoverLetterUserProfile,
  ): Promise<Uint8Array> {
    return exportCoverLetterPdf(coverLetter, userProfile);
  }

  async exportPortfolioPDF(
    metadata: PortfolioMetadata,
    projects: PortfolioProject[],
    template?: string | null,
  ): Promise<Uint8Array> {
    return exportPortfolioPdf(metadata, projects, template);
  }
}

export const exportService = new ExportService();
