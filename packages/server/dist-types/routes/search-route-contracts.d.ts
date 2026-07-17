import type { Static } from "typebox";
export declare const searchTypes: readonly ["jobs", "studios", "skills", "resumes"];
export type SearchType = (typeof searchTypes)[number];
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
