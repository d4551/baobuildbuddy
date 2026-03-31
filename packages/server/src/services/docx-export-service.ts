import type { PortfolioMetadata, PortfolioProject, ResumeData } from "@bao/shared";
import type { CoverLetterPayload, CoverLetterUserProfile } from "./docx-export-contracts";
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
  ): Promise<Uint8Array> {
    return exportPortfolioDocxDocument(metadata, projects);
  }
}

/**
 * Singleton DOCX export service instance.
 */
export const docxExportService = new DocxExportService();
