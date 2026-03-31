import Type from "baobox";
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
}, never, never>;
export declare const skillMappingIdParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export declare const skillMappingCreateBodySchema: Type.TObject<{
    readonly gameExpression: Type.TString;
    readonly transferableSkill: Type.TString;
    readonly industryApplications: Type.TOptional<Type.TArray<Type.TString>>;
    readonly evidence: Type.TOptional<Type.TArray<Type.TRecord<Type.TString, Type.TUnknown>>>;
    readonly confidence: Type.TOptional<Type.TNumber>;
    readonly category: Type.TOptional<Type.TString>;
    readonly demandLevel: Type.TOptional<Type.TString>;
    readonly aiGenerated: Type.TOptional<Type.TBoolean>;
}, "gameExpression" | "transferableSkill", never>;
export declare const skillMappingUpdateBodySchema: Type.TObject<{
    readonly gameExpression: Type.TOptional<Type.TString>;
    readonly transferableSkill: Type.TOptional<Type.TString>;
    readonly industryApplications: Type.TOptional<Type.TArray<Type.TString>>;
    readonly evidence: Type.TOptional<Type.TArray<Type.TRecord<Type.TString, Type.TUnknown>>>;
    readonly confidence: Type.TOptional<Type.TNumber>;
    readonly category: Type.TOptional<Type.TString>;
    readonly demandLevel: Type.TOptional<Type.TString>;
    readonly aiGenerated: Type.TOptional<Type.TBoolean>;
}, never, never>;
export declare const skillAnalysisBodySchema: Type.TObject<{
    readonly gameExperience: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly resume: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    readonly autoCreateMappings: Type.TOptional<Type.TBoolean>;
}, never, never>;
export declare const skillReadinessQuerySchema: Type.TObject<{
    readonly jobId: Type.TOptional<Type.TString>;
}, never, never>;
