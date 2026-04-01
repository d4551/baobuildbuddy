import { type ChatContextPayload } from "./ai-route-chat-context";
import type { AnalyzeResumeBody, GenerateCoverLetterBody, RouteSetState } from "./ai-route-contracts";
export declare const handleChatRoute: (body: {
    message: string;
    sessionId?: string;
    context?: ChatContextPayload;
}, set: RouteSetState) => Promise<{
    message: string;
    sessionId: string | null | undefined;
    timestamp: string;
    provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
    model: string;
    followUps: string[];
    contextDomain: "resume" | "job_search" | "interview" | "portfolio" | "skills" | "automation" | "general";
} | {
    error: string;
}>;
export declare const handleAnalyzeResumeRoute: (body: AnalyzeResumeBody, set: RouteSetState) => Promise<{
    error: string;
    message?: undefined;
    resumeId?: undefined;
    jobId?: undefined;
    analysis?: undefined;
    provider?: undefined;
    model?: undefined;
} | {
    message: string;
    resumeId: string;
    jobId: string | null;
    analysis: import("./ai-route-contracts").ResumeAnalysisResult;
    provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
    model: string;
    error?: undefined;
}>;
export declare const handleGenerateCoverLetterRoute: (body: GenerateCoverLetterBody, set: RouteSetState) => Promise<{
    error: string;
    message?: undefined;
    content?: undefined;
    provider?: undefined;
    model?: undefined;
} | {
    message: string;
    content: import("./ai-route-contracts").CoverLetterSections;
    provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
    model: string;
    error?: undefined;
}>;
export declare const handleMatchJobsRoute: (body: {
    resumeId?: string;
    skills?: string[];
}, set: RouteSetState) => Promise<import("./ai-route-contracts").MatchJobsResponse | {
    error: string;
}>;
