import type { EntityPromptContext } from "../services/ai/prompt-context-loader";
import type { CoverLetterSections, ResumeAnalysisResult } from "./ai-route-contracts";
export interface ResumeRecord {
    personalInfo?: Record<string, unknown> | null;
    summary?: string | null;
    experience?: unknown[] | null;
    education?: unknown[] | null;
    skills?: Record<string, unknown> | null;
    projects?: unknown[] | null;
    gamingExperience?: Record<string, unknown> | null;
}
export declare function serializeResume(resume: ResumeRecord): string;
export declare const buildAnalyzeResumePrompt: (resumeText: string, jobDescription: string) => string;
export declare const buildCoverLetterPrompt: (company: string, position: string, jobDescription: string, resumeText: string, entityContext?: EntityPromptContext) => string;
export declare const resolveAnalyzeResumeJobDescription: (jobId?: string) => Promise<string>;
export declare const resolveCoverLetterJobDescription: (jobId?: string) => Promise<string>;
export declare const parseResumeAnalysisResult: (content: string) => ResumeAnalysisResult;
export declare const parseCoverLetterSections: (content: string) => CoverLetterSections;
export declare const extractResumeSkills: (resume: Pick<ResumeRecord, "skills">) => string[];
