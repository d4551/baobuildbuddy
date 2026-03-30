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
export declare const coverLetterTemplateBodySchema: import("@sinclair/typebox").TString;
export declare const coverLetterIdParamsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
}>;
export declare const coverLetterMutationBodySchema: import("@sinclair/typebox").TObject<{
    company: import("@sinclair/typebox").TString;
    position: import("@sinclair/typebox").TString;
    jobInfo: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    content: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    template: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const coverLetterUpdateBodySchema: import("@sinclair/typebox").TObject<{
    company: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    position: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    jobInfo: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    content: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    template: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const generateCoverLetterBodySchema: import("@sinclair/typebox").TObject<{
    company: import("@sinclair/typebox").TString;
    position: import("@sinclair/typebox").TString;
    jobInfo: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    resumeId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    template: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    save: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export declare const coverLetterExportBodySchema: import("@sinclair/typebox").TObject<{
    format: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
