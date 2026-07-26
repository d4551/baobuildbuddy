import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_NOT_FOUND, HTTP_STATUS_OK } from "@bao/shared/constants/http";
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
    status: typeof HTTP_STATUS_NOT_FOUND;
    body: {
        error: string;
    };
} | {
    status: typeof HTTP_STATUS_OK;
    body: import("./interview-route-contracts").SessionPayload;
}>;
export declare const submitInterviewResponse: (id: string, body: SubmitResponseBody) => Promise<{
    status: typeof HTTP_STATUS_NOT_FOUND;
    body: {
        error: string;
    };
} | {
    status: typeof HTTP_STATUS_BAD_REQUEST;
    body: {
        error: string;
    };
} | {
    status: typeof HTTP_STATUS_OK;
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
        error?: undefined;
        message: string;
    };
}>;
export declare const completeInterviewSession: (id: string) => Promise<{
    status: typeof HTTP_STATUS_NOT_FOUND;
    body: {
        error: string;
    };
} | {
    status: typeof HTTP_STATUS_OK;
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
        error?: undefined;
        message: string;
    };
}>;
