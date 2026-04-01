import type { CreateSessionConfigInput } from "../routes/interview-route-contracts";
type InterviewSocket = {
    send: (data: string) => void;
};
type InterviewMessage = {
    type: string;
    sessionId?: string;
    content?: string;
    studioId?: string;
    config?: CreateSessionConfigInput;
};
export declare function handleStartSession(socket: InterviewSocket, data: InterviewMessage): Promise<void>;
export declare function handleSubmitResponse(socket: InterviewSocket, data: InterviewMessage): Promise<void>;
export declare function handleEndSession(socket: InterviewSocket, data: InterviewMessage): Promise<void>;
export {};
