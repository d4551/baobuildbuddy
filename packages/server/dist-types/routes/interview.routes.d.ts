import { Elysia } from "elysia";
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
                body: {} & {
                    studioId?: string | undefined;
                    config?: ({} & {
                        technologies?: string[] | undefined;
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
                        interviewMode?: "job" | "studio" | undefined;
                        conversationStyle?: "natural" | "structured" | undefined;
                        targetJob?: ({
                            id: string;
                            title: string;
                            company: string;
                            location: string;
                        } & {
                            source?: string | undefined;
                            description?: string | undefined;
                            url?: string | undefined;
                            postedDate?: string | undefined;
                            technologies?: string[] | undefined;
                            requirements?: string[] | undefined;
                        }) | undefined;
                        candidateContext?: ({} & {
                            resumeId?: string | undefined;
                            coverLetterId?: string | undefined;
                            portfolioId?: string | undefined;
                        }) | undefined;
                        voiceSettings?: ({} & {
                            language?: string | undefined;
                            microphoneId?: string | undefined;
                            speakerId?: string | undefined;
                            voiceId?: string | undefined;
                            rate?: number | undefined;
                            pitch?: number | undefined;
                            volume?: number | undefined;
                        }) | undefined;
                    }) | undefined;
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
                    200: import("./interview-route-contracts").SessionPayload[];
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
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("./interview-route-contracts").SessionPayload | {
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
    interview: {
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
                        } & {};
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
