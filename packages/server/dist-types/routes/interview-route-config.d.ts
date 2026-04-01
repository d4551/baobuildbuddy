import type { CreateSessionConfigInput, SubmitResponseBody } from "./interview-route-contracts";
export declare const sessionConfigFromUi: (config: CreateSessionConfigInput) => CreateSessionConfigInput;
export declare const parseResponsePayload: (body: SubmitResponseBody) => {
    questionId: string;
    questionIndex: number | undefined;
    response: string;
} | null;
