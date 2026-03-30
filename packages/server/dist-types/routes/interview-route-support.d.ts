import type { CreateSessionConfigInput, SubmitResponseBody } from "./interview-route-contracts";
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
