import type { PortfolioMetadata } from "@bao/shared/types/portfolio";
import Type, { type StaticParse } from "baobox";
export type PortfolioMetadataRecord = PortfolioMetadata;
export declare const portfolioUpdateBodySchema: Type.TObject<{
    readonly metadata: Type.TRecord<Type.TString, Type.TUnknown>;
}, "metadata", never>;
export type PortfolioUpdateRouteBody = StaticParse<typeof portfolioUpdateBodySchema>;
export declare const portfolioProjectCreateBodySchema: Type.TObject<{
    readonly title: Type.TString;
    readonly description: Type.TString;
    readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
    readonly image: Type.TOptional<Type.TString>;
    readonly liveUrl: Type.TOptional<Type.TString>;
    readonly githubUrl: Type.TOptional<Type.TString>;
    readonly tags: Type.TOptional<Type.TArray<Type.TString>>;
    readonly featured: Type.TOptional<Type.TBoolean>;
    readonly role: Type.TOptional<Type.TString>;
    readonly platforms: Type.TOptional<Type.TArray<Type.TString>>;
    readonly engines: Type.TOptional<Type.TArray<Type.TString>>;
    readonly sortOrder: Type.TOptional<Type.TNumber>;
}, "description" | "title", Type.InferOptionalKeys<{
    readonly title: Type.TString;
    readonly description: Type.TString;
    readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
    readonly image: Type.TOptional<Type.TString>;
    readonly liveUrl: Type.TOptional<Type.TString>;
    readonly githubUrl: Type.TOptional<Type.TString>;
    readonly tags: Type.TOptional<Type.TArray<Type.TString>>;
    readonly featured: Type.TOptional<Type.TBoolean>;
    readonly role: Type.TOptional<Type.TString>;
    readonly platforms: Type.TOptional<Type.TArray<Type.TString>>;
    readonly engines: Type.TOptional<Type.TArray<Type.TString>>;
    readonly sortOrder: Type.TOptional<Type.TNumber>;
}>>;
export type PortfolioProjectCreateRouteBody = StaticParse<typeof portfolioProjectCreateBodySchema>;
export declare const portfolioProjectReorderBodySchema: Type.TObject<{
    readonly orderedIds: Type.TArray<Type.TString>;
}, "orderedIds", never>;
export type PortfolioProjectReorderRouteBody = StaticParse<typeof portfolioProjectReorderBodySchema>;
export declare const portfolioProjectIdParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export type PortfolioProjectIdParams = StaticParse<typeof portfolioProjectIdParamsSchema>;
export declare const portfolioProjectUpdateBodySchema: Type.TObject<{
    readonly title: Type.TOptional<Type.TString>;
    readonly description: Type.TOptional<Type.TString>;
    readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
    readonly image: Type.TOptional<Type.TString>;
    readonly liveUrl: Type.TOptional<Type.TString>;
    readonly githubUrl: Type.TOptional<Type.TString>;
    readonly tags: Type.TOptional<Type.TArray<Type.TString>>;
    readonly featured: Type.TOptional<Type.TBoolean>;
    readonly role: Type.TOptional<Type.TString>;
    readonly platforms: Type.TOptional<Type.TArray<Type.TString>>;
    readonly engines: Type.TOptional<Type.TArray<Type.TString>>;
    readonly sortOrder: Type.TOptional<Type.TNumber>;
}, never, Type.InferOptionalKeys<{
    readonly title: Type.TOptional<Type.TString>;
    readonly description: Type.TOptional<Type.TString>;
    readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
    readonly image: Type.TOptional<Type.TString>;
    readonly liveUrl: Type.TOptional<Type.TString>;
    readonly githubUrl: Type.TOptional<Type.TString>;
    readonly tags: Type.TOptional<Type.TArray<Type.TString>>;
    readonly featured: Type.TOptional<Type.TBoolean>;
    readonly role: Type.TOptional<Type.TString>;
    readonly platforms: Type.TOptional<Type.TArray<Type.TString>>;
    readonly engines: Type.TOptional<Type.TArray<Type.TString>>;
    readonly sortOrder: Type.TOptional<Type.TNumber>;
}>>;
export type PortfolioProjectUpdateRouteBody = StaticParse<typeof portfolioProjectUpdateBodySchema>;
export declare const portfolioExportBodySchema: Type.TObject<{
    readonly format: Type.TOptional<Type.TString>;
}, never, "format">;
export type PortfolioExportRouteBody = StaticParse<typeof portfolioExportBodySchema>;
