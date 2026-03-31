import { Elysia } from "elysia";
export declare const interviewWebSocket: Elysia<"", {
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
        subscribe: {
            body: {
                content?: string | undefined;
                type?: string | undefined;
                sessionId?: string | undefined;
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
            query: {};
            headers: {};
            response: {
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
