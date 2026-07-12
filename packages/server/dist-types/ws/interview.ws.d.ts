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
                content?: string | undefined;
                sessionId?: string | undefined;
                studioId?: string | undefined;
                type: string;
            };
            params: {};
            query: {};
            headers: {};
            response: {
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
