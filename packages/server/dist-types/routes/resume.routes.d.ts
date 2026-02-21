import { type ResumeData } from "@bao/shared";
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
                        experienceLevel?: string | undefined;
                        studioName?: string | undefined;
                        targetRole: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            questions: import("../services/cv-questionnaire-service").CvQuestion[];
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
        "from-questions": {
            synthesize: {
                post: {
                    body: {
                        questionsAndAnswers: {
                            category: string;
                            id: string;
                            question: string;
                            answer: string;
                        }[];
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: ResumeData | {
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
                200: ResumeData[];
            };
        };
    };
} & {
    resumes: {
        post: {
            body: {
                skills?: {
                    gaming?: string[] | undefined;
                    technical?: string[] | undefined;
                    soft?: string[] | undefined;
                } | undefined;
                education?: {
                    gpa?: string | undefined;
                    degree: string;
                    field: string;
                    school: string;
                    year: string;
                }[] | undefined;
                name?: string | undefined;
                summary?: string | undefined;
                gamingExperience?: {
                    gameEngines?: string | undefined;
                    platforms?: string | undefined;
                    genres?: string | undefined;
                    shippedTitles?: string | undefined;
                } | undefined;
                theme?: "light" | "dark" | undefined;
                projects?: {
                    technologies?: string[] | undefined;
                    link?: string | undefined;
                    title: string;
                    description: string;
                }[] | undefined;
                personalInfo?: {
                    portfolio?: string | undefined;
                    website?: string | undefined;
                    name?: string | undefined;
                    email?: string | undefined;
                    phone?: string | undefined;
                    location?: string | undefined;
                    linkedIn?: string | undefined;
                    github?: string | undefined;
                } | undefined;
                experience?: {
                    location?: string | undefined;
                    achievements?: string[] | undefined;
                    description?: string | undefined;
                    technologies?: string[] | undefined;
                    endDate?: string | undefined;
                    company: string;
                    title: string;
                    startDate: string;
                }[] | undefined;
                template?: string | undefined;
                isDefault?: boolean | undefined;
            };
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: ResumeData;
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
                };
                query: unknown;
                headers: unknown;
                response: {
                    200: ResumeData | {
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
                body: {
                    skills?: {
                        gaming?: string[] | undefined;
                        technical?: string[] | undefined;
                        soft?: string[] | undefined;
                    } | undefined;
                    education?: {
                        gpa?: string | undefined;
                        degree: string;
                        field: string;
                        school: string;
                        year: string;
                    }[] | undefined;
                    name?: string | undefined;
                    summary?: string | undefined;
                    gamingExperience?: {
                        gameEngines?: string | undefined;
                        platforms?: string | undefined;
                        genres?: string | undefined;
                        shippedTitles?: string | undefined;
                    } | undefined;
                    theme?: "light" | "dark" | undefined;
                    projects?: {
                        technologies?: string[] | undefined;
                        link?: string | undefined;
                        title: string;
                        description: string;
                    }[] | undefined;
                    personalInfo?: {
                        portfolio?: string | undefined;
                        website?: string | undefined;
                        name?: string | undefined;
                        email?: string | undefined;
                        phone?: string | undefined;
                        location?: string | undefined;
                        linkedIn?: string | undefined;
                        github?: string | undefined;
                    } | undefined;
                    experience?: {
                        location?: string | undefined;
                        achievements?: string[] | undefined;
                        description?: string | undefined;
                        technologies?: string[] | undefined;
                        endDate?: string | undefined;
                        company: string;
                        title: string;
                        startDate: string;
                    }[] | undefined;
                    template?: string | undefined;
                    isDefault?: boolean | undefined;
                };
                params: {
                    id: string;
                };
                query: unknown;
                headers: unknown;
                response: {
                    200: ResumeData | {
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
                };
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
                    body: {
                        format?: string | undefined;
                        template?: string | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: Response | {
                            error: string;
                            details: string;
                        } | {
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
    resumes: {
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
                            resume: ResumeData;
                            suggestions: import("@bao/shared").JsonArray;
                            section: string;
                            error?: undefined;
                            details?: undefined;
                        } | {
                            error: string;
                            details: string;
                        } | {
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
    resumes: {
        ":id": {
            "ai-score": {
                post: {
                    body: {
                        jobId: string;
                    };
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            resumeId: string;
                            jobId: string;
                            score: number;
                            strengths: string[];
                            improvements: string[];
                            keywords: string[];
                            analysis: Record<string, unknown>;
                            error?: undefined;
                            details?: undefined;
                        } | {
                            error: string;
                            details: string;
                        } | {
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
