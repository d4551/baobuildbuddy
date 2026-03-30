import { Elysia } from "elysia";
export declare const skillMappingRoutes: Elysia<"/skills", {
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
    skills: {};
} & {
    skills: {
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
                        type: "validation";
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
    skills: {
        mappings: {
            post: {
                body: {
                    category?: string | undefined;
                    confidence?: number | undefined;
                    industryApplications?: string[] | undefined;
                    evidence?: {
                        [x: string]: unknown;
                    }[] | undefined;
                    demandLevel?: string | undefined;
                    aiGenerated?: boolean | undefined;
                    gameExpression: string;
                    transferableSkill: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared").SkillMapping;
                    422: {
                        type: "validation";
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
    skills: {
        mappings: {
            ":id": {
                put: {
                    body: {
                        category?: string | undefined;
                        confidence?: number | undefined;
                        gameExpression?: string | undefined;
                        transferableSkill?: string | undefined;
                        industryApplications?: string[] | undefined;
                        evidence?: {
                            [x: string]: unknown;
                        }[] | undefined;
                        demandLevel?: string | undefined;
                        aiGenerated?: boolean | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared").SkillMapping | {
                            error: string;
                        };
                        422: {
                            type: "validation";
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
    skills: {
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
                            error: string;
                            id: string;
                            message?: undefined;
                        } | {
                            message: string;
                            id: string;
                            error?: undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    skills: {
        pathways: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared").CareerPathway[];
                };
            };
        };
    };
} & {
    skills: {
        readiness: {
            get: {
                body: unknown;
                params: {};
                query: {
                    jobId?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: import("@bao/shared").ReadinessAssessment | {
                        jobId: string;
                        overallScore: number;
                        categories: {
                            technical: import("@bao/shared").CategoryAssessment;
                            softSkills: import("@bao/shared").CategoryAssessment;
                            industryKnowledge: import("@bao/shared").CategoryAssessment;
                            portfolio: import("@bao/shared").CategoryAssessment;
                        };
                        improvementSuggestions: import("@bao/shared").SkillReadinessImprovementId[];
                        nextSteps: import("@bao/shared").SkillReadinessNextStepId[];
                        targetRoleReadiness?: import("@bao/shared").RoleReadiness[];
                    };
                    422: {
                        type: "validation";
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
    skills: {
        "ai-analyze": {
            post: {
                body: {
                    resume?: {} | undefined;
                    gameExperience?: {} | undefined;
                    autoCreateMappings?: boolean | undefined;
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
                        type: "validation";
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
