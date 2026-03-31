import Type from "baobox";
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
export declare const chatRouteBodySchema: Type.TObject<{
    readonly message: Type.TString;
    readonly sessionId: Type.TOptional<Type.TString>;
    readonly context: Type.TOptional<Type.TObject<{
        readonly source: Type.TString;
        readonly domain: Type.TOptional<Type.TString>;
        readonly route: Type.TObject<{
            readonly path: Type.TString;
            readonly name: Type.TOptional<Type.TString>;
            readonly params: Type.TRecord<Type.TString, Type.TString>;
            readonly query: Type.TRecord<Type.TString, Type.TString>;
        }, "path" | "params" | "query", never>;
        readonly entity: Type.TOptional<Type.TObject<{
            readonly type: Type.TString;
            readonly id: Type.TString;
            readonly label: Type.TOptional<Type.TString>;
        }, "id" | "type", never>>;
        readonly state: Type.TObject<{
            readonly hasResumes: Type.TBoolean;
            readonly resumeCount: Type.TNumber;
            readonly hasJobs: Type.TBoolean;
            readonly jobCount: Type.TNumber;
            readonly hasStudios: Type.TBoolean;
            readonly studioCount: Type.TNumber;
            readonly hasInterviewSessions: Type.TBoolean;
            readonly interviewSessionCount: Type.TNumber;
            readonly hasPortfolioProjects: Type.TBoolean;
            readonly portfolioProjectCount: Type.TNumber;
        }, "hasResumes" | "resumeCount" | "hasJobs" | "jobCount" | "hasStudios" | "studioCount" | "hasInterviewSessions" | "interviewSessionCount" | "hasPortfolioProjects" | "portfolioProjectCount", never>;
    }, "source" | "route" | "state", never>>;
}, "message", never>;
export declare const analyzeResumeRouteBodySchema: Type.TObject<{
    readonly resumeId: Type.TString;
    readonly jobId: Type.TOptional<Type.TString>;
}, "resumeId", never>;
export declare const generateCoverLetterRouteBodySchema: Type.TObject<{
    readonly resumeId: Type.TString;
    readonly jobId: Type.TOptional<Type.TString>;
    readonly company: Type.TString;
    readonly position: Type.TString;
}, "resumeId" | "company" | "position", never>;
export declare const matchJobsRouteBodySchema: Type.TObject<{
    readonly resumeId: Type.TOptional<Type.TString>;
    readonly skills: Type.TOptional<Type.TArray<Type.TString>>;
    readonly preferences: Type.TOptional<Type.TRecord<Type.TString, Type.TUnion<(Type.TString | Type.TBoolean | Type.TNumber)[]>>>;
}, never, never>;
export declare const automationActionRouteBodySchema: Type.TObject<{
    readonly action: Type.TString;
    readonly jobUrl: Type.TString;
    readonly resumeId: Type.TString;
    readonly coverLetterId: Type.TOptional<Type.TString>;
    readonly jobId: Type.TOptional<Type.TString>;
}, "resumeId" | "jobUrl" | "action", never>;
export declare const usageTailLimit = 10;
