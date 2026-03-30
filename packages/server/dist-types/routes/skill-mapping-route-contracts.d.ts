export type SkillMappingsQuery = {
    category?: string;
    search?: string;
};
export type SkillMappingMutationBody = {
    gameExpression: string;
    transferableSkill: string;
    industryApplications?: unknown;
    evidence?: unknown;
    confidence?: number;
    category?: string;
    demandLevel?: string;
    aiGenerated?: boolean;
};
export type SkillMappingUpdateBody = Partial<SkillMappingMutationBody>;
export type SkillAnalyzeBody = {
    gameExperience?: Record<string, unknown>;
    resume?: Record<string, unknown>;
    autoCreateMappings?: boolean;
};
export type SkillMappingRouteSetState = {
    status?: number | string;
};
export declare const skillMappingsQuerySchema: import("@sinclair/typebox").TObject<{
    category: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    search: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const skillMappingIdParamsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
}>;
export declare const skillMappingCreateBodySchema: import("@sinclair/typebox").TObject<{
    gameExpression: import("@sinclair/typebox").TString;
    transferableSkill: import("@sinclair/typebox").TString;
    industryApplications: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    evidence: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>>;
    confidence: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    category: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    demandLevel: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    aiGenerated: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export declare const skillMappingUpdateBodySchema: import("@sinclair/typebox").TObject<{
    gameExpression: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    transferableSkill: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    industryApplications: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    evidence: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>>;
    confidence: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    category: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    demandLevel: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    aiGenerated: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export declare const skillAnalysisBodySchema: import("@sinclair/typebox").TObject<{
    gameExperience: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    resume: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    autoCreateMappings: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export declare const skillReadinessQuerySchema: import("@sinclair/typebox").TObject<{
    jobId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
