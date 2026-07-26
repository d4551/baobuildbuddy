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
