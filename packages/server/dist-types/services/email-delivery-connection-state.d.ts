import { createServerLogger } from "../utils/logger";
import { type SmtpResponse } from "./email-delivery-contracts";
export interface PendingResponseReader {
    reject: (reason?: Error | string) => void;
    resolve: (response: SmtpResponse) => void;
}
export interface PendingDrainReader {
    reject: (reason?: Error | string) => void;
    resolve: () => void;
}
export interface PendingTlsUpgrade {
    reject: (reason?: Error | string) => void;
    resolve: () => void;
}
export interface SmtpConnectionState {
    decoder: TextDecoder;
    encoder: TextEncoder;
    queuedResponses: SmtpResponse[];
    pendingReaders: PendingResponseReader[];
    logger: ReturnType<typeof createServerLogger>;
    currentResponse: SmtpResponse | null;
    buffer: string;
    socket: Bun.Socket<undefined> | null;
    pendingDrain: PendingDrainReader | null;
    pendingTlsUpgrade: PendingTlsUpgrade | null;
    closed: boolean;
}
export declare const createSmtpConnectionState: () => SmtpConnectionState;
export declare const readResponse: (state: SmtpConnectionState) => Promise<SmtpResponse>;
export declare const handleData: (state: SmtpConnectionState, data: Uint8Array) => void;
export declare const handleClose: (state: SmtpConnectionState, error?: Error) => void;
export declare const handleHandshake: (state: SmtpConnectionState, success: boolean, authorizationError: Error | null) => void;
export declare const resolvePendingDrain: (state: SmtpConnectionState) => void;
export declare const rejectAllPending: (state: SmtpConnectionState, reason: Error | string) => void;
export declare const assertExpectedCode: (response: SmtpResponse, expectedCodes: readonly number[], context: string) => void;
export declare const assertSocket: (state: SmtpConnectionState) => Bun.Socket<undefined>;
