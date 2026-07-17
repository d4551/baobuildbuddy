import { type ChatContextPayload } from "./ai-route-chat-context";
import type { AnalyzeResumeBody, GenerateCoverLetterBody } from "./ai-route-contracts";
export declare const handleChatRoute: (body: {
    message: string;
    sessionId?: string;
    context?: ChatContextPayload;
}) => Promise<{
    status: 200;
    body: {
        message: string;
        sessionId: string | null | undefined;
        timestamp: string;
        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
        model: string;
        followUps: string[];
        contextDomain: "automation" | "general" | "interview" | "job_search" | "portfolio" | "resume" | "skills";
    };
} | {
    status: 500;
    body: {
        error: string;
    };
}>;
export declare const handleAnalyzeResumeRoute: (body: AnalyzeResumeBody) => Promise<{
    status: 200;
    body: {
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
    };
} | {
    status: 404;
    body: {
        error: string;
    };
} | {
    status: 500;
    body: {
        error: string;
    };
}>;
export declare const handleGenerateCoverLetterRoute: (body: GenerateCoverLetterBody) => Promise<{
    status: 200;
    body: {
        message: string;
        content: {
            introduction: string;
            body: string;
            conclusion: string;
        };
        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
        model: string;
    };
} | {
    status: 404;
    body: {
        error: string;
    };
} | {
    status: 500;
    body: {
        error: string;
    };
}>;
export declare const handleMatchJobsRoute: (body: {
    resumeId?: string;
    skills?: string[];
}) => Promise<{
    status: 200;
    body: {
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
    };
} | {
    status: 500;
    body: {
        error: string;
    };
}>;
