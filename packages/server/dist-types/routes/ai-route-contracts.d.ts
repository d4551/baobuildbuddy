import type { Static } from "typebox";
export type AnalyzeResumeBody = {
    resumeId: string;
    jobId?: string;
};
export type GenerateCoverLetterBody = {
    resumeId: string;
    jobId?: string;
    company: string;
    position: string;
};
export type MatchJobsBody = {
    resumeId?: string;
    skills?: string[];
};
export type MatchJobsResponse = {
    message: string;
    matches: Array<{
        jobId: string;
        title: string;
        company: string;
        location: string | null;
        remote: boolean;
        score: number;
        strengths: string[];
        concerns: string[];
        highlightSkills: string[];
    }>;
    recommendations: string[];
};
export type CoverLetterSections = {
    introduction: string;
    body: string;
    conclusion: string;
};
export type ResumeAnalysisResult = {
    score: number;
    strengths: string[];
    improvements: string[];
    keywords: string[];
};
export declare const chatRouteBodySchema: import("typebox").TObject<{
    message: import("typebox").TString;
    sessionId: import("typebox").TOptional<import("typebox").TString>;
    context: import("typebox").TOptional<import("typebox").TObject<{
        source: import("typebox").TString;
        domain: import("typebox").TOptional<import("typebox").TString>;
        route: import("typebox").TObject<{
            path: import("typebox").TString;
            name: import("typebox").TOptional<import("typebox").TString>;
            params: import("typebox").TRecord<"^.*$", import("typebox").TString>;
            query: import("typebox").TRecord<"^.*$", import("typebox").TString>;
        }>;
        entity: import("typebox").TOptional<import("typebox").TObject<{
            type: import("typebox").TString;
            id: import("typebox").TString;
            label: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        state: import("typebox").TObject<{
            hasResumes: import("typebox").TBoolean;
            resumeCount: import("typebox").TNumber;
            hasJobs: import("typebox").TBoolean;
            jobCount: import("typebox").TNumber;
            hasStudios: import("typebox").TBoolean;
            studioCount: import("typebox").TNumber;
            hasInterviewSessions: import("typebox").TBoolean;
            interviewSessionCount: import("typebox").TNumber;
            hasPortfolioProjects: import("typebox").TBoolean;
            portfolioProjectCount: import("typebox").TNumber;
        }>;
    }>>;
}>;
export type ChatRouteBody = Static<typeof chatRouteBodySchema>;
export declare const analyzeResumeRouteBodySchema: import("typebox").TObject<{
    resumeId: import("typebox").TString;
    jobId: import("typebox").TOptional<import("typebox").TString>;
}>;
export type AnalyzeResumeRouteBody = Static<typeof analyzeResumeRouteBodySchema>;
export declare const generateCoverLetterRouteBodySchema: import("typebox").TObject<{
    resumeId: import("typebox").TString;
    jobId: import("typebox").TOptional<import("typebox").TString>;
    company: import("typebox").TString;
    position: import("typebox").TString;
}>;
export type GenerateCoverLetterRouteBody = Static<typeof generateCoverLetterRouteBodySchema>;
export declare const matchJobsRouteBodySchema: import("typebox").TObject<{
    resumeId: import("typebox").TOptional<import("typebox").TString>;
    skills: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    preferences: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean]>>>;
}>;
export type MatchJobsRouteBody = Static<typeof matchJobsRouteBodySchema>;
export declare const automationActionRouteBodySchema: import("typebox").TObject<{
    action: import("typebox").TString;
    jobUrl: import("typebox").TString;
    resumeId: import("typebox").TString;
    coverLetterId: import("typebox").TOptional<import("typebox").TString>;
    jobId: import("typebox").TOptional<import("typebox").TString>;
}>;
export type AutomationActionRouteBody = Static<typeof automationActionRouteBodySchema>;
export declare const usageTailLimit = 10;
