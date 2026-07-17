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
    remoteWork: import("typebox").TOptional<import("typebox").TBoolean>;
    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    games: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    culture: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    interviewStyle: import("typebox").TOptional<import("typebox").TString>;
    logo: import("typebox").TOptional<import("typebox").TString>;
}>;
export type StudioMutationRouteBody = Static<typeof studioMutationBodySchema>;
export declare const studioUpdateBodySchema: import("typebox").TObject<{
    name: import("typebox").TOptional<import("typebox").TString>;
    description: import("typebox").TOptional<import("typebox").TString>;
    website: import("typebox").TOptional<import("typebox").TString>;
    location: import("typebox").TOptional<import("typebox").TString>;
    type: import("typebox").TOptional<import("typebox").TString>;
    size: import("typebox").TOptional<import("typebox").TString>;
    remoteWork: import("typebox").TOptional<import("typebox").TBoolean>;
    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    games: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    culture: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    interviewStyle: import("typebox").TOptional<import("typebox").TString>;
    logo: import("typebox").TOptional<import("typebox").TString>;
}>;
export type StudioUpdateRouteBody = Static<typeof studioUpdateBodySchema>;
export declare const studioEntityResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    name: import("typebox").TString;
    logo: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    size: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    type: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    description: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    games: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
    technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
    culture: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
    interviewStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    remoteWork: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
    enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
    createdAt: import("typebox").TOptional<import("typebox").TString>;
    updatedAt: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const studioDeleteResponseSchema: import("typebox").TObject<{
    message: import("typebox").TString;
    id: import("typebox").TString;
}>;
export declare const studioAnalyticsResponseSchema: import("typebox").TObject<{
    totalStudios: import("typebox").TNumber;
    byType: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
    bySize: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
    remoteWorkStudios: import("typebox").TNumber;
    topTechnologies: import("typebox").TArray<import("typebox").TObject<{
        name: import("typebox").TString;
        count: import("typebox").TNumber;
    }>>;
}>;
export declare const studioListResponses: {
    readonly 200: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        name: import("typebox").TString;
        logo: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        size: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        type: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        description: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        games: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        culture: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
        interviewStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        remoteWork: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
        enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
        createdAt: import("typebox").TOptional<import("typebox").TString>;
        updatedAt: import("typebox").TOptional<import("typebox").TString>;
    }>>;
};
export declare const studioEntityResponses: {
    readonly 200: import("typebox").TObject<{
        id: import("typebox").TString;
        name: import("typebox").TString;
        logo: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        size: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        type: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        description: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        games: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        culture: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
        interviewStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        remoteWork: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
        enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
        createdAt: import("typebox").TOptional<import("typebox").TString>;
        updatedAt: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 201: import("typebox").TObject<{
        id: import("typebox").TString;
        name: import("typebox").TString;
        logo: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        size: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        type: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        description: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        games: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        culture: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
        interviewStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        remoteWork: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
        enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
        createdAt: import("typebox").TOptional<import("typebox").TString>;
        updatedAt: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const studioDeleteResponses: {
    readonly 200: import("typebox").TObject<{
        message: import("typebox").TString;
        id: import("typebox").TString;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const studioAnalyticsResponses: {
    readonly 200: import("typebox").TObject<{
        totalStudios: import("typebox").TNumber;
        byType: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
        bySize: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
        remoteWorkStudios: import("typebox").TNumber;
        topTechnologies: import("typebox").TArray<import("typebox").TObject<{
            name: import("typebox").TString;
            count: import("typebox").TNumber;
        }>>;
    }>;
};
