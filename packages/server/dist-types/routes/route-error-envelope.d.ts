/**
 * Canonical HTTP route error body (baobox SSOT for API error envelopes).
 * Matches automation route error shape used across handlers.
 */
export declare const routeErrorBodySchema: import("typebox").TObject<{
    error: import("typebox").TObject<{
        code: import("typebox").TString;
        message: import("typebox").TString;
        details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    }>;
}>;
/**
 * Simple `{ error, code?, fields? }` envelope used by global error handler / app model.
 */
export declare const simpleErrorBodySchema: import("typebox").TObject<{
    error: import("typebox").TString;
    code: import("typebox").TOptional<import("typebox").TString>;
    fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
}>;
export declare const simpleErrorResponseSchema: import("typebox").TObject<{
    error: import("typebox").TString;
    code: import("typebox").TOptional<import("typebox").TString>;
    fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
}>;
/**
 * Standard error status map for routes that return the nested automation-style envelope.
 */
export declare const nestedRouteErrorResponses: {
    readonly 400: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 409: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 422: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
};
/**
 * Standard error status map for routes that return the simple `{ error }` envelope.
 */
export declare const simpleRouteErrorResponses: {
    readonly 400: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
    readonly 422: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
};
