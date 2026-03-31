import Type from "baobox";
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
export declare const coverLetterTemplateBodySchema: Type.TUnion<Type.TLiteral<"creative" | "gaming" | "executive" | "technical" | "professional">[]>;
export declare const coverLetterIdParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export declare const coverLetterMutationBodySchema: Type.TObject<{
    readonly company: Type.TString;
    readonly position: Type.TString;
    readonly jobInfo: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly content: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly template: Type.TOptional<Type.TUnion<Type.TLiteral<"creative" | "gaming" | "executive" | "technical" | "professional">[]>>;
}, "company" | "position", never>;
export declare const coverLetterUpdateBodySchema: Type.TObject<{
    readonly company: Type.TOptional<Type.TString>;
    readonly position: Type.TOptional<Type.TString>;
    readonly jobInfo: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly content: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly template: Type.TOptional<Type.TUnion<Type.TLiteral<"creative" | "gaming" | "executive" | "technical" | "professional">[]>>;
}, never, never>;
export declare const generateCoverLetterBodySchema: Type.TObject<{
    readonly company: Type.TString;
    readonly position: Type.TString;
    readonly jobInfo: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly resumeId: Type.TOptional<Type.TString>;
    readonly template: Type.TOptional<Type.TUnion<Type.TLiteral<"creative" | "gaming" | "executive" | "technical" | "professional">[]>>;
    readonly save: Type.TOptional<Type.TBoolean>;
}, "company" | "position", never>;
export declare const coverLetterExportBodySchema: Type.TObject<{
    readonly format: Type.TOptional<Type.TString>;
}, never, never>;
