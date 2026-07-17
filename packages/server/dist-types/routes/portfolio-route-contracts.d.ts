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
export declare const portfolioProjectResponseSchema: import("typebox").TObject<{
    id: import("typebox").TOptional<import("typebox").TString>;
    portfolioId: import("typebox").TOptional<import("typebox").TString>;
    title: import("typebox").TString;
    description: import("typebox").TString;
    technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
    image: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    liveUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    githubUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
    featured: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
    role: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
    engines: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
    sortOrder: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>>;
    createdAt: import("typebox").TOptional<import("typebox").TString>;
    updatedAt: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const portfolioResponseSchema: import("typebox").TObject<{
    id: import("typebox").TOptional<import("typebox").TString>;
    metadata: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    projects: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TOptional<import("typebox").TString>;
        portfolioId: import("typebox").TOptional<import("typebox").TString>;
        title: import("typebox").TString;
        description: import("typebox").TString;
        technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        image: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        liveUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        githubUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        featured: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
        role: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        engines: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        sortOrder: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>>;
        createdAt: import("typebox").TOptional<import("typebox").TString>;
        updatedAt: import("typebox").TOptional<import("typebox").TString>;
    }>>;
    createdAt: import("typebox").TOptional<import("typebox").TString>;
    updatedAt: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const portfolioProjectDeleteResponseSchema: import("typebox").TObject<{
    success: import("typebox").TBoolean;
    id: import("typebox").TString;
}>;
export declare const portfolioResponses: {
    200: import("typebox").TUnknown;
};
export declare const portfolioMutationResponses: {
    200: import("typebox").TUnknown;
};
export declare const portfolioProjectMutationResponses: {
    200: import("typebox").TUnknown;
    201: import("typebox").TUnknown;
    404: import("typebox").TUnknown;
    500: import("typebox").TUnknown;
};
export declare const portfolioProjectReorderResponses: {
    200: import("typebox").TUnknown;
    500: import("typebox").TUnknown;
};
export declare const portfolioProjectDeleteResponses: {
    200: import("typebox").TUnknown;
    404: import("typebox").TUnknown;
};
export declare const portfolioExportResponses: {
    200: import("typebox").TUnknown;
    404: import("typebox").TUnknown;
    500: import("typebox").TUnknown;
};
