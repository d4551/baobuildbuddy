import { Elysia } from "elysia";
export declare const resumeRoutes: Elysia<string, {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {
    [x: string]: {
        [x: string]: {
            post: {
                body: {
                    targetRole: string;
                } & {
                    experienceLevel?: string | undefined;
                    studioName?: string | undefined;
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
                        questions: import("../services/cv-questionnaire-service").CvQuestion[];
                        error?: undefined;
                        details?: undefined;
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
    [x: string]: {
        [x: string]: {
            post: {
                body: {
                    questionsAndAnswers: ({
                        id: string;
                        category: string;
                        question: string;
                        answer: string;
                    } & {})[];
                } & {};
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/resume").ResumeData | {
                        error: string;
                        details: string;
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
    [x: string]: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: import("@bao/shared/types/resume").ResumeData[];
            };
        };
    };
} & {
    [x: string]: {
        post: {
            body: {} & {
                skills?: ({} & {
                    gaming?: string[] | undefined;
                    technical?: string[] | undefined;
                    soft?: string[] | undefined;
                }) | undefined;
                name?: string | undefined;
                template?: "creative" | "gaming" | "executive" | "technical" | "modern" | "classic" | "minimal" | "google-xyz" | undefined;
                personalInfo?: ({} & {
                    portfolio?: string | undefined;
                    name?: string | undefined;
                    email?: string | undefined;
                    location?: string | undefined;
                    website?: string | undefined;
                    phone?: string | undefined;
                    github?: string | undefined;
                    linkedIn?: string | undefined;
                }) | undefined;
                summary?: string | undefined;
                experience?: ({
                    company: string;
                    title: string;
                    startDate: string;
                } & {
                    achievements?: string[] | undefined;
                    location?: string | undefined;
                    description?: string | undefined;
                    technologies?: string[] | undefined;
                    endDate?: string | undefined;
                })[] | undefined;
                education?: ({
                    degree: string;
                    year: string;
                    field: string;
                    school: string;
                } & {
                    gpa?: string | undefined;
                })[] | undefined;
                projects?: ({
                    title: string;
                    description: string;
                } & {
                    link?: string | undefined;
                    technologies?: string[] | undefined;
                })[] | undefined;
                gamingExperience?: ({} & {
                    platforms?: string | undefined;
                    gameEngines?: string | undefined;
                    genres?: string | undefined;
                    shippedTitles?: string | undefined;
                }) | undefined;
                theme?: "light" | "dark" | undefined;
                isDefault?: boolean | undefined;
            };
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: import("@bao/shared/types/resume").ResumeData;
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
} & {
    [x: string]: {
        ":id": {
            get: {
                body: unknown;
                params: {
                    id: string;
                } & {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/resume").ResumeData | {
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
} & {
    [x: string]: {
        ":id": {
            put: {
                body: {} & {
                    skills?: ({} & {
                        gaming?: string[] | undefined;
                        technical?: string[] | undefined;
                        soft?: string[] | undefined;
                    }) | undefined;
                    name?: string | undefined;
                    template?: "creative" | "gaming" | "executive" | "technical" | "modern" | "classic" | "minimal" | "google-xyz" | undefined;
                    personalInfo?: ({} & {
                        portfolio?: string | undefined;
                        name?: string | undefined;
                        email?: string | undefined;
                        location?: string | undefined;
                        website?: string | undefined;
                        phone?: string | undefined;
                        github?: string | undefined;
                        linkedIn?: string | undefined;
                    }) | undefined;
                    summary?: string | undefined;
                    experience?: ({
                        company: string;
                        title: string;
                        startDate: string;
                    } & {
                        achievements?: string[] | undefined;
                        location?: string | undefined;
                        description?: string | undefined;
                        technologies?: string[] | undefined;
                        endDate?: string | undefined;
                    })[] | undefined;
                    education?: ({
                        degree: string;
                        year: string;
                        field: string;
                        school: string;
                    } & {
                        gpa?: string | undefined;
                    })[] | undefined;
                    projects?: ({
                        title: string;
                        description: string;
                    } & {
                        link?: string | undefined;
                        technologies?: string[] | undefined;
                    })[] | undefined;
                    gamingExperience?: ({} & {
                        platforms?: string | undefined;
                        gameEngines?: string | undefined;
                        genres?: string | undefined;
                        shippedTitles?: string | undefined;
                    }) | undefined;
                    theme?: "light" | "dark" | undefined;
                    isDefault?: boolean | undefined;
                };
                params: {
                    id: string;
                } & {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/resume").ResumeData | {
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
} & {
    [x: string]: {
        ":id": {
            delete: {
                body: unknown;
                params: {
                    id: string;
                } & {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        success?: undefined;
                        id?: undefined;
                    } | {
                        success: boolean;
                        id: string;
                        error?: undefined;
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
    [x: string]: {
        ":id": {
            export: {
                post: {
                    body: {} & {
                        format?: string | undefined;
                        template?: "creative" | "gaming" | "executive" | "technical" | "modern" | "classic" | "minimal" | "google-xyz" | undefined;
                    };
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: Response | {
                            error: string;
                            details?: undefined;
                        } | {
                            error: string;
                            details: string;
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
    [x: string]: {
        ":id": {
            "ai-enhance": {
                post: {
                    body: {} & {
                        section?: string | undefined;
                    };
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            details?: undefined;
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
                            resume: import("@bao/shared/types/resume").ResumeData;
                            suggestions: import("@bao/shared/utils/json").JsonArray;
                            section: string;
                            error?: undefined;
                            details?: undefined;
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
    [x: string]: {
        ":id": {
            "ai-score": {
                post: {
                    body: {
                        jobId: string;
                    } & {};
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            details?: undefined;
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
                            resumeId: string;
                            jobId: string;
                            score: number;
                            strengths: string[];
                            improvements: string[];
                            keywords: string[];
                            analysis: Record<string, unknown>;
                            error?: undefined;
                            details?: undefined;
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
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
