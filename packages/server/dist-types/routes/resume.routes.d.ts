import { type ResumeIdParams, type ResumeRouteSetState, type ResumeScoreBody } from "./resume-route-contracts";
export declare const resumeRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {
        [x: string]: {
            post: {
                body: {
                    targetRole: string;
                    studioName?: string | undefined;
                    experienceLevel?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        details: string;
                        questions?: undefined;
                    } | {
                        error?: undefined;
                        details?: undefined;
                        questions: import("../services/cv-questionnaire-service").CvQuestion[];
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
        [x: string]: {
            post: {
                body: {
                    questionsAndAnswers: {
                        id: string;
                        question: string;
                        answer: string;
                        category: string;
                    }[];
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/resume").ResumeData | {
                        error: string;
                        details: string;
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
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: import("@bao/shared/types/resume").ResumeData[];
            };
            error: never;
        };
    };
} & {
    [x: string]: {
        post: {
            body: {
                name?: string | undefined;
                personalInfo?: {
                    name?: string | undefined;
                    email?: string | undefined;
                    phone?: string | undefined;
                    location?: string | undefined;
                    website?: string | undefined;
                    linkedIn?: string | undefined;
                    github?: string | undefined;
                    portfolio?: string | undefined;
                } | undefined;
                summary?: string | undefined;
                experience?: {
                    title: string;
                    company: string;
                    startDate: string;
                    endDate?: string | undefined;
                    location?: string | undefined;
                    description?: string | undefined;
                    achievements?: string[] | undefined;
                    technologies?: string[] | undefined;
                }[] | undefined;
                education?: {
                    degree: string;
                    field: string;
                    school: string;
                    year: string;
                    gpa?: string | undefined;
                }[] | undefined;
                skills?: {
                    technical?: string[] | undefined;
                    soft?: string[] | undefined;
                    gaming?: string[] | undefined;
                } | undefined;
                projects?: {
                    title: string;
                    description: string;
                    technologies?: string[] | undefined;
                    link?: string | undefined;
                }[] | undefined;
                gamingExperience?: {
                    gameEngines?: string | undefined;
                    platforms?: string | undefined;
                    genres?: string | undefined;
                    shippedTitles?: string | undefined;
                } | undefined;
                template?: undefined;
                theme?: "dark" | "light" | undefined;
                isDefault?: boolean | undefined;
            };
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: import("@bao/shared/types/resume").ResumeData;
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
} & {
    [x: string]: {
        ":id": {
            get: {
                body: unknown;
                params: {
                    id: string;
                };
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/resume").ResumeData | {
                        error: string;
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        ":id": {
            put: {
                body: {
                    name?: string | undefined;
                    personalInfo?: {
                        name?: string | undefined;
                        email?: string | undefined;
                        phone?: string | undefined;
                        location?: string | undefined;
                        website?: string | undefined;
                        linkedIn?: string | undefined;
                        github?: string | undefined;
                        portfolio?: string | undefined;
                    } | undefined;
                    summary?: string | undefined;
                    experience?: {
                        title: string;
                        company: string;
                        startDate: string;
                        endDate?: string | undefined;
                        location?: string | undefined;
                        description?: string | undefined;
                        achievements?: string[] | undefined;
                        technologies?: string[] | undefined;
                    }[] | undefined;
                    education?: {
                        degree: string;
                        field: string;
                        school: string;
                        year: string;
                        gpa?: string | undefined;
                    }[] | undefined;
                    skills?: {
                        technical?: string[] | undefined;
                        soft?: string[] | undefined;
                        gaming?: string[] | undefined;
                    } | undefined;
                    projects?: {
                        title: string;
                        description: string;
                        technologies?: string[] | undefined;
                        link?: string | undefined;
                    }[] | undefined;
                    gamingExperience?: {
                        gameEngines?: string | undefined;
                        platforms?: string | undefined;
                        genres?: string | undefined;
                        shippedTitles?: string | undefined;
                    } | undefined;
                    template?: undefined;
                    theme?: "dark" | "light" | undefined;
                    isDefault?: boolean | undefined;
                };
                params: {
                    id: string;
                };
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/resume").ResumeData | {
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
} & {
    [x: string]: {
        ":id": {
            delete: {
                body: unknown;
                params: {
                    id: string;
                };
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success?: undefined;
                        id?: undefined;
                        error: string;
                    } | {
                        error?: undefined;
                        success: boolean;
                        id: string;
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        ":id": {
            export: {
                post: {
                    body: {
                        format?: string | undefined;
                        template?: undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: Response | {
                            details?: undefined;
                            error: string;
                        } | {
                            error: string;
                            details: string;
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
        ":id": {
            "ai-enhance": {
                post: {
                    body: {
                        section?: string | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            details?: undefined;
                            error: string;
                            resume?: undefined;
                            suggestions?: undefined;
                            section?: undefined;
                        } | {
                            error: string;
                            details: string;
                            resume?: undefined;
                            suggestions?: undefined;
                            section?: undefined;
                        } | {
                            error?: undefined;
                            details?: undefined;
                            resume: import("@bao/shared/types/resume").ResumeData;
                            suggestions: import("@bao/shared/utils/json").JsonArray;
                            section: string;
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
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "post", "/:id/ai-score", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    params: import("typebox").TObject<{
        id: import("typebox").TString;
    }>;
    body: import("typebox").TObject<{
        jobId: import("typebox").TString;
    }>;
}, {}, `${string}/:id/ai-score`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, body, set, }: {
    params: ResumeIdParams;
    body: ResumeScoreBody;
    set: ResumeRouteSetState;
}) => Promise<{
    details?: undefined;
    error: string;
    resumeId?: undefined;
    jobId?: undefined;
    score?: undefined;
    strengths?: undefined;
    improvements?: undefined;
    keywords?: undefined;
    analysis?: undefined;
} | {
    error: string;
    details: string;
    resumeId?: undefined;
    jobId?: undefined;
    score?: undefined;
    strengths?: undefined;
    improvements?: undefined;
    keywords?: undefined;
    analysis?: undefined;
} | {
    error?: undefined;
    details?: undefined;
    resumeId: string;
    jobId: string;
    score: number;
    strengths: string[];
    improvements: string[];
    keywords: string[];
    analysis: Record<string, unknown>;
}>>;
