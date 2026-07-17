import type { Static } from "typebox";
export declare const scraperPortalParamsSchema: import("typebox").TObject<{
    portalId: import("typebox").TString;
}>;
export type ScraperPortalParams = Static<typeof scraperPortalParamsSchema>;
export declare const scrapeEnrichmentSummarySchema: import("typebox").TObject<{
    enabled: import("typebox").TBoolean;
    enrichedRecords: import("typebox").TNumber;
    warnings: import("typebox").TArray<import("typebox").TString>;
    provider: import("typebox").TOptional<import("typebox").TString>;
    model: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const scraperOperationResultSchema: import("typebox").TObject<{
    scraped: import("typebox").TNumber;
    upserted: import("typebox").TNumber;
    errors: import("typebox").TArray<import("typebox").TString>;
    enrichment: import("typebox").TObject<{
        enabled: import("typebox").TBoolean;
        enrichedRecords: import("typebox").TNumber;
        warnings: import("typebox").TArray<import("typebox").TString>;
        provider: import("typebox").TOptional<import("typebox").TString>;
        model: import("typebox").TOptional<import("typebox").TString>;
    }>;
}>;
export declare const scraperErrorResponseSchema: import("typebox").TObject<{
    error: import("typebox").TString;
    details: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const scraperOperationResponses: {
    readonly 200: import("typebox").TObject<{
        scraped: import("typebox").TNumber;
        upserted: import("typebox").TNumber;
        errors: import("typebox").TArray<import("typebox").TString>;
        enrichment: import("typebox").TObject<{
            enabled: import("typebox").TBoolean;
            enrichedRecords: import("typebox").TNumber;
            warnings: import("typebox").TArray<import("typebox").TString>;
            provider: import("typebox").TOptional<import("typebox").TString>;
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
