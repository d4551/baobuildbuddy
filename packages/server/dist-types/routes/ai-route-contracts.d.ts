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
export type RouteSetState = {
    status?: number | string;
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
export declare const chatRouteBodySchema: import("@sinclair/typebox").TObject<{
    message: import("@sinclair/typebox").TString;
    sessionId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    context: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        source: import("@sinclair/typebox").TString;
        domain: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        route: import("@sinclair/typebox").TObject<{
            path: import("@sinclair/typebox").TString;
            name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            params: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
            query: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
        }>;
        entity: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TString;
            id: import("@sinclair/typebox").TString;
            label: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        state: import("@sinclair/typebox").TObject<{
            hasResumes: import("@sinclair/typebox").TBoolean;
            resumeCount: import("@sinclair/typebox").TNumber;
            hasJobs: import("@sinclair/typebox").TBoolean;
            jobCount: import("@sinclair/typebox").TNumber;
            hasStudios: import("@sinclair/typebox").TBoolean;
            studioCount: import("@sinclair/typebox").TNumber;
            hasInterviewSessions: import("@sinclair/typebox").TBoolean;
            interviewSessionCount: import("@sinclair/typebox").TNumber;
            hasPortfolioProjects: import("@sinclair/typebox").TBoolean;
            portfolioProjectCount: import("@sinclair/typebox").TNumber;
        }>;
    }>>;
}>;
export declare const analyzeResumeRouteBodySchema: import("@sinclair/typebox").TObject<{
    resumeId: import("@sinclair/typebox").TString;
    jobId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const generateCoverLetterRouteBodySchema: import("@sinclair/typebox").TObject<{
    resumeId: import("@sinclair/typebox").TString;
    jobId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    company: import("@sinclair/typebox").TString;
    position: import("@sinclair/typebox").TString;
}>;
export declare const matchJobsRouteBodySchema: import("@sinclair/typebox").TObject<{
    resumeId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    skills: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    preferences: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean]>>>;
}>;
export declare const automationActionRouteBodySchema: import("@sinclair/typebox").TObject<{
    action: import("@sinclair/typebox").TString;
    jobUrl: import("@sinclair/typebox").TString;
    resumeId: import("@sinclair/typebox").TString;
    coverLetterId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    jobId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const usageTailLimit = 10;
