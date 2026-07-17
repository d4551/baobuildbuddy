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
                    201: {
                        id: string;
                        gameExpression: string;
                        transferableSkill: string;
                        industryApplications: string[];
                        evidenceSuggestions?: string[] | undefined;
                        evidence: {
                            id: string;
                            type: string;
                            title: string;
                            description: string;
                            url?: string | undefined;
                            verificationStatus: string;
                        }[];
                        confidence: number;
                        category: string;
                        demandLevel: string;
                        verified: boolean;
                        aiGenerated?: boolean | undefined;
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
                        200: {
                            id: string;
                            gameExpression: string;
                            transferableSkill: string;
                            industryApplications: string[];
                            evidenceSuggestions?: string[] | undefined;
                            evidence: {
                                id: string;
                                type: string;
                                title: string;
                                description: string;
                                url?: string | undefined;
                                verificationStatus: string;
                            }[];
                            confidence: number;
                            category: string;
                            demandLevel: string;
                            verified: boolean;
                            aiGenerated?: boolean | undefined;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        200: unknown;
                        404: unknown;
                        410: unknown;
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
                    200: {
                        id: string;
                        title: string;
                        description: string;
                        detailedDescription?: string | undefined;
                        matchScore: number;
                        stages: {
                            title: string;
                            duration: string;
                            description: string;
                            completed?: boolean | undefined;
                            current?: boolean | undefined;
                            requirements?: string[] | undefined;
                            outcomes?: string[] | undefined;
                        }[];
                        requiredSkills: string[];
                        estimatedTimeToEntry: string;
                        icon?: string | undefined;
                        averageSalary?: {
                            min: number;
                            max: number;
                            currency?: string | undefined;
                        } | undefined;
                        jobMarketTrend: string;
                    }[];
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
                    200: {
                        overallScore: number;
                        categories: {
                            technical: {
                                score: number;
                                feedbackId: string;
                                strengths?: string[] | undefined;
                                improvements?: string[] | undefined;
                            };
                            softSkills: {
                                score: number;
                                feedbackId: string;
                                strengths?: string[] | undefined;
                                improvements?: string[] | undefined;
                            };
                            industryKnowledge: {
                                score: number;
                                feedbackId: string;
                                strengths?: string[] | undefined;
                                improvements?: string[] | undefined;
                            };
                            portfolio: {
                                score: number;
                                feedbackId: string;
                                strengths?: string[] | undefined;
                                improvements?: string[] | undefined;
                            };
                        };
                        improvementSuggestions: string[];
                        nextSteps: string[];
                        targetRoleReadiness?: {
                            roleId: string;
                            roleTitle: string;
                            readinessScore: number;
                            missingSkills: string[];
                            matchingSkills: string[];
                            timeToReady?: string | undefined;
                            recommendedActions: string[];
                        }[] | undefined;
                        jobId?: string | undefined;
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
    response: {
        200: import("typebox").TObject<{
            message: import("typebox").TString;
            detectedSkills: import("typebox").TArray<import("typebox").TString>;
            suggestedMappings: import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
            recommendations: import("typebox").TArray<import("typebox").TString>;
            provider: import("typebox").TOptional<import("typebox").TString>;
        }>;
        500: import("typebox").TObject<{
            message: import("typebox").TString;
            detectedSkills: import("typebox").TArray<import("typebox").TString>;
            suggestedMappings: import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
            recommendations: import("typebox").TArray<import("typebox").TString>;
            provider: import("typebox").TOptional<import("typebox").TString>;
        }>;
    };
}, {}, `${string}/ai-analyze`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ body, status }: {
    body: {
        gameExperience?: Record<string, unknown> | undefined;
        resume?: Record<string, unknown> | undefined;
        autoCreateMappings?: boolean | undefined;
    };
    query: Record<string, string | undefined>;
    params: {};
    headers: Record<string, string | undefined>;
    cookie: Record<string, import("elysia").Cookie<unknown>>;
    server: import("elysia").Server | null;
    redirect: import("elysia").redirect;
    set: {
        headers: import("elysia").HTTPHeaders;
        status?: number | keyof import("elysia").StatusMap;
        cookie?: Record<string, import("elysia").BaseCookie>;
    };
    readonly path: string;
    route?: string;
    rid?: string;
    request: Request;
    store: {};
    status: import("elysia").SelectiveStatus<{
        200: {
            message: string;
            detectedSkills: string[];
            suggestedMappings: Record<string, unknown>[];
            recommendations: string[];
            provider?: string | undefined;
        };
        500: {
            message: string;
            detectedSkills: string[];
            suggestedMappings: Record<string, unknown>[];
            recommendations: string[];
            provider?: string | undefined;
        };
    }>;
}) => Promise<import("elysia").ElysiaStatus<200, {
    message: string;
    detectedSkills: string[];
    suggestedMappings: Record<string, unknown>[];
    recommendations: string[];
    provider?: string;
}, 200> | import("elysia").ElysiaStatus<500, {
    message: string;
    detectedSkills: string[];
    suggestedMappings: Record<string, unknown>[];
    recommendations: string[];
    provider?: string;
}, 500>>>;
