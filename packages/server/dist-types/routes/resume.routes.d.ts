import { Elysia } from "elysia";
export declare const resumeRoutes: Elysia<"/resumes", {
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
    resumes: {
        "from-questions": {
            generate: {
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
    };
} & {
    resumes: {
        "from-questions": {
            synthesize: {
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
                        200: import("@bao/shared").ResumeData | {
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
    resumes: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: import("@bao/shared").ResumeData[];
            };
        };
    };
} & {
    resumes: {
        post: {
            body: {} & {
                skills?: ({} & {
                    gaming?: string[] | undefined;
                    technical?: string[] | undefined;
                    soft?: string[] | undefined;
                }) | undefined;
                name?: string | undefined;
                theme?: "light" | "dark" | undefined;
                summary?: string | undefined;
                projects?: ({
                    title: string;
                    description: string;
                } & {
                    link?: string | undefined;
                    technologies?: string[] | undefined;
                })[] | undefined;
                personalInfo?: ({} & {
                    portfolio?: string | undefined;
                    name?: string | undefined;
                    email?: string | undefined;
                    location?: string | undefined;
                    website?: string | undefined;
                    phone?: string | undefined;
                    linkedIn?: string | undefined;
                    github?: string | undefined;
                }) | undefined;
                experience?: ({
                    title: string;
                    company: string;
                    startDate: string;
                } & {
                    description?: string | undefined;
                    achievements?: string[] | undefined;
                    location?: string | undefined;
                    technologies?: string[] | undefined;
                    endDate?: string | undefined;
                })[] | undefined;
                education?: ({
                    degree: string;
                    field: string;
                    school: string;
                    year: string;
                } & {
                    gpa?: string | undefined;
                })[] | undefined;
                gamingExperience?: ({} & {
                    platforms?: string | undefined;
                    gameEngines?: string | undefined;
                    genres?: string | undefined;
                    shippedTitles?: string | undefined;
                }) | undefined;
                template?: "modern" | "classic" | "creative" | "minimal" | "google-xyz" | "gaming" | "executive" | "technical" | undefined;
                isDefault?: boolean | undefined;
            };
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: import("@bao/shared").ResumeData;
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
    resumes: {
        ":id": {
            get: {
                body: unknown;
                params: {
                    id: string;
                } & {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared").ResumeData | {
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
    resumes: {
        ":id": {
            put: {
                body: {} & {
                    skills?: ({} & {
                        gaming?: string[] | undefined;
                        technical?: string[] | undefined;
                        soft?: string[] | undefined;
                    }) | undefined;
                    name?: string | undefined;
                    theme?: "light" | "dark" | undefined;
                    summary?: string | undefined;
                    projects?: ({
                        title: string;
                        description: string;
                    } & {
                        link?: string | undefined;
                        technologies?: string[] | undefined;
                    })[] | undefined;
                    personalInfo?: ({} & {
                        portfolio?: string | undefined;
                        name?: string | undefined;
                        email?: string | undefined;
                        location?: string | undefined;
                        website?: string | undefined;
                        phone?: string | undefined;
                        linkedIn?: string | undefined;
                        github?: string | undefined;
                    }) | undefined;
                    experience?: ({
                        title: string;
                        company: string;
                        startDate: string;
                    } & {
                        description?: string | undefined;
                        achievements?: string[] | undefined;
                        location?: string | undefined;
                        technologies?: string[] | undefined;
                        endDate?: string | undefined;
                    })[] | undefined;
                    education?: ({
                        degree: string;
                        field: string;
                        school: string;
                        year: string;
                    } & {
                        gpa?: string | undefined;
                    })[] | undefined;
                    gamingExperience?: ({} & {
                        platforms?: string | undefined;
                        gameEngines?: string | undefined;
                        genres?: string | undefined;
                        shippedTitles?: string | undefined;
                    }) | undefined;
                    template?: "modern" | "classic" | "creative" | "minimal" | "google-xyz" | "gaming" | "executive" | "technical" | undefined;
                    isDefault?: boolean | undefined;
                };
                params: {
                    id: string;
                } & {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared").ResumeData | {
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
    resumes: {
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
    resumes: {
        ":id": {
            export: {
                post: {
                    body: {} & {
                        format?: string | undefined;
                        template?: "modern" | "classic" | "creative" | "minimal" | "google-xyz" | "gaming" | "executive" | "technical" | undefined;
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
    resumes: {
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
                            resume: import("@bao/shared").ResumeData;
                            suggestions: import("@bao/shared").JsonArray;
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
    resumes: {
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
