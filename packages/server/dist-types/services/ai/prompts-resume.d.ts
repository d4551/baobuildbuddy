/**
 * Resume enhancement prompt
 */
export declare function resumeEnhancePrompt(resume: string, jobDescription?: string): string;
/**
 * Resume scoring prompt
 */
export declare function resumeScorePrompt(resume: string, jobDescription: string): string;
/**
 * Cover letter generation prompt
 */
export declare function coverLetterPrompt(company: string, position: string, jobInfo: string, resumeContext: string): string;
/**
 * Resume bullet quantification prompt
 */
export declare function resumeQuantifyPrompt(bulletPoint: string, sectionType: string, jobContext?: string): string;
/**
 * Cover letter customization for company culture
 */
export declare function coverLetterCustomizePrompt(template: string, company: string, culture: string[], relevantExperience: string): string;
