import type { Static } from "typebox";
/**
 * Derived from `generateCoverLetterBodySchema` below rather than hand-written, so a
 * field added to the schema cannot go missing from the handler's view of the body —
 * which is exactly how `jobId` / `studioId` would have been silently unavailable.
 */
export type GenerateCoverLetterBody = Static<typeof generateCoverLetterBodySchema>;
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
    jobId: import("typebox").TOptional<import("typebox").TString>;
    studioId: import("typebox").TOptional<import("typebox").TString>;
    template: import("typebox").TOptional<import("typebox").TUnion<import("typebox").TLiteral<"creative" | "executive" | "gaming" | "professional" | "technical">[]>>;
    save: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export type GenerateCoverLetterRouteBody = Static<typeof generateCoverLetterBodySchema>;
export declare const coverLetterExportBodySchema: import("typebox").TObject<{
    format: import("typebox").TOptional<import("typebox").TString>;
    template: import("typebox").TOptional<import("typebox").TUnion<import("typebox").TLiteral<"creative" | "executive" | "gaming" | "professional" | "technical">[]>>;
}>;
export type CoverLetterExportBody = Static<typeof coverLetterExportBodySchema>;
export declare const coverLetterEntityResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    company: import("typebox").TString;
    position: import("typebox").TString;
    jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
    content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
    template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    createdAt: import("typebox").TString;
    updatedAt: import("typebox").TString;
}>;
export declare const coverLetterDeleteResponseSchema: import("typebox").TObject<{
    success: import("typebox").TBoolean;
    id: import("typebox").TString;
}>;
export declare const generatedCoverLetterContentResponseSchema: import("typebox").TObject<{
    introduction: import("typebox").TString;
    body: import("typebox").TString;
    conclusion: import("typebox").TString;
}>;
export declare const generateCoverLetterResponseSchema: import("typebox").TObject<{
    message: import("typebox").TString;
    content: import("typebox").TObject<{
        introduction: import("typebox").TString;
        body: import("typebox").TString;
        conclusion: import("typebox").TString;
    }>;
}>;
export declare const generateCoverLetterSavedResponseSchema: import("typebox").TObject<{
    message: import("typebox").TString;
    coverLetter: import("typebox").TObject<{
        id: import("typebox").TString;
        company: import("typebox").TString;
        position: import("typebox").TString;
        jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
        content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
        template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        createdAt: import("typebox").TString;
        updatedAt: import("typebox").TString;
    }>;
}>;
export declare const coverLettersListResponses: {
    200: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        company: import("typebox").TString;
        position: import("typebox").TString;
        jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
        content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
        template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        createdAt: import("typebox").TString;
        updatedAt: import("typebox").TString;
    }>>;
};
export declare const coverLetterEntityResponses: {
    200: import("typebox").TObject<{
        id: import("typebox").TString;
        company: import("typebox").TString;
        position: import("typebox").TString;
        jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
        content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
        template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        createdAt: import("typebox").TString;
        updatedAt: import("typebox").TString;
    }>;
    201: import("typebox").TObject<{
        id: import("typebox").TString;
        company: import("typebox").TString;
        position: import("typebox").TString;
        jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
        content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
        template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        createdAt: import("typebox").TString;
        updatedAt: import("typebox").TString;
    }>;
    404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const coverLetterDeleteResponses: {
    200: import("typebox").TObject<{
        success: import("typebox").TBoolean;
        id: import("typebox").TString;
    }>;
    404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const generateCoverLetterResponses: {
    200: import("typebox").TObject<{
        message: import("typebox").TString;
        content: import("typebox").TObject<{
            introduction: import("typebox").TString;
            body: import("typebox").TString;
            conclusion: import("typebox").TString;
        }>;
    }>;
    201: import("typebox").TObject<{
        message: import("typebox").TString;
        coverLetter: import("typebox").TObject<{
            id: import("typebox").TString;
            company: import("typebox").TString;
            position: import("typebox").TString;
            jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
            content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
            template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            createdAt: import("typebox").TString;
            updatedAt: import("typebox").TString;
        }>;
    }>;
    500: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
    503: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
/** Export streams a generated document body, so only the error arms are typed. */
export declare const coverLetterExportResponses: {
    200: import("typebox").TUnknown;
    404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
    500: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
