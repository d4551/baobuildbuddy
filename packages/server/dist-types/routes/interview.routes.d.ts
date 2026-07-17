export declare const interviewRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {
        sessions: {
            post: {
                body: {
                    studioId?: string | undefined;
                    config?: {
                        roleType?: string | undefined;
                        roleCategory?: string | undefined;
                        experienceLevel?: string | undefined;
                        focusAreas?: string[] | undefined;
                        duration?: number | undefined;
                        questionCount?: number | undefined;
                        includeTechnical?: boolean | undefined;
                        includeBehavioral?: boolean | undefined;
                        includeStudioSpecific?: boolean | undefined;
                        enableVoiceMode?: boolean | undefined;
                        technologies?: string[] | undefined;
                        voiceSettings?: {
                            microphoneId?: string | undefined;
                            speakerId?: string | undefined;
                            voiceId?: string | undefined;
                            rate?: number | undefined;
                            pitch?: number | undefined;
                            volume?: number | undefined;
                            language?: string | undefined;
                        } | undefined;
                        interviewMode?: "job" | "studio" | undefined;
                        conversationStyle?: "natural" | "structured" | undefined;
                        targetJob?: {
                            id: string;
                            title: string;
                            company: string;
                            location: string;
                            description?: string | undefined;
                            requirements?: string[] | undefined;
                            technologies?: string[] | undefined;
                            source?: string | undefined;
                            postedDate?: string | undefined;
                            url?: string | undefined;
                        } | undefined;
                        candidateContext?: {
                            resumeId?: string | undefined;
                            coverLetterId?: string | undefined;
                            portfolioId?: string | undefined;
                        } | undefined;
                    } | undefined;
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
    };
} & {
    [x: string]: {
        sessions: {
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
    };
} & {
    [x: string]: {
        sessions: {
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
    };
} & {
    [x: string]: {
        sessions: {
            ":id": {
                response: {
                    post: {
                        body: {
                            questionId?: string | undefined;
                            questionIndex?: number | undefined;
                            response: string;
                        };
                        params: {
                            id: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: unknown;
                            400: unknown;
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
        };
    };
} & {
    [x: string]: {
        sessions: {
            ":id": {
                complete: {
                    post: {
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
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "get", string, import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    response: {
        200: import("typebox").TObject<{
            totalSessions: import("typebox").TNumber;
            completedSessions: import("typebox").TNumber;
            inProgressSessions: import("typebox").TNumber;
            averageQuestions: import("typebox").TNumber;
            averageResponses: import("typebox").TNumber;
            totalInterviews: import("typebox").TNumber;
            completedInterviews: import("typebox").TNumber;
            averageScore: import("typebox").TNumber;
            improvementTrend: import("typebox").TNumber;
        }>;
    };
}, {}, `${string}/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ status }: {
    body: unknown;
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
            totalSessions: number;
            completedSessions: number;
            inProgressSessions: number;
            averageQuestions: number;
            averageResponses: number;
            totalInterviews: number;
            completedInterviews: number;
            averageScore: number;
            improvementTrend: number;
        };
    }>;
}) => Promise<import("elysia").ElysiaStatus<200, {
    totalSessions: number;
    completedSessions: number;
    inProgressSessions: number;
    averageQuestions: number;
    averageResponses: number;
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    improvementTrend: number;
}, 200>>>;
