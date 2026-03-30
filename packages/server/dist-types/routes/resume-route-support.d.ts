import { type ResumeData } from "@bao/shared";
import type { ResumeEnhanceBody, ResumeExportBody, ResumeMutationBody, ResumeRouteSetState, ResumeScoreBody } from "./resume-route-contracts";
export declare const buildResumeCreatePayload: (body: ResumeMutationBody) => Omit<ResumeData, "id">;
export declare const buildResumeUpdatePayload: (body: ResumeMutationBody) => Partial<ResumeData>;
export declare const exportResumeAsset: (resumeId: string, body: ResumeExportBody, set: ResumeRouteSetState) => Promise<Response | {
    error: string;
    details?: undefined;
} | {
    error: string;
    details: string;
}>;
export declare const enhanceResumeWithAi: (resumeId: string, body: ResumeEnhanceBody, set: ResumeRouteSetState) => Promise<{
    error: string;
    details?: undefined;
    resume?: undefined;
    suggestions?: undefined;
    section?: undefined;
} | {
    error: string;
    details: string;
    resume?: undefined;
    suggestions?: undefined;
    section?: undefined;
} | {
    resume: ResumeData;
    suggestions: import("@bao/shared").JsonArray;
    section: string;
    error?: undefined;
    details?: undefined;
}>;
export declare const handleResumeAiScore: (resumeId: string, body: ResumeScoreBody, set: ResumeRouteSetState) => Promise<{
    error: string;
    details?: undefined;
    resumeId?: undefined;
    jobId?: undefined;
    score?: undefined;
    strengths?: undefined;
    improvements?: undefined;
    keywords?: undefined;
    analysis?: undefined;
} | {
    error: string;
    details: string;
    resumeId?: undefined;
    jobId?: undefined;
    score?: undefined;
    strengths?: undefined;
    improvements?: undefined;
    keywords?: undefined;
    analysis?: undefined;
} | {
    resumeId: string;
    jobId: string;
    score: number;
    strengths: string[];
    improvements: string[];
    keywords: string[];
    analysis: Record<string, unknown>;
    error?: undefined;
    details?: undefined;
}>;
