import { type SearchResultType } from "@bao/shared/constants/search";
import type { Static } from "typebox";
export declare const searchTypes: readonly ["jobs", "studios", "skills", "resumes", "cover-letters", "portfolio-projects", "interview-sessions", "automation-runs"];
export type SearchType = SearchResultType;
export declare const searchQuerySchema: import("typebox").TObject<{
    q: import("typebox").TOptional<import("typebox").TString>;
    types: import("typebox").TOptional<import("typebox").TString>;
}>;
export type SearchQuery = Static<typeof searchQuerySchema>;
export declare const searchAutocompleteQuerySchema: import("typebox").TObject<{
    prefix: import("typebox").TOptional<import("typebox").TString>;
}>;
export type SearchAutocompleteQuery = Static<typeof searchAutocompleteQuerySchema>;
export declare const searchQuery: import("typebox").TObject<{
    q: import("typebox").TOptional<import("typebox").TString>;
    types: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const searchAutocompleteQuery: import("typebox").TObject<{
    prefix: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const searchResultSchema: import("typebox").TObject<{
    type: import("typebox").TUnion<[import("typebox").TLiteral<"jobs">, import("typebox").TLiteral<"studios">, import("typebox").TLiteral<"skills">, import("typebox").TLiteral<"resumes">, import("typebox").TLiteral<"cover-letters">, import("typebox").TLiteral<"portfolio-projects">, import("typebox").TLiteral<"interview-sessions">, import("typebox").TLiteral<"automation-runs">]>;
    id: import("typebox").TString;
    title: import("typebox").TString;
    subtitle: import("typebox").TString;
    snippet: import("typebox").TString;
    relevance: import("typebox").TNumber;
}>;
export declare const searchAllResponseSchema: import("typebox").TObject<{
    query: import("typebox").TString;
    results: import("typebox").TArray<import("typebox").TObject<{
        type: import("typebox").TUnion<[import("typebox").TLiteral<"jobs">, import("typebox").TLiteral<"studios">, import("typebox").TLiteral<"skills">, import("typebox").TLiteral<"resumes">, import("typebox").TLiteral<"cover-letters">, import("typebox").TLiteral<"portfolio-projects">, import("typebox").TLiteral<"interview-sessions">, import("typebox").TLiteral<"automation-runs">]>;
        id: import("typebox").TString;
        title: import("typebox").TString;
        subtitle: import("typebox").TString;
        snippet: import("typebox").TString;
        relevance: import("typebox").TNumber;
    }>>;
    counts: import("typebox").TObject<{
        jobs: import("typebox").TNumber;
        studios: import("typebox").TNumber;
        skills: import("typebox").TNumber;
        resumes: import("typebox").TNumber;
        "cover-letters": import("typebox").TNumber;
        "portfolio-projects": import("typebox").TNumber;
        "interview-sessions": import("typebox").TNumber;
        "automation-runs": import("typebox").TNumber;
    }>;
    totalTime: import("typebox").TNumber;
}>;
export declare const searchAutocompleteResponseSchema: import("typebox").TArray<import("typebox").TObject<{
    text: import("typebox").TString;
    type: import("typebox").TString;
}>>;
export declare const searchAllResponses: {
    200: import("typebox").TObject<{
        query: import("typebox").TString;
        results: import("typebox").TArray<import("typebox").TObject<{
            type: import("typebox").TUnion<[import("typebox").TLiteral<"jobs">, import("typebox").TLiteral<"studios">, import("typebox").TLiteral<"skills">, import("typebox").TLiteral<"resumes">, import("typebox").TLiteral<"cover-letters">, import("typebox").TLiteral<"portfolio-projects">, import("typebox").TLiteral<"interview-sessions">, import("typebox").TLiteral<"automation-runs">]>;
            id: import("typebox").TString;
            title: import("typebox").TString;
            subtitle: import("typebox").TString;
            snippet: import("typebox").TString;
            relevance: import("typebox").TNumber;
        }>>;
        counts: import("typebox").TObject<{
            jobs: import("typebox").TNumber;
            studios: import("typebox").TNumber;
            skills: import("typebox").TNumber;
            resumes: import("typebox").TNumber;
            "cover-letters": import("typebox").TNumber;
            "portfolio-projects": import("typebox").TNumber;
            "interview-sessions": import("typebox").TNumber;
            "automation-runs": import("typebox").TNumber;
        }>;
        totalTime: import("typebox").TNumber;
    }>;
};
export declare const searchAutocompleteResponses: {
    200: import("typebox").TArray<import("typebox").TObject<{
        text: import("typebox").TString;
        type: import("typebox").TString;
    }>>;
};
