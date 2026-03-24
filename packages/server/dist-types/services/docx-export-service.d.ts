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
 * DOCX export service for resumes, cover letters, and portfolios.
 */
export declare class DocxExportService {
    /**
     * Generates a styled DOCX resume document.
     *
     * @param resume Resume data payload.
     * @param templateName Optional template override.
     * @returns DOCX binary buffer.
     */
    exportResumeDocx(resume: ResumeData, templateName?: string): Promise<Uint8Array>;
    /**
     * Generates a styled DOCX cover letter document.
     *
     * @param coverLetter Cover letter data payload.
     * @param userProfile Sender profile for header.
     * @returns DOCX binary buffer.
     */
    exportCoverLetterDocx(coverLetter: CoverLetterPayload, userProfile: CoverLetterUserProfile): Promise<Uint8Array>;
    /**
     * Generates a styled DOCX portfolio document with project showcase.
     *
     * @param metadata Portfolio metadata (title, author, description, etc.).
     * @param projects Portfolio project list.
     * @returns DOCX binary buffer.
     */
    exportPortfolioDocx(metadata: PortfolioMetadata, projects: PortfolioProject[]): Promise<Uint8Array>;
    private buildResumeSections;
    private buildResumeHeaderSection;
    private buildResumeSummarySection;
    private buildResumeExperienceSection;
    private buildResumeEducationSection;
    private buildResumeSkillsSection;
    private buildResumeProjectsSection;
    private buildResumeGamingSection;
    private buildCoverLetterSections;
    private buildCoverLetterHeader;
    private buildCoverLetterRecipientBlock;
    private buildCoverLetterBodyParagraphs;
    private buildCoverLetterSignature;
    private buildResumeHeader;
    private buildExperienceItem;
    private buildEducationItem;
    private buildSkillsSection;
    private buildProjectItem;
    private buildGamingExperienceSection;
    private buildPortfolioCoverPage;
    private buildPortfolioProjectsSection;
    private buildSkillParagraph;
    private buildPortfolioTitleParagraph;
    private buildPortfolioAuthorParagraph;
    private buildPortfolioDescriptionParagraph;
    private buildPortfolioContactParagraph;
    private buildPortfolioProjectsHeading;
    private buildPortfolioProjectParagraphs;
    private buildPortfolioProjectRole;
    private buildPortfolioProjectTechnologies;
    private buildPortfolioProjectTags;
    private buildPortfolioProjectUrls;
    private buildPortfolioFooter;
}
/**
 * Singleton DOCX export service instance.
 */
export declare const docxExportService: DocxExportService;
export {};
