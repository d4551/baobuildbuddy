import { Elysia } from "elysia";
type SessionPayload = Record<string, unknown>;
export declare const interviewRoutes: Elysia<"/interview", {
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
    interview: {
        sessions: {
            post: {
                body: {
                    studioId?: string | undefined;
                    config?: {
                        experienceLevel?: string | undefined;
                        technologies?: string[] | undefined;
                        duration?: number | undefined;
                        roleType?: string | undefined;
                        roleCategory?: string | undefined;
                        focusAreas?: string[] | undefined;
                        questionCount?: number | undefined;
                        includeTechnical?: boolean | undefined;
                        includeBehavioral?: boolean | undefined;
                        includeStudioSpecific?: boolean | undefined;
                        enableVoiceMode?: boolean | undefined;
                        interviewMode?: "job" | "studio" | undefined;
                        targetJob?: {
                            source?: string | undefined;
                            url?: string | undefined;
                            description?: string | undefined;
                            technologies?: string[] | undefined;
                            requirements?: string[] | undefined;
                            postedDate?: string | undefined;
                            location: string;
                            id: string;
                            company: string;
                            title: string;
                        } | undefined;
                        voiceSettings?: {
                            language?: string | undefined;
                            microphoneId?: string | undefined;
                            speakerId?: string | undefined;
                            voiceId?: string | undefined;
                            rate?: number | undefined;
                            pitch?: number | undefined;
                            volume?: number | undefined;
                        } | undefined;
                    } | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
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
    interview: {
        sessions: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: SessionPayload[];
                };
            };
        };
    };
} & {
    interview: {
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
                        200: SessionPayload;
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
    interview: {
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
                            200: {
                                error: string;
                            } | {
                                message: string;
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
        };
    };
} & {
    interview: {
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
                            200: {
                                error: string;
                            } | {
                                message: string;
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
        };
    };
} & {
    interview: {
        stats: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
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
export {};
