export declare const scraperRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {
        [x: string]: {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        scraped: number;
                        upserted: number;
                        errors: string[];
                        enrichment: {
                            enabled: boolean;
                            enrichedRecords: number;
                            warnings: string[];
                            provider?: undefined;
                            model?: string | undefined;
                        };
                    };
                    400: {
                        error: string;
                        details?: string | undefined;
                    };
                    500: {
                        error: string;
                        details?: string | undefined;
                    };
                };
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "post", string, import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    params: import("typebox").TObject<{
        portalId: import("typebox").TString;
    }>;
    response: {
        readonly 200: import("typebox").TObject<{
            scraped: import("typebox").TNumber;
            upserted: import("typebox").TNumber;
            errors: import("typebox").TArray<import("typebox").TString>;
            enrichment: import("typebox").TObject<{
                enabled: import("typebox").TBoolean;
                enrichedRecords: import("typebox").TNumber;
                warnings: import("typebox").TArray<import("typebox").TString>;
                provider: import("typebox").TOptional<import("typebox").TUnion<import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>>;
                model: import("typebox").TOptional<import("typebox").TString>;
            }>;
        }>;
        readonly 400: import("typebox").TObject<{
            error: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TString>;
        }>;
        readonly 500: import("typebox").TObject<{
            error: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TString>;
        }>;
    };
}, {}, `${string}/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, import("elysia/types").InlineHandlerNonMacro<NoInfer<import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    params: import("typebox").TObject<{
        portalId: import("typebox").TString;
    }>;
    response: {
        readonly 200: import("typebox").TObject<{
            scraped: import("typebox").TNumber;
            upserted: import("typebox").TNumber;
            errors: import("typebox").TArray<import("typebox").TString>;
            enrichment: import("typebox").TObject<{
                enabled: import("typebox").TBoolean;
                enrichedRecords: import("typebox").TNumber;
                warnings: import("typebox").TArray<import("typebox").TString>;
                provider: import("typebox").TOptional<import("typebox").TUnion<import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>>;
                model: import("typebox").TOptional<import("typebox").TString>;
            }>;
        }>;
        readonly 400: import("typebox").TObject<{
            error: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TString>;
        }>;
        readonly 500: import("typebox").TObject<{
            error: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TString>;
        }>;
    };
}, {}, `${string}/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>>, NoInfer<import("elysia/types").DefaultSingleton & {
    derive: {};
}>>>;
