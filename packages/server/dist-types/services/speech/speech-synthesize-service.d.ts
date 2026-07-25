import { type SpeechProviderOption } from "@bao/shared/constants/settings";
export type SpeechSynthesizeInput = {
    readonly text: string;
    readonly voice?: string;
};
export type SpeechSynthesizeResult = {
    readonly ok: true;
    readonly audioBase64: string;
    readonly mimeType: "audio/wav";
    readonly provider: SpeechProviderOption;
    readonly model: string;
    readonly voice: string;
    readonly bytes: number;
} | {
    readonly ok: false;
    readonly error: string;
    readonly status: 400 | 422 | 502;
};
/**
 * Synthesize speech via local Kokoro OpenAI-compatible TTS (on-device neural).
 * Cloud OpenAI/HF TTS paths are intentionally not used.
 */
export declare const synthesizeSpeechAudio: (input: SpeechSynthesizeInput) => Promise<SpeechSynthesizeResult>;
