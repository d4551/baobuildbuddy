import { type PortfolioMetadata, type PortfolioProject, type ResumeData } from "@bao/shared";
interface CoverLetterPayload {
    company: string;
    position: string;
    content: unknown;
}
interface CoverLetterUserProfile {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
}
/**
 * PDF export service for resumes, cover letters, and portfolios.
 */
export declare class ExportService {
    private addA4Page;
    private toPdfColor;
    private applyResumeBackground;
    private ensureResumeSpace;
    private drawResumeWrappedLine;
    private drawResumeWrappedText;
    private createResumeContext;
    private renderResumeSectionHeader;
    private renderResumeName;
    private renderResumeContact;
    private renderResumeLinks;
    private renderResumeDivider;
    private renderResumeHeader;
    private renderResumeSummary;
    private renderResumeExperienceDate;
    private renderResumeExperienceDescription;
    private renderResumeExperienceAchievements;
    private renderResumeExperienceTechnologies;
    private renderResumeExperienceItem;
    private renderResumeExperience;
    private renderResumeEducationItem;
    private renderResumeEducation;
    private renderResumeSkillGroup;
    private renderResumeInlineSkills;
    private renderResumeGroupedSkills;
    private renderResumeColumnSkills;
    private renderResumeSkills;
    private renderResumeProjectLinks;
    private renderResumeProjectTechnologies;
    private renderResumeProjectItem;
    private renderResumeProjects;
    private renderResumeGamingExperience;
    /**
     * Export resume as PDF.
     */
    exportResumePDF(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
    private createCoverLetterContext;
    private ensureCoverLetterSpace;
    private renderCoverLetterSender;
    private renderCoverLetterDate;
    private renderCoverLetterRecipient;
    private drawCoverLetterLine;
    private drawCoverLetterParagraph;
    private renderCoverLetterBody;
    private renderCoverLetterClosing;
    /**
     * Export cover letter as PDF.
     */
    exportCoverLetterPDF(coverLetter: CoverLetterPayload, userProfile: CoverLetterUserProfile): Promise<Uint8Array>;
    /**
     * Optimize resume to fit on one page.
     */
    optimizeForOnePage(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
    private createPortfolioContext;
    private ensurePortfolioSpace;
    private drawPortfolioWrappedLine;
    private drawPortfolioWrappedText;
    private renderPortfolioSocialLinks;
    private renderPortfolioCoverPage;
    private startPortfolioProjectsSection;
    private renderPortfolioProjectHeading;
    private renderPortfolioProjectRole;
    private renderPortfolioProjectTechnologies;
    private renderPortfolioTechnicalDetails;
    private renderPortfolioProjectLinks;
    private renderPortfolioProjectTags;
    private renderPortfolioProjectSeparator;
    private renderPortfolioProject;
    private addPortfolioPageNumbers;
    /**
     * Export portfolio as PDF.
     */
    exportPortfolioPDF(metadata: PortfolioMetadata, projects: PortfolioProject[]): Promise<Uint8Array>;
}
export declare const exportService: ExportService;
export {};
