import { type PortfolioMetadata, type PortfolioProject, type ResumeData } from "@bao/shared";
export declare class ExportService {
    private resolveTemplate;
    /**
     * Export resume as PDF
     */
    exportResumePDF(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
    /**
     * Export cover letter as PDF
     */
    exportCoverLetterPDF(coverLetter: {
        company: string;
        position: string;
        content: Record<string, unknown>;
    }, userProfile: {
        name: string;
        email?: string;
        phone?: string;
        location?: string;
    }): Promise<Uint8Array>;
    /**
     * Optimize resume to fit on one page
     */
    optimizeForOnePage(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
    /**
     * Export portfolio as PDF
     */
    exportPortfolioPDF(metadata: PortfolioMetadata, projects: PortfolioProject[]): Promise<Uint8Array>;
}
export declare const exportService: ExportService;
