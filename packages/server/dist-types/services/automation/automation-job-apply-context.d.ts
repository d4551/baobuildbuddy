/**
 * Extra candidate context the smart-field mapper reads alongside the resume so
 * the AI can pre-fill ATS fields the resume's `personalInfo` does not cover
 * (LinkedIn, GitHub, portfolio URL, work authorization signals from the job
 * posting, etc.). Previously `jobId` was accepted by the apply route and stored
 * on the run row but never loaded, so the mapper was blind to the scraped job
 * and to the user's profile/portfolio/skill-mapping data even when present.
 */
export interface JobApplyCandidateContext {
    readonly jobContext?: string;
    readonly studioContext?: string;
    readonly skillContext?: string;
    readonly profileContext?: string;
    readonly portfolioContext?: string;
}
export declare const loadJobApplyCandidateContext: (jobId?: string) => Promise<JobApplyCandidateContext>;
