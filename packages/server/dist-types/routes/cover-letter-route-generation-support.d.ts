import type { GenerateCoverLetterBody } from "./cover-letter-route-contracts";
export type GeneratedCoverLetterContent = {
    introduction: string;
    body: string;
    conclusion: string;
};
export type ResumePromptContext = {
    promptContext: string;
    summary: string;
    experienceHighlight: string;
    skills: string[];
};
export declare const resolveResumeContext: (resumeId?: string) => Promise<ResumePromptContext>;
export declare const ensureCompleteCoverLetterContent: (content: GeneratedCoverLetterContent, body: GenerateCoverLetterBody, resumeContext: ResumePromptContext) => GeneratedCoverLetterContent;
export declare const toGeneratedCoverLetterContent: (content: string) => GeneratedCoverLetterContent;
