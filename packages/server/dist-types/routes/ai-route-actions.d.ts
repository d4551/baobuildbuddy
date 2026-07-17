import type { RouteSetState } from "../types/route-state";
import { type ChatContextPayload } from "./ai-route-chat-context";
import type { AnalyzeResumeBody, GenerateCoverLetterBody } from "./ai-route-contracts";
export declare const handleChatRoute: (body: {
    message: string;
    sessionId?: string;
    context?: ChatContextPayload;
}, set: RouteSetState) => Promise<{
    message: string;
    sessionId: string | null | undefined;
    timestamp: string;
    provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
    model: string;
    followUps: string[];
    contextDomain: "automation" | "general" | "interview" | "job_search" | "portfolio" | "resume" | "skills";
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
    error?: undefined;
    message: string;
    resumeId: string;
    jobId: string | null;
    analysis: {
        score: number;
        strengths: string[];
        improvements: string[];
        keywords: string[];
    };
    provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
    model: string;
}>;
export declare const handleGenerateCoverLetterRoute: (body: GenerateCoverLetterBody, set: RouteSetState) => Promise<{
    message?: undefined;
    provider?: undefined;
    model?: undefined;
    error: string;
    content?: undefined;
} | {
    error?: undefined;
    message: string;
    content: {
        introduction: string;
        body: string;
        conclusion: string;
    };
    provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
    model: string;
}>;
export declare const handleMatchJobsRoute: (body: {
    resumeId?: string;
    skills?: string[];
}, set: RouteSetState) => Promise<{
    message: string;
    matches: {
        jobId: string;
        title: string;
        company: string;
        location: string | null;
        remote: boolean;
        score: number;
        strengths: string[];
        concerns: string[];
        highlightSkills: string[];
    }[];
    recommendations: string[];
} | {
    error: string;
}>;
