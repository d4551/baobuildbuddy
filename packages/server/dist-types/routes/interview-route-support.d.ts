import type { InterviewSession } from "@bao/shared";
import type { CreateSessionConfigInput, SessionPayload, SubmitResponseBody } from "./interview-route-contracts";
export declare const sessionConfigFromUi: (config: CreateSessionConfigInput) => CreateSessionConfigInput;
export declare const sessionWithDerivedFields: (session: InterviewSession) => Promise<SessionPayload>;
export declare const createInterviewSession: (studioId: string | undefined, config: CreateSessionConfigInput | undefined) => Promise<{
    status: number;
    body: {
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
    body: SessionPayload;
}>;
export declare const submitInterviewResponse: (id: string, body: SubmitResponseBody) => Promise<{
    status: number;
    body: {
        error: string;
    };
} | {
    status: null;
    body: {
        message: string;
        error?: undefined;
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
        message: string;
        error?: undefined;
    };
}>;
