import { type status } from "elysia";
import { type ResumeIdParams, type ResumeScoreRouteBody } from "./resume-route-contracts";
type RouteStatus = typeof status;
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
                    200: unknown;
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
                    500: unknown;
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
                    201: unknown;
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
                    500: unknown;
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
                200: unknown;
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
                201: unknown;
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
                    200: unknown;
                    404: unknown;
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
                    200: unknown;
                    404: unknown;
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
                    200: unknown;
                    404: unknown;
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
                        200: unknown;
                        404: unknown;
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
                        500: unknown;
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
                        200: unknown;
                        404: unknown;
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
                        500: unknown;
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
    response: {
        200: import("typebox").TUnknown;
        404: import("typebox").TUnknown;
        500: import("typebox").TUnknown;
    };
}, {}, `${string}/:id/ai-score`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, body, status, }: {
    params: ResumeIdParams;
    body: ResumeScoreRouteBody;
    status: RouteStatus;
}) => Promise<import("elysia").ElysiaStatus<200, {
    error?: undefined;
    details?: undefined;
    resumeId: string;
    jobId: string;
    score: number;
    strengths: string[];
    improvements: string[];
    keywords: string[];
    analysis: Record<string, unknown>;
}, 200> | import("elysia").ElysiaStatus<404, {
    error: string;
    details: string;
} | {
    details?: undefined;
    error: string;
}, 404> | import("elysia").ElysiaStatus<500, {
    error: string;
    details: string;
} | {
    details?: undefined;
    error: string;
}, 500>>>;
export {};
