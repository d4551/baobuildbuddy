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
    technologies?: string[];
    enrichment?: {
        summary?: string;
        hiringSignals?: string[];
        interviewFocusAreas?: string[];
        candidatePitchAngles?: string[];
    };
}): string;
/**
 * Skills analysis and mapping prompt
 */
export declare function skillAnalysisPrompt(skills: string[]): string;
