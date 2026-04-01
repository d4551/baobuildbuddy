import Type, { type StaticParse } from "baobox";
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
export declare const skillMappingsQuerySchema: Type.TObject<{
    readonly category: Type.TOptional<Type.TString>;
    readonly search: Type.TOptional<Type.TString>;
}, never, Type.InferOptionalKeys<{
    readonly category: Type.TOptional<Type.TString>;
    readonly search: Type.TOptional<Type.TString>;
}>>;
export type SkillMappingsRouteQuery = StaticParse<typeof skillMappingsQuerySchema>;
export declare const skillMappingIdParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export type SkillMappingIdParams = StaticParse<typeof skillMappingIdParamsSchema>;
export declare const skillMappingCreateBodySchema: Type.TObject<{
    readonly gameExpression: Type.TString;
    readonly transferableSkill: Type.TString;
    readonly industryApplications: Type.TOptional<Type.TArray<Type.TString>>;
    readonly evidence: Type.TOptional<Type.TArray<Type.TRecord<Type.TString, Type.TUnknown>>>;
    readonly confidence: Type.TOptional<Type.TNumber>;
    readonly category: Type.TOptional<Type.TString>;
    readonly demandLevel: Type.TOptional<Type.TString>;
    readonly aiGenerated: Type.TOptional<Type.TBoolean>;
}, "gameExpression" | "transferableSkill", Type.InferOptionalKeys<{
    readonly gameExpression: Type.TString;
    readonly transferableSkill: Type.TString;
    readonly industryApplications: Type.TOptional<Type.TArray<Type.TString>>;
    readonly evidence: Type.TOptional<Type.TArray<Type.TRecord<Type.TString, Type.TUnknown>>>;
    readonly confidence: Type.TOptional<Type.TNumber>;
    readonly category: Type.TOptional<Type.TString>;
    readonly demandLevel: Type.TOptional<Type.TString>;
    readonly aiGenerated: Type.TOptional<Type.TBoolean>;
}>>;
export type SkillMappingCreateRouteBody = StaticParse<typeof skillMappingCreateBodySchema>;
export declare const skillMappingUpdateBodySchema: Type.TObject<{
    readonly gameExpression: Type.TOptional<Type.TString>;
    readonly transferableSkill: Type.TOptional<Type.TString>;
    readonly industryApplications: Type.TOptional<Type.TArray<Type.TString>>;
    readonly evidence: Type.TOptional<Type.TArray<Type.TRecord<Type.TString, Type.TUnknown>>>;
    readonly confidence: Type.TOptional<Type.TNumber>;
    readonly category: Type.TOptional<Type.TString>;
    readonly demandLevel: Type.TOptional<Type.TString>;
    readonly aiGenerated: Type.TOptional<Type.TBoolean>;
}, never, Type.InferOptionalKeys<{
    readonly gameExpression: Type.TOptional<Type.TString>;
    readonly transferableSkill: Type.TOptional<Type.TString>;
    readonly industryApplications: Type.TOptional<Type.TArray<Type.TString>>;
    readonly evidence: Type.TOptional<Type.TArray<Type.TRecord<Type.TString, Type.TUnknown>>>;
    readonly confidence: Type.TOptional<Type.TNumber>;
    readonly category: Type.TOptional<Type.TString>;
    readonly demandLevel: Type.TOptional<Type.TString>;
    readonly aiGenerated: Type.TOptional<Type.TBoolean>;
}>>;
export type SkillMappingUpdateRouteBody = StaticParse<typeof skillMappingUpdateBodySchema>;
export declare const skillAnalysisBodySchema: Type.TObject<{
    readonly gameExperience: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly resume: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly autoCreateMappings: Type.TOptional<Type.TBoolean>;
}, never, Type.InferOptionalKeys<{
    readonly gameExperience: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly resume: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly autoCreateMappings: Type.TOptional<Type.TBoolean>;
}>>;
export type SkillAnalysisRouteBody = StaticParse<typeof skillAnalysisBodySchema>;
export declare const skillReadinessQuerySchema: Type.TObject<{
    readonly jobId: Type.TOptional<Type.TString>;
}, never, "jobId">;
export type SkillReadinessRouteQuery = StaticParse<typeof skillReadinessQuerySchema>;
