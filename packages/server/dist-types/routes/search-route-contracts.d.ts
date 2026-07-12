import Type, { StandardSchemaV1, type StaticParse } from "baobox";
export declare const searchTypes: readonly ["jobs", "studios", "skills", "resumes"];
export type SearchType = (typeof searchTypes)[number];
export declare const searchQuerySchema: Type.TObject<{
    readonly q: Type.TOptional<Type.TString>;
    readonly types: Type.TOptional<Type.TUnion<(Type.TArray<Type.TUnion<Type.TLiteral<"jobs" | "resumes" | "skills" | "studios">[]>> | Type.TString)[]>>;
}, never, Type.InferOptionalKeys<{
    readonly q: Type.TOptional<Type.TString>;
    readonly types: Type.TOptional<Type.TUnion<(Type.TArray<Type.TUnion<Type.TLiteral<"jobs" | "resumes" | "skills" | "studios">[]>> | Type.TString)[]>>;
}>>;
export type SearchQuery = StaticParse<typeof searchQuerySchema>;
export declare const searchAutocompleteQuerySchema: Type.TObject<{
    readonly prefix: Type.TOptional<Type.TString>;
}, never, "prefix">;
export type SearchAutocompleteQuery = StaticParse<typeof searchAutocompleteQuerySchema>;
export declare const searchQuery: Type.TObject<{
    readonly q: Type.TOptional<Type.TString>;
    readonly types: Type.TOptional<Type.TUnion<(Type.TArray<Type.TUnion<Type.TLiteral<"jobs" | "resumes" | "skills" | "studios">[]>> | Type.TString)[]>>;
}, never, Type.InferOptionalKeys<{
    readonly q: Type.TOptional<Type.TString>;
    readonly types: Type.TOptional<Type.TUnion<(Type.TArray<Type.TUnion<Type.TLiteral<"jobs" | "resumes" | "skills" | "studios">[]>> | Type.TString)[]>>;
}>> & StandardSchemaV1<unknown, {} & {
    q?: string | undefined;
    types?: string | ("jobs" | "resumes" | "skills" | "studios")[] | undefined;
}>;
export declare const searchAutocompleteQuery: Type.TObject<{
    readonly prefix: Type.TOptional<Type.TString>;
}, never, "prefix"> & StandardSchemaV1<unknown, {} & {
    prefix?: string | undefined;
}>;
