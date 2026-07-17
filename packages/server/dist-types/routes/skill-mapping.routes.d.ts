import { type SkillAnalysisRouteBody, type SkillMappingRouteSetState } from "./skill-mapping-route-contracts";
export declare const skillMappingRoutes: import("elysia/types").AddRoute<string, "local", {
    decorator: {};
    store: {};
    derive: {};
}, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {};
} & {
    [x: string]: {
        mappings: {
            get: {
                body: unknown;
                params: {};
                query: {
                    category?: string | undefined;
                    search?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        gameExpression: string;
                        transferableSkill: string;
                        industryApplications: string[] | null;
                        evidence: unknown[] | null;
                        confidence: number | null;
                        category: string | null;
                        demandLevel: string | null;
                        aiGenerated: boolean | null;
                        createdAt: string;
                        updatedAt: string;
                    }[];
                    422: {
                        type: 'validation';
                        title: 'Validation Error';
                        status: 422;
                        detail?: string;
                        on: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        mappings: {
            post: {
                body: {
                    gameExpression: string;
                    transferableSkill: string;
                    industryApplications?: string[] | undefined;
                    evidence?: Record<string, unknown>[] | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    demandLevel?: string | undefined;
                    aiGenerated?: boolean | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/skill-mapping").SkillMapping;
                    422: {
                        type: 'validation';
                        title: 'Validation Error';
                        status: 422;
                        detail?: string;
                        on: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        mappings: {
            ":id": {
                put: {
                    body: {
                        gameExpression?: string | undefined;
                        transferableSkill?: string | undefined;
                        industryApplications?: string[] | undefined;
                        evidence?: Record<string, unknown>[] | undefined;
                        confidence?: number | undefined;
                        category?: string | undefined;
                        demandLevel?: string | undefined;
                        aiGenerated?: boolean | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/skill-mapping").SkillMapping | {
                            error: string;
                        };
                        422: {
                            type: 'validation';
                            title: 'Validation Error';
                            status: 422;
                            detail?: string;
                            on: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                    error: never;
                };
            };
        };
    };
} & {
    [x: string]: {
        mappings: {
            ":id": {
                delete: {
                    body: unknown;
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        [x: number]: {
                            message?: undefined;
                            error: string;
                            id: string;
                        } | {
                            error?: undefined;
                            message: string;
                            id: string;
                        };
                    };
                    error: never;
                };
            };
        };
    };
} & {
    [x: string]: {
        pathways: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/skill-mapping").CareerPathway[];
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        readiness: {
            get: {
                body: unknown;
                params: {};
                query: {
                    jobId?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/skill-mapping").ReadinessAssessment | {
                        overallScore: number;
                        categories: {
                            technical: import("@bao/shared/types/skill-mapping").CategoryAssessment;
                            softSkills: import("@bao/shared/types/skill-mapping").CategoryAssessment;
                            industryKnowledge: import("@bao/shared/types/skill-mapping").CategoryAssessment;
                            portfolio: import("@bao/shared/types/skill-mapping").CategoryAssessment;
                        };
                        improvementSuggestions: import("@bao/shared/types/skill-mapping").SkillReadinessImprovementId[];
                        nextSteps: import("@bao/shared/types/skill-mapping").SkillReadinessNextStepId[];
                        targetRoleReadiness?: import("@bao/shared/types/skill-mapping").RoleReadiness[];
                        jobId: string;
                    };
                    422: {
                        type: 'validation';
                        title: 'Validation Error';
                        status: 422;
                        detail?: string;
                        on: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, {
    derive: {};
    schema: {};
    schemas: {};
    response: {};
    error: [];
}, "post", "/ai-analyze", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    body: import("typebox").TObject<{
        gameExperience: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        resume: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        autoCreateMappings: import("typebox").TOptional<import("typebox").TBoolean>;
    }>;
}, {}, `${string}/ai-analyze`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ body, set }: {
    body: SkillAnalysisRouteBody;
    set: SkillMappingRouteSetState;
}) => Promise<{
    message: string;
    detectedSkills: string[];
    suggestedMappings: Record<string, unknown>[];
    recommendations: string[];
    provider?: string;
}>>;
