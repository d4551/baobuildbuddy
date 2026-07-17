import type { InterviewResponse } from "@bao/shared/types/interview";
import type { CreateSessionConfigInput, SubmitResponseBody } from "./interview-route-contracts";
export declare const createInterviewSession: (studioId: string | undefined, config: CreateSessionConfigInput | undefined) => Promise<{
    status: number;
    body: {
        id: string;
        studioId: string;
        config: import("@bao/shared/types/interview").InterviewConfig;
        questions: import("@bao/shared/types/interview").InterviewQuestion[];
        currentQuestionIndex: number;
        totalQuestions: number;
        startTime: number;
        endTime?: number;
        status: "preparing" | "active" | "paused" | "completed" | "cancelled";
        responses: InterviewResponse[];
        finalAnalysis?: import("@bao/shared/types/interview").InterviewAnalysis;
        interviewerPersona?: import("@bao/shared/types/interview").InterviewerPersona;
        role?: string;
        studioName?: string;
        score?: number;
        duration?: string;
        overallFeedback?: string;
        totalResponses?: number;
        createdAt?: string;
        updatedAt?: string;
        message: string;
    };
}>;
export declare const getInterviewSession: (id: string) => Promise<{
    status: number;
    body: {
        error: string;
    };
} | {
    status: null;
    body: import("./interview-route-contracts").SessionPayload;
}>;
export declare const submitInterviewResponse: (id: string, body: SubmitResponseBody) => Promise<{
    status: number;
    body: {
        error: string;
    };
} | {
    status: null;
    body: {
        error?: undefined;
        id: string;
        studioId: string;
        config: import("@bao/shared/types/interview").InterviewConfig;
        questions: import("@bao/shared/types/interview").InterviewQuestion[];
        currentQuestionIndex: number;
        totalQuestions: number;
        startTime: number;
        endTime?: number;
        status: "preparing" | "active" | "paused" | "completed" | "cancelled";
        responses: InterviewResponse[];
        finalAnalysis?: import("@bao/shared/types/interview").InterviewAnalysis;
        interviewerPersona?: import("@bao/shared/types/interview").InterviewerPersona;
        role?: string;
        studioName?: string;
        score?: number;
        duration?: string;
        overallFeedback?: string;
        totalResponses?: number;
        createdAt?: string;
        updatedAt?: string;
        message: string;
    };
}>;
export declare const completeInterviewSession: (id: string) => Promise<{
    status: number;
    body: {
        error: string;
    };
} | {
    status: null;
    body: {
        error?: undefined;
        id: string;
        studioId: string;
        config: import("@bao/shared/types/interview").InterviewConfig;
        questions: import("@bao/shared/types/interview").InterviewQuestion[];
        currentQuestionIndex: number;
        totalQuestions: number;
        startTime: number;
        endTime?: number;
        status: "preparing" | "active" | "paused" | "completed" | "cancelled";
        responses: InterviewResponse[];
        finalAnalysis?: import("@bao/shared/types/interview").InterviewAnalysis;
        interviewerPersona?: import("@bao/shared/types/interview").InterviewerPersona;
        role?: string;
        studioName?: string;
        score?: number;
        duration?: string;
        overallFeedback?: string;
        totalResponses?: number;
        createdAt?: string;
        updatedAt?: string;
        message: string;
    };
}>;
