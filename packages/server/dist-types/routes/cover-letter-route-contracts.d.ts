import Type, { type StaticParse } from "baobox";
export type GenerateCoverLetterBody = {
    company: string;
    position: string;
    jobInfo?: Record<string, unknown>;
    resumeId?: string;
    template?: string;
    save?: boolean;
};
export type RouteSetState = {
    status?: number | string;
};
export declare const coverLetterTemplateBodySchema: Type.TUnion<Type.TLiteral<"professional" | "creative" | "gaming" | "executive" | "technical">[]>;
export declare const coverLetterIdParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export type CoverLetterIdParams = StaticParse<typeof coverLetterIdParamsSchema>;
export declare const coverLetterMutationBodySchema: Type.TObject<{
    readonly company: Type.TString;
    readonly position: Type.TString;
    readonly jobInfo: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly content: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly template: Type.TOptional<Type.TUnion<Type.TLiteral<"professional" | "creative" | "gaming" | "executive" | "technical">[]>>;
}, "company" | "position", Type.InferOptionalKeys<{
    readonly company: Type.TString;
    readonly position: Type.TString;
    readonly jobInfo: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly content: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly template: Type.TOptional<Type.TUnion<Type.TLiteral<"professional" | "creative" | "gaming" | "executive" | "technical">[]>>;
}>>;
export type CoverLetterMutationBody = StaticParse<typeof coverLetterMutationBodySchema>;
export declare const coverLetterUpdateBodySchema: Type.TObject<{
    readonly company: Type.TOptional<Type.TString>;
    readonly position: Type.TOptional<Type.TString>;
    readonly jobInfo: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly content: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly template: Type.TOptional<Type.TUnion<Type.TLiteral<"professional" | "creative" | "gaming" | "executive" | "technical">[]>>;
}, never, Type.InferOptionalKeys<{
    readonly company: Type.TOptional<Type.TString>;
    readonly position: Type.TOptional<Type.TString>;
    readonly jobInfo: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly content: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly template: Type.TOptional<Type.TUnion<Type.TLiteral<"professional" | "creative" | "gaming" | "executive" | "technical">[]>>;
}>>;
export type CoverLetterUpdateBody = StaticParse<typeof coverLetterUpdateBodySchema>;
export declare const generateCoverLetterBodySchema: Type.TObject<{
    readonly company: Type.TString;
    readonly position: Type.TString;
    readonly jobInfo: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly resumeId: Type.TOptional<Type.TString>;
    readonly template: Type.TOptional<Type.TUnion<Type.TLiteral<"professional" | "creative" | "gaming" | "executive" | "technical">[]>>;
    readonly save: Type.TOptional<Type.TBoolean>;
}, "company" | "position", Type.InferOptionalKeys<{
    readonly company: Type.TString;
    readonly position: Type.TString;
    readonly jobInfo: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly resumeId: Type.TOptional<Type.TString>;
    readonly template: Type.TOptional<Type.TUnion<Type.TLiteral<"professional" | "creative" | "gaming" | "executive" | "technical">[]>>;
    readonly save: Type.TOptional<Type.TBoolean>;
}>>;
export type GenerateCoverLetterRouteBody = StaticParse<typeof generateCoverLetterBodySchema>;
export declare const coverLetterExportBodySchema: Type.TObject<{
    readonly format: Type.TOptional<Type.TString>;
}, never, "format">;
export type CoverLetterExportBody = StaticParse<typeof coverLetterExportBodySchema>;
