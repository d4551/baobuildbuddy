import { Elysia } from "elysia";
export declare const interviewRoutes: Elysia<string, {
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
        sessions: {
            post: {
                body: {} & {
                    config?: ({} & {
                        candidateContext?: ({} & {
                            coverLetterId?: string | undefined;
                            portfolioId?: string | undefined;
                            resumeId?: string | undefined;
                        }) | undefined;
                        conversationStyle?: "natural" | "structured" | undefined;
                        duration?: number | undefined;
                        enableVoiceMode?: boolean | undefined;
                        experienceLevel?: string | undefined;
                        focusAreas?: string[] | undefined;
                        includeBehavioral?: boolean | undefined;
                        includeStudioSpecific?: boolean | undefined;
                        includeTechnical?: boolean | undefined;
                        interviewMode?: "job" | "studio" | undefined;
                        questionCount?: number | undefined;
                        roleCategory?: string | undefined;
                        roleType?: string | undefined;
                        targetJob?: ({
                            company: string;
                            id: string;
                            location: string;
                            title: string;
                        } & {
                            description?: string | undefined;
                            postedDate?: string | undefined;
                            requirements?: string[] | undefined;
                            source?: string | undefined;
                            technologies?: string[] | undefined;
                            url?: string | undefined;
                        }) | undefined;
                        technologies?: string[] | undefined;
                        voiceSettings?: ({} & {
                            language?: string | undefined;
                            microphoneId?: string | undefined;
                            pitch?: number | undefined;
                            rate?: number | undefined;
                            speakerId?: string | undefined;
                            voiceId?: string | undefined;
                            volume?: number | undefined;
                        }) | undefined;
                    }) | undefined;
                    studioId?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
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
        sessions: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("./interview-route-contracts").SessionPayload[];
                };
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
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("./interview-route-contracts").SessionPayload | {
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
        sessions: {
            ":id": {
                response: {
                    post: {
                        body: {
                            response: string;
                        } & {
                            questionId?: string | undefined;
                            questionIndex?: number | undefined;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                            } | {
                                error?: undefined;
                                message: string;
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
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                            } | {
                                error?: undefined;
                                message: string;
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
    };
} & {
    [x: string]: {
        [x: string]: {
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
