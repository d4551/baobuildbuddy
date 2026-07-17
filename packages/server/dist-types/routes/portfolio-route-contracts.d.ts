import type { Static } from "typebox";
import type { PortfolioMetadata } from "@bao/shared/types/portfolio";
export type PortfolioMetadataRecord = PortfolioMetadata;
export declare const portfolioUpdateBodySchema: import("typebox").TObject<{
    metadata: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
}>;
export type PortfolioUpdateRouteBody = Static<typeof portfolioUpdateBodySchema>;
export declare const portfolioProjectCreateBodySchema: import("typebox").TObject<{
    title: import("typebox").TString;
    description: import("typebox").TString;
    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    image: import("typebox").TOptional<import("typebox").TString>;
    liveUrl: import("typebox").TOptional<import("typebox").TString>;
    githubUrl: import("typebox").TOptional<import("typebox").TString>;
    tags: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    featured: import("typebox").TOptional<import("typebox").TBoolean>;
    role: import("typebox").TOptional<import("typebox").TString>;
    platforms: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    engines: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    sortOrder: import("typebox").TOptional<import("typebox").TNumber>;
}>;
export type PortfolioProjectCreateRouteBody = Static<typeof portfolioProjectCreateBodySchema>;
export declare const portfolioProjectReorderBodySchema: import("typebox").TObject<{
    orderedIds: import("typebox").TArray<import("typebox").TString>;
}>;
export type PortfolioProjectReorderRouteBody = Static<typeof portfolioProjectReorderBodySchema>;
export declare const portfolioProjectIdParamsSchema: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export type PortfolioProjectIdParams = Static<typeof portfolioProjectIdParamsSchema>;
export declare const portfolioProjectUpdateBodySchema: import("typebox").TObject<{
    title: import("typebox").TOptional<import("typebox").TString>;
    description: import("typebox").TOptional<import("typebox").TString>;
    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    image: import("typebox").TOptional<import("typebox").TString>;
    liveUrl: import("typebox").TOptional<import("typebox").TString>;
    githubUrl: import("typebox").TOptional<import("typebox").TString>;
    tags: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    featured: import("typebox").TOptional<import("typebox").TBoolean>;
    role: import("typebox").TOptional<import("typebox").TString>;
    platforms: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    engines: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    sortOrder: import("typebox").TOptional<import("typebox").TNumber>;
}>;
export type PortfolioProjectUpdateRouteBody = Static<typeof portfolioProjectUpdateBodySchema>;
export declare const portfolioExportBodySchema: import("typebox").TObject<{
    format: import("typebox").TOptional<import("typebox").TString>;
}>;
export type PortfolioExportRouteBody = Static<typeof portfolioExportBodySchema>;
