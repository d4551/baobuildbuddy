import { API_ERROR_COVER_LETTER_INCOMPLETE_CONTENT } from "@bao/shared/constants/api-errors";
export type GeneratedCoverLetterContent = {
    introduction: string;
    body: string;
    conclusion: string;
};
export type CoverLetterSectionName = keyof GeneratedCoverLetterContent;
export type CoverLetterContentError = {
    code: "COVER_LETTER_INCOMPLETE_CONTENT";
    message: typeof API_ERROR_COVER_LETTER_INCOMPLETE_CONTENT;
    missingSections: CoverLetterSectionName[];
    reasons: string[];
};
export type CoverLetterContentResult = {
    success: true;
    data: GeneratedCoverLetterContent;
} | {
    success: false;
    error: CoverLetterContentError;
};
export type ResumePromptContext = {
    promptContext: string;
    summary: string;
    experienceHighlight: string;
    skills: string[];
};
export declare const resolveResumeContext: (resumeId?: string) => Promise<ResumePromptContext>;
export declare const validateGeneratedCoverLetterContent: (content: GeneratedCoverLetterContent) => CoverLetterContentResult;
export declare const toGeneratedCoverLetterContent: (content: string) => GeneratedCoverLetterContent;
