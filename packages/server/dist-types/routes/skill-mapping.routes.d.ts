import { Elysia } from "elysia";
export declare const skillMappingRoutes: Elysia<string, {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
} & {
    error: {};
    typebox: import("@sinclair/typebox").TModule<{}, {}>;
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    macro: {};
    macroFn: {};
    parser: {};
}, {
    [x: string]: {};
} & {
    [x: string]: {
        mappings: {
            get: {
                body: unknown;
                params: {};
                query: {} & {
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
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
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
                } & {
                    aiGenerated?: boolean | undefined;
                    category?: string | undefined;
                    confidence?: number | undefined;
                    demandLevel?: string | undefined;
                    evidence?: Record<string, unknown>[] | undefined;
                    industryApplications?: string[] | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/skill-mapping").SkillMapping;
                    422: {
                        type: 'validation';
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    [x: string]: {
        mappings: {
            ":id": {
                put: {
                    body: {} & {
                        aiGenerated?: boolean | undefined;
                        category?: string | undefined;
                        confidence?: number | undefined;
                        demandLevel?: string | undefined;
                        evidence?: Record<string, unknown>[] | undefined;
                        gameExpression?: string | undefined;
                        industryApplications?: string[] | undefined;
                        transferableSkill?: string | undefined;
                    };
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/skill-mapping").SkillMapping | {
                            error: string;
                        };
                        422: {
                            type: 'validation';
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
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
                    } & {};
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
            };
        };
    };
} & {
    [x: string]: {
        readiness: {
            get: {
                body: unknown;
                params: {};
                query: {} & {
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
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    [x: string]: {
        "ai-analyze": {
            post: {
                body: {} & {
                    autoCreateMappings?: boolean | undefined;
                    gameExperience?: Record<string, unknown> | undefined;
                    resume?: Record<string, unknown> | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
                        detectedSkills: string[];
                        suggestedMappings: Record<string, unknown>[];
                        recommendations: string[];
                        provider?: string;
                    };
                    422: {
                        type: 'validation';
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
}>;
