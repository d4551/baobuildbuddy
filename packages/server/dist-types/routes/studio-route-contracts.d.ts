import type { Static } from "typebox";
export declare const studioListQuerySchema: import("typebox").TObject<{
    q: import("typebox").TOptional<import("typebox").TString>;
    type: import("typebox").TOptional<import("typebox").TString>;
    size: import("typebox").TOptional<import("typebox").TString>;
    remoteWork: import("typebox").TOptional<import("typebox").TString>;
}>;
export type StudioListRouteQuery = Static<typeof studioListQuerySchema>;
export declare const studioIdParamsSchema: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export type StudioIdParams = Static<typeof studioIdParamsSchema>;
export declare const studioMutationBodySchema: import("typebox").TObject<{
    name: import("typebox").TString;
    description: import("typebox").TOptional<import("typebox").TString>;
    website: import("typebox").TOptional<import("typebox").TString>;
    location: import("typebox").TOptional<import("typebox").TString>;
    type: import("typebox").TOptional<import("typebox").TString>;
    size: import("typebox").TOptional<import("typebox").TString>;
    founded: import("typebox").TOptional<import("typebox").TString>;
    remoteWork: import("typebox").TOptional<import("typebox").TBoolean>;
    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    genres: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    platforms: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    culture: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    benefits: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    socialMedia: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TString>>;
    notableGames: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
}>;
export type StudioMutationRouteBody = Static<typeof studioMutationBodySchema>;
export declare const studioUpdateBodySchema: import("typebox").TObject<{
    name: import("typebox").TOptional<import("typebox").TString>;
    description: import("typebox").TOptional<import("typebox").TString>;
    website: import("typebox").TOptional<import("typebox").TString>;
    location: import("typebox").TOptional<import("typebox").TString>;
    type: import("typebox").TOptional<import("typebox").TString>;
    size: import("typebox").TOptional<import("typebox").TString>;
    founded: import("typebox").TOptional<import("typebox").TString>;
    remoteWork: import("typebox").TOptional<import("typebox").TBoolean>;
    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    genres: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    platforms: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    culture: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    benefits: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    socialMedia: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TString>>;
    notableGames: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
}>;
export type StudioUpdateRouteBody = Static<typeof studioUpdateBodySchema>;
