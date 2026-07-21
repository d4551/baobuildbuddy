export declare const speechTranscribeBodySchema: import("typebox").TObject<{
    audioBase64: import("typebox").TString;
    mimeType: import("typebox").TString;
    filename: import("typebox").TOptional<import("typebox").TString>;
}>;
export type SpeechTranscribeBody = {
    audioBase64: string;
    mimeType: string;
    filename?: string;
};
export declare const speechTranscribeResponses: {
    200: import("typebox").TObject<{
        text: import("typebox").TString;
        provider: import("typebox").TString;
        model: import("typebox").TString;
        message: import("typebox").TString;
    }>;
    400: import("typebox").TObject<{
        error: import("typebox").TString;
    }>;
    422: import("typebox").TObject<{
        error: import("typebox").TString;
    }>;
    502: import("typebox").TObject<{
        error: import("typebox").TString;
    }>;
};
