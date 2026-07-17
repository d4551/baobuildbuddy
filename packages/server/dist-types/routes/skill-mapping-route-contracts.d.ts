import type { Static } from "typebox";
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
export declare const skillMappingsQuerySchema: import("typebox").TObject<{
    category: import("typebox").TOptional<import("typebox").TString>;
    search: import("typebox").TOptional<import("typebox").TString>;
}>;
export type SkillMappingsRouteQuery = Static<typeof skillMappingsQuerySchema>;
export declare const skillMappingIdParamsSchema: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export type SkillMappingIdParams = Static<typeof skillMappingIdParamsSchema>;
export declare const skillMappingCreateBodySchema: import("typebox").TObject<{
    gameExpression: import("typebox").TString;
    transferableSkill: import("typebox").TString;
    industryApplications: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    evidence: import("typebox").TOptional<import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>>;
    confidence: import("typebox").TOptional<import("typebox").TNumber>;
    category: import("typebox").TOptional<import("typebox").TString>;
    demandLevel: import("typebox").TOptional<import("typebox").TString>;
    aiGenerated: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export type SkillMappingCreateRouteBody = Static<typeof skillMappingCreateBodySchema>;
export declare const skillMappingUpdateBodySchema: import("typebox").TObject<{
    gameExpression: import("typebox").TOptional<import("typebox").TString>;
    transferableSkill: import("typebox").TOptional<import("typebox").TString>;
    industryApplications: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    evidence: import("typebox").TOptional<import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>>;
    confidence: import("typebox").TOptional<import("typebox").TNumber>;
    category: import("typebox").TOptional<import("typebox").TString>;
    demandLevel: import("typebox").TOptional<import("typebox").TString>;
    aiGenerated: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export type SkillMappingUpdateRouteBody = Static<typeof skillMappingUpdateBodySchema>;
export declare const skillAnalysisBodySchema: import("typebox").TObject<{
    gameExperience: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    resume: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    autoCreateMappings: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export type SkillAnalysisRouteBody = Static<typeof skillAnalysisBodySchema>;
export declare const skillReadinessQuerySchema: import("typebox").TObject<{
    jobId: import("typebox").TOptional<import("typebox").TString>;
}>;
export type SkillReadinessRouteQuery = Static<typeof skillReadinessQuerySchema>;
