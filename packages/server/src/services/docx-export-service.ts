import type { PortfolioMetadata, PortfolioProject } from "@bao/shared/types/portfolio";
import type { ResumeData } from "@bao/shared/types/resume";
import type { CoverLetterPayload, CoverLetterUserProfile } from "./export-service-contracts";
import { exportCoverLetterDocxDocument } from "./docx-export-cover-letter";
import { exportPortfolioDocxDocument } from "./docx-export-portfolio";
import { exportResumeDocxDocument } from "./docx-export-resume";

/**
 * DOCX export service for resumes, cover letters, and portfolios.
 */
export class DocxExportService {
  async exportResumeDocx(resume: ResumeData, templateName?: string): Promise<Uint8Array> {
    return exportResumeDocxDocument(resume, templateName);
  }

  async exportCoverLetterDocx(
    coverLetter: CoverLetterPayload,
    userProfile: CoverLetterUserProfile,
  ): Promise<Uint8Array> {
    return exportCoverLetterDocxDocument(coverLetter, userProfile);
  }

  async exportPortfolioDocx(
    metadata: PortfolioMetadata,
    projects: PortfolioProject[],
    template?: string,
  ): Promise<Uint8Array> {
    return exportPortfolioDocxDocument(metadata, projects, template);
  }
}

/**
 * Singleton DOCX export service instance.
 */
export const docxExportService = new DocxExportService();
