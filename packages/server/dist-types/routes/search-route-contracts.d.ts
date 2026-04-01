import { StandardSchemaV1 } from "baobox";
import Type, { type StaticParse } from "baobox";
export declare const searchTypes: readonly ["jobs", "studios", "skills", "resumes"];
export type SearchType = (typeof searchTypes)[number];
export declare const searchQuerySchema: Type.TObject<{
    readonly q: Type.TOptional<Type.TString>;
    readonly types: Type.TOptional<Type.TUnion<(Type.TString | Type.TArray<Type.TUnion<Type.TLiteral<"skills" | "studios" | "jobs" | "resumes">[]>>)[]>>;
}, never, Type.InferOptionalKeys<{
    readonly q: Type.TOptional<Type.TString>;
    readonly types: Type.TOptional<Type.TUnion<(Type.TString | Type.TArray<Type.TUnion<Type.TLiteral<"skills" | "studios" | "jobs" | "resumes">[]>>)[]>>;
}>>;
export type SearchQuery = StaticParse<typeof searchQuerySchema>;
export declare const searchAutocompleteQuerySchema: Type.TObject<{
    readonly prefix: Type.TOptional<Type.TString>;
}, never, "prefix">;
export type SearchAutocompleteQuery = StaticParse<typeof searchAutocompleteQuerySchema>;
export declare const searchQuery: Type.TObject<{
    readonly q: Type.TOptional<Type.TString>;
    readonly types: Type.TOptional<Type.TUnion<(Type.TString | Type.TArray<Type.TUnion<Type.TLiteral<"skills" | "studios" | "jobs" | "resumes">[]>>)[]>>;
}, never, Type.InferOptionalKeys<{
    readonly q: Type.TOptional<Type.TString>;
    readonly types: Type.TOptional<Type.TUnion<(Type.TString | Type.TArray<Type.TUnion<Type.TLiteral<"skills" | "studios" | "jobs" | "resumes">[]>>)[]>>;
}>> & StandardSchemaV1<unknown, {} & {
    types?: string | ("skills" | "studios" | "jobs" | "resumes")[] | undefined;
    q?: string | undefined;
}>;
export declare const searchAutocompleteQuery: Type.TObject<{
    readonly prefix: Type.TOptional<Type.TString>;
}, never, "prefix"> & StandardSchemaV1<unknown, {} & {
    prefix?: string | undefined;
}>;
