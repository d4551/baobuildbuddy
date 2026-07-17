import type { Static } from "typebox";
export declare const automationScreenshotParamsSchema: import("typebox").TObject<{
    runId: import("typebox").TString;
    index: import("typebox").TString;
}>;
export type AutomationScreenshotParams = Static<typeof automationScreenshotParamsSchema>;
export declare const automationScreenshotParams: import("typebox").TObject<{
    runId: import("typebox").TString;
    index: import("typebox").TString;
}>;
export declare const automationScreenshotResponses: {
    readonly 200: import("typebox").TUnknown;
    readonly 400: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
