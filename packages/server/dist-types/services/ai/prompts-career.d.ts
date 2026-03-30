/**
 * Email response generation prompt for automation email workflows.
 */
export declare function emailResponsePrompt(subject: string, message: string, tone: "professional" | "friendly" | "concise", sender?: string): string;
/**
 * Job match analysis prompt
 */
export declare function jobMatchPrompt(userProfile: {
    skills: string[];
    experience: string;
    goals: string;
}, job: {
    title: string;
    company: string;
    description: string;
    requirements: string[];
}): string;
/**
 * Skills analysis and mapping prompt
 */
export declare function skillAnalysisPrompt(skills: string[]): string;
/**
 * Portfolio review prompt
 */
export declare function portfolioReviewPrompt(portfolioDescription: string, targetRole: string): string;
/**
 * Company research prompt
 */
export declare function companyResearchPrompt(companyName: string): string;
/**
 * Salary negotiation guidance prompt
 */
export declare function salaryNegotiationPrompt(role: string, level: string, location: string, offer?: number): string;
/**
 * Career transition prompt
 */
export declare function careerTransitionPrompt(currentField: string, targetRole: string, transferableSkills: string[]): string;
/**
 * Portfolio project description generator
 */
export declare function portfolioDescriptionPrompt(title: string, technologies: string[], role: string, outcomes?: string): string;
/**
 * Skill gap analysis prompt
 */
export declare function skillGapPrompt(userSkills: string[], targetRole: string, targetCompany?: string): string;
/**
 * Skill categorization prompt for gaming-to-career mapping
 */
export declare function skillCategorizePrompt(gamingExperiences: string[]): string;
