import type { Static } from "typebox";
export declare const authBootstrapBodySchema: import("typebox").TObject<{
    setupToken: import("typebox").TOptional<import("typebox").TString>;
}>;
export type AuthBootstrapBody = Static<typeof authBootstrapBodySchema>;
export declare const authBootstrapBody: import("typebox").TObject<{
    setupToken: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const authStatusResponseSchema: import("typebox").TObject<{
    configured: import("typebox").TBoolean;
    authRequired: import("typebox").TBoolean;
    bootstrapRequired: import("typebox").TBoolean;
    setupTokenConfigured: import("typebox").TBoolean;
}>;
export declare const authConfiguredResponseSchema: import("typebox").TObject<{
    configured: import("typebox").TBoolean;
}>;
export declare const authInitSuccessResponseSchema: import("typebox").TObject<{
    configured: import("typebox").TBoolean;
    apiKey: import("typebox").TOptional<import("typebox").TString>;
    message: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const authStatusResponses: {
    readonly 200: import("typebox").TObject<{
        configured: import("typebox").TBoolean;
        authRequired: import("typebox").TBoolean;
        bootstrapRequired: import("typebox").TBoolean;
        setupTokenConfigured: import("typebox").TBoolean;
    }>;
};
export declare const authConfiguredResponses: {
    readonly 200: import("typebox").TObject<{
        configured: import("typebox").TBoolean;
    }>;
};
export declare const authInitResponses: {
    readonly 200: import("typebox").TObject<{
        configured: import("typebox").TBoolean;
        apiKey: import("typebox").TOptional<import("typebox").TString>;
        message: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 400: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 403: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
