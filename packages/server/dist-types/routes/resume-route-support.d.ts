import type { ResumeData } from "@bao/shared/types/resume";
import type { JsonObject } from "@bao/shared/utils/json";
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
type ResumeEnhanceSuggestion = {
    text: string;
    section: string;
};
export declare const enhanceResumeWithAi: (resumeId: string, body: ResumeEnhanceBody, set: ResumeRouteSetState) => Promise<{
    error: string;
    resume?: undefined;
    suggestions?: undefined;
    section?: undefined;
} | {
    error?: undefined;
    resume: ResumeData;
    suggestions: ResumeEnhanceSuggestion[];
    section: string;
}>;
export declare const handleResumeAiScore: (resumeId: string, body: ResumeScoreBody, set: ResumeRouteSetState) => Promise<{
    error: string;
    resumeId?: undefined;
    jobId?: undefined;
    score?: undefined;
    strengths?: undefined;
    improvements?: undefined;
    keywords?: undefined;
    analysis?: undefined;
} | {
    error?: undefined;
    resumeId: string;
    jobId: string;
    score: number;
    strengths: string[];
    improvements: string[];
    keywords: string[];
    analysis: JsonObject;
}>;
export {};
