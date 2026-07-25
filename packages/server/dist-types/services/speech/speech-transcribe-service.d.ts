import type { SpeechProviderOption } from "@bao/shared/constants/settings";
export type SpeechTranscribeInput = {
    readonly audioBase64: string;
    readonly mimeType: string;
    readonly filename?: string;
};
export type SpeechTranscribeResult = {
    readonly ok: true;
    readonly text: string;
    readonly provider: SpeechProviderOption;
    readonly model: string;
} | {
    readonly ok: false;
    readonly error: string;
    readonly status: 400 | 422 | 502;
};
export declare const transcribeSpeechAudio: (input: SpeechTranscribeInput) => Promise<SpeechTranscribeResult>;
