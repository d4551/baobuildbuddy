import type { Static } from "typebox";
export type GenerateCoverLetterBody = {
    company: string;
    position: string;
    jobInfo?: Record<string, unknown>;
    resumeId?: string;
    template?: string;
    save?: boolean;
};
export declare const coverLetterTemplateBodySchema: import("typebox").TUnion<import("typebox").TLiteral<"creative" | "executive" | "gaming" | "professional" | "technical">[]>;
export declare const coverLetterIdParamsSchema: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export type CoverLetterIdParams = Static<typeof coverLetterIdParamsSchema>;
export declare const coverLetterMutationBodySchema: import("typebox").TObject<{
    company: import("typebox").TString;
    position: import("typebox").TString;
    jobInfo: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    content: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    template: import("typebox").TOptional<import("typebox").TUnion<import("typebox").TLiteral<"creative" | "executive" | "gaming" | "professional" | "technical">[]>>;
}>;
export type CoverLetterMutationBody = Static<typeof coverLetterMutationBodySchema>;
export declare const coverLetterUpdateBodySchema: import("typebox").TObject<{
    company: import("typebox").TOptional<import("typebox").TString>;
    position: import("typebox").TOptional<import("typebox").TString>;
    jobInfo: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    content: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    template: import("typebox").TOptional<import("typebox").TUnion<import("typebox").TLiteral<"creative" | "executive" | "gaming" | "professional" | "technical">[]>>;
}>;
export type CoverLetterUpdateBody = Static<typeof coverLetterUpdateBodySchema>;
export declare const generateCoverLetterBodySchema: import("typebox").TObject<{
    company: import("typebox").TString;
    position: import("typebox").TString;
    jobInfo: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    resumeId: import("typebox").TOptional<import("typebox").TString>;
    template: import("typebox").TOptional<import("typebox").TUnion<import("typebox").TLiteral<"creative" | "executive" | "gaming" | "professional" | "technical">[]>>;
    save: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export type GenerateCoverLetterRouteBody = Static<typeof generateCoverLetterBodySchema>;
export declare const coverLetterExportBodySchema: import("typebox").TObject<{
    format: import("typebox").TOptional<import("typebox").TString>;
}>;
export type CoverLetterExportBody = Static<typeof coverLetterExportBodySchema>;
