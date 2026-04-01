import type { InterviewConfig, VoiceSettings } from "@bao/shared/types/interview";
import Type, { type StaticParse } from "baobox";
export type CreateSessionConfigInput = Omit<Partial<InterviewConfig>, "voiceSettings"> & {
    voiceSettings?: Partial<VoiceSettings>;
};
export type SessionPayload = Record<string, unknown>;
export type SubmitResponseBody = {
    questionId?: string;
    questionIndex?: number;
    response: string;
};
export type RouteSetState = {
    status?: number | string;
};
export declare const sessionConfigSchema: Type.TObject<{
    readonly roleType: Type.TOptional<Type.TString>;
    readonly roleCategory: Type.TOptional<Type.TString>;
    readonly experienceLevel: Type.TOptional<Type.TString>;
    readonly focusAreas: Type.TOptional<Type.TArray<Type.TString>>;
    readonly duration: Type.TOptional<Type.TInteger>;
    readonly questionCount: Type.TOptional<Type.TInteger>;
    readonly includeTechnical: Type.TOptional<Type.TBoolean>;
    readonly includeBehavioral: Type.TOptional<Type.TBoolean>;
    readonly includeStudioSpecific: Type.TOptional<Type.TBoolean>;
    readonly enableVoiceMode: Type.TOptional<Type.TBoolean>;
    readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
    readonly voiceSettings: Type.TOptional<Type.TObject<{
        readonly microphoneId: Type.TOptional<Type.TString>;
        readonly speakerId: Type.TOptional<Type.TString>;
        readonly voiceId: Type.TOptional<Type.TString>;
        readonly rate: Type.TOptional<Type.TNumber>;
        readonly pitch: Type.TOptional<Type.TNumber>;
        readonly volume: Type.TOptional<Type.TNumber>;
        readonly language: Type.TOptional<Type.TString>;
    }, never, Type.InferOptionalKeys<{
        readonly microphoneId: Type.TOptional<Type.TString>;
        readonly speakerId: Type.TOptional<Type.TString>;
        readonly voiceId: Type.TOptional<Type.TString>;
        readonly rate: Type.TOptional<Type.TNumber>;
        readonly pitch: Type.TOptional<Type.TNumber>;
        readonly volume: Type.TOptional<Type.TNumber>;
        readonly language: Type.TOptional<Type.TString>;
    }>>>;
    readonly interviewMode: Type.TOptional<Type.TUnion<(Type.TLiteral<"studio"> | Type.TLiteral<"job">)[]>>;
    readonly conversationStyle: Type.TOptional<Type.TUnion<(Type.TLiteral<"natural"> | Type.TLiteral<"structured">)[]>>;
    readonly targetJob: Type.TOptional<Type.TObject<{
        readonly id: Type.TString;
        readonly title: Type.TString;
        readonly company: Type.TString;
        readonly location: Type.TString;
        readonly description: Type.TOptional<Type.TString>;
        readonly requirements: Type.TOptional<Type.TArray<Type.TString>>;
        readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
        readonly source: Type.TOptional<Type.TString>;
        readonly postedDate: Type.TOptional<Type.TString>;
        readonly url: Type.TOptional<Type.TString>;
    }, "id" | "company" | "title" | "location", Type.InferOptionalKeys<{
        readonly id: Type.TString;
        readonly title: Type.TString;
        readonly company: Type.TString;
        readonly location: Type.TString;
        readonly description: Type.TOptional<Type.TString>;
        readonly requirements: Type.TOptional<Type.TArray<Type.TString>>;
        readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
        readonly source: Type.TOptional<Type.TString>;
        readonly postedDate: Type.TOptional<Type.TString>;
        readonly url: Type.TOptional<Type.TString>;
    }>>>;
    readonly candidateContext: Type.TOptional<Type.TObject<{
        readonly resumeId: Type.TOptional<Type.TString>;
        readonly coverLetterId: Type.TOptional<Type.TString>;
        readonly portfolioId: Type.TOptional<Type.TString>;
    }, never, Type.InferOptionalKeys<{
        readonly resumeId: Type.TOptional<Type.TString>;
        readonly coverLetterId: Type.TOptional<Type.TString>;
        readonly portfolioId: Type.TOptional<Type.TString>;
    }>>>;
}, never, Type.InferOptionalKeys<{
    readonly roleType: Type.TOptional<Type.TString>;
    readonly roleCategory: Type.TOptional<Type.TString>;
    readonly experienceLevel: Type.TOptional<Type.TString>;
    readonly focusAreas: Type.TOptional<Type.TArray<Type.TString>>;
    readonly duration: Type.TOptional<Type.TInteger>;
    readonly questionCount: Type.TOptional<Type.TInteger>;
    readonly includeTechnical: Type.TOptional<Type.TBoolean>;
    readonly includeBehavioral: Type.TOptional<Type.TBoolean>;
    readonly includeStudioSpecific: Type.TOptional<Type.TBoolean>;
    readonly enableVoiceMode: Type.TOptional<Type.TBoolean>;
    readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
    readonly voiceSettings: Type.TOptional<Type.TObject<{
        readonly microphoneId: Type.TOptional<Type.TString>;
        readonly speakerId: Type.TOptional<Type.TString>;
        readonly voiceId: Type.TOptional<Type.TString>;
        readonly rate: Type.TOptional<Type.TNumber>;
        readonly pitch: Type.TOptional<Type.TNumber>;
        readonly volume: Type.TOptional<Type.TNumber>;
        readonly language: Type.TOptional<Type.TString>;
    }, never, Type.InferOptionalKeys<{
        readonly microphoneId: Type.TOptional<Type.TString>;
        readonly speakerId: Type.TOptional<Type.TString>;
        readonly voiceId: Type.TOptional<Type.TString>;
        readonly rate: Type.TOptional<Type.TNumber>;
        readonly pitch: Type.TOptional<Type.TNumber>;
        readonly volume: Type.TOptional<Type.TNumber>;
        readonly language: Type.TOptional<Type.TString>;
    }>>>;
    readonly interviewMode: Type.TOptional<Type.TUnion<(Type.TLiteral<"studio"> | Type.TLiteral<"job">)[]>>;
    readonly conversationStyle: Type.TOptional<Type.TUnion<(Type.TLiteral<"natural"> | Type.TLiteral<"structured">)[]>>;
    readonly targetJob: Type.TOptional<Type.TObject<{
        readonly id: Type.TString;
        readonly title: Type.TString;
        readonly company: Type.TString;
        readonly location: Type.TString;
        readonly description: Type.TOptional<Type.TString>;
        readonly requirements: Type.TOptional<Type.TArray<Type.TString>>;
        readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
        readonly source: Type.TOptional<Type.TString>;
        readonly postedDate: Type.TOptional<Type.TString>;
        readonly url: Type.TOptional<Type.TString>;
    }, "id" | "company" | "title" | "location", Type.InferOptionalKeys<{
        readonly id: Type.TString;
        readonly title: Type.TString;
        readonly company: Type.TString;
        readonly location: Type.TString;
        readonly description: Type.TOptional<Type.TString>;
        readonly requirements: Type.TOptional<Type.TArray<Type.TString>>;
        readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
        readonly source: Type.TOptional<Type.TString>;
        readonly postedDate: Type.TOptional<Type.TString>;
        readonly url: Type.TOptional<Type.TString>;
    }>>>;
    readonly candidateContext: Type.TOptional<Type.TObject<{
        readonly resumeId: Type.TOptional<Type.TString>;
        readonly coverLetterId: Type.TOptional<Type.TString>;
        readonly portfolioId: Type.TOptional<Type.TString>;
    }, never, Type.InferOptionalKeys<{
        readonly resumeId: Type.TOptional<Type.TString>;
        readonly coverLetterId: Type.TOptional<Type.TString>;
        readonly portfolioId: Type.TOptional<Type.TString>;
    }>>>;
}>>;
export declare const createSessionBodySchema: Type.TObject<{
    readonly studioId: Type.TOptional<Type.TString>;
    readonly config: Type.TOptional<Type.TObject<{
        readonly roleType: Type.TOptional<Type.TString>;
        readonly roleCategory: Type.TOptional<Type.TString>;
        readonly experienceLevel: Type.TOptional<Type.TString>;
        readonly focusAreas: Type.TOptional<Type.TArray<Type.TString>>;
        readonly duration: Type.TOptional<Type.TInteger>;
        readonly questionCount: Type.TOptional<Type.TInteger>;
        readonly includeTechnical: Type.TOptional<Type.TBoolean>;
        readonly includeBehavioral: Type.TOptional<Type.TBoolean>;
        readonly includeStudioSpecific: Type.TOptional<Type.TBoolean>;
        readonly enableVoiceMode: Type.TOptional<Type.TBoolean>;
        readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
        readonly voiceSettings: Type.TOptional<Type.TObject<{
            readonly microphoneId: Type.TOptional<Type.TString>;
            readonly speakerId: Type.TOptional<Type.TString>;
            readonly voiceId: Type.TOptional<Type.TString>;
            readonly rate: Type.TOptional<Type.TNumber>;
            readonly pitch: Type.TOptional<Type.TNumber>;
            readonly volume: Type.TOptional<Type.TNumber>;
            readonly language: Type.TOptional<Type.TString>;
        }, never, Type.InferOptionalKeys<{
            readonly microphoneId: Type.TOptional<Type.TString>;
            readonly speakerId: Type.TOptional<Type.TString>;
            readonly voiceId: Type.TOptional<Type.TString>;
            readonly rate: Type.TOptional<Type.TNumber>;
            readonly pitch: Type.TOptional<Type.TNumber>;
            readonly volume: Type.TOptional<Type.TNumber>;
            readonly language: Type.TOptional<Type.TString>;
        }>>>;
        readonly interviewMode: Type.TOptional<Type.TUnion<(Type.TLiteral<"studio"> | Type.TLiteral<"job">)[]>>;
        readonly conversationStyle: Type.TOptional<Type.TUnion<(Type.TLiteral<"natural"> | Type.TLiteral<"structured">)[]>>;
        readonly targetJob: Type.TOptional<Type.TObject<{
            readonly id: Type.TString;
            readonly title: Type.TString;
            readonly company: Type.TString;
            readonly location: Type.TString;
            readonly description: Type.TOptional<Type.TString>;
            readonly requirements: Type.TOptional<Type.TArray<Type.TString>>;
            readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
            readonly source: Type.TOptional<Type.TString>;
            readonly postedDate: Type.TOptional<Type.TString>;
            readonly url: Type.TOptional<Type.TString>;
        }, "id" | "company" | "title" | "location", Type.InferOptionalKeys<{
            readonly id: Type.TString;
            readonly title: Type.TString;
            readonly company: Type.TString;
            readonly location: Type.TString;
            readonly description: Type.TOptional<Type.TString>;
            readonly requirements: Type.TOptional<Type.TArray<Type.TString>>;
            readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
            readonly source: Type.TOptional<Type.TString>;
            readonly postedDate: Type.TOptional<Type.TString>;
            readonly url: Type.TOptional<Type.TString>;
        }>>>;
        readonly candidateContext: Type.TOptional<Type.TObject<{
            readonly resumeId: Type.TOptional<Type.TString>;
            readonly coverLetterId: Type.TOptional<Type.TString>;
            readonly portfolioId: Type.TOptional<Type.TString>;
        }, never, Type.InferOptionalKeys<{
            readonly resumeId: Type.TOptional<Type.TString>;
            readonly coverLetterId: Type.TOptional<Type.TString>;
            readonly portfolioId: Type.TOptional<Type.TString>;
        }>>>;
    }, never, Type.InferOptionalKeys<{
        readonly roleType: Type.TOptional<Type.TString>;
        readonly roleCategory: Type.TOptional<Type.TString>;
        readonly experienceLevel: Type.TOptional<Type.TString>;
        readonly focusAreas: Type.TOptional<Type.TArray<Type.TString>>;
        readonly duration: Type.TOptional<Type.TInteger>;
        readonly questionCount: Type.TOptional<Type.TInteger>;
        readonly includeTechnical: Type.TOptional<Type.TBoolean>;
        readonly includeBehavioral: Type.TOptional<Type.TBoolean>;
        readonly includeStudioSpecific: Type.TOptional<Type.TBoolean>;
        readonly enableVoiceMode: Type.TOptional<Type.TBoolean>;
        readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
        readonly voiceSettings: Type.TOptional<Type.TObject<{
            readonly microphoneId: Type.TOptional<Type.TString>;
            readonly speakerId: Type.TOptional<Type.TString>;
            readonly voiceId: Type.TOptional<Type.TString>;
            readonly rate: Type.TOptional<Type.TNumber>;
            readonly pitch: Type.TOptional<Type.TNumber>;
            readonly volume: Type.TOptional<Type.TNumber>;
            readonly language: Type.TOptional<Type.TString>;
        }, never, Type.InferOptionalKeys<{
            readonly microphoneId: Type.TOptional<Type.TString>;
            readonly speakerId: Type.TOptional<Type.TString>;
            readonly voiceId: Type.TOptional<Type.TString>;
            readonly rate: Type.TOptional<Type.TNumber>;
            readonly pitch: Type.TOptional<Type.TNumber>;
            readonly volume: Type.TOptional<Type.TNumber>;
            readonly language: Type.TOptional<Type.TString>;
        }>>>;
        readonly interviewMode: Type.TOptional<Type.TUnion<(Type.TLiteral<"studio"> | Type.TLiteral<"job">)[]>>;
        readonly conversationStyle: Type.TOptional<Type.TUnion<(Type.TLiteral<"natural"> | Type.TLiteral<"structured">)[]>>;
        readonly targetJob: Type.TOptional<Type.TObject<{
            readonly id: Type.TString;
            readonly title: Type.TString;
            readonly company: Type.TString;
            readonly location: Type.TString;
            readonly description: Type.TOptional<Type.TString>;
            readonly requirements: Type.TOptional<Type.TArray<Type.TString>>;
            readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
            readonly source: Type.TOptional<Type.TString>;
            readonly postedDate: Type.TOptional<Type.TString>;
            readonly url: Type.TOptional<Type.TString>;
        }, "id" | "company" | "title" | "location", Type.InferOptionalKeys<{
            readonly id: Type.TString;
            readonly title: Type.TString;
            readonly company: Type.TString;
            readonly location: Type.TString;
            readonly description: Type.TOptional<Type.TString>;
            readonly requirements: Type.TOptional<Type.TArray<Type.TString>>;
            readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
            readonly source: Type.TOptional<Type.TString>;
            readonly postedDate: Type.TOptional<Type.TString>;
            readonly url: Type.TOptional<Type.TString>;
        }>>>;
        readonly candidateContext: Type.TOptional<Type.TObject<{
            readonly resumeId: Type.TOptional<Type.TString>;
            readonly coverLetterId: Type.TOptional<Type.TString>;
            readonly portfolioId: Type.TOptional<Type.TString>;
        }, never, Type.InferOptionalKeys<{
            readonly resumeId: Type.TOptional<Type.TString>;
            readonly coverLetterId: Type.TOptional<Type.TString>;
            readonly portfolioId: Type.TOptional<Type.TString>;
        }>>>;
    }>>>;
}, never, Type.InferOptionalKeys<{
    readonly studioId: Type.TOptional<Type.TString>;
    readonly config: Type.TOptional<Type.TObject<{
        readonly roleType: Type.TOptional<Type.TString>;
        readonly roleCategory: Type.TOptional<Type.TString>;
        readonly experienceLevel: Type.TOptional<Type.TString>;
        readonly focusAreas: Type.TOptional<Type.TArray<Type.TString>>;
        readonly duration: Type.TOptional<Type.TInteger>;
        readonly questionCount: Type.TOptional<Type.TInteger>;
        readonly includeTechnical: Type.TOptional<Type.TBoolean>;
        readonly includeBehavioral: Type.TOptional<Type.TBoolean>;
        readonly includeStudioSpecific: Type.TOptional<Type.TBoolean>;
        readonly enableVoiceMode: Type.TOptional<Type.TBoolean>;
        readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
        readonly voiceSettings: Type.TOptional<Type.TObject<{
            readonly microphoneId: Type.TOptional<Type.TString>;
            readonly speakerId: Type.TOptional<Type.TString>;
            readonly voiceId: Type.TOptional<Type.TString>;
            readonly rate: Type.TOptional<Type.TNumber>;
            readonly pitch: Type.TOptional<Type.TNumber>;
            readonly volume: Type.TOptional<Type.TNumber>;
            readonly language: Type.TOptional<Type.TString>;
        }, never, Type.InferOptionalKeys<{
            readonly microphoneId: Type.TOptional<Type.TString>;
            readonly speakerId: Type.TOptional<Type.TString>;
            readonly voiceId: Type.TOptional<Type.TString>;
            readonly rate: Type.TOptional<Type.TNumber>;
            readonly pitch: Type.TOptional<Type.TNumber>;
            readonly volume: Type.TOptional<Type.TNumber>;
            readonly language: Type.TOptional<Type.TString>;
        }>>>;
        readonly interviewMode: Type.TOptional<Type.TUnion<(Type.TLiteral<"studio"> | Type.TLiteral<"job">)[]>>;
        readonly conversationStyle: Type.TOptional<Type.TUnion<(Type.TLiteral<"natural"> | Type.TLiteral<"structured">)[]>>;
        readonly targetJob: Type.TOptional<Type.TObject<{
            readonly id: Type.TString;
            readonly title: Type.TString;
            readonly company: Type.TString;
            readonly location: Type.TString;
            readonly description: Type.TOptional<Type.TString>;
            readonly requirements: Type.TOptional<Type.TArray<Type.TString>>;
            readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
            readonly source: Type.TOptional<Type.TString>;
            readonly postedDate: Type.TOptional<Type.TString>;
            readonly url: Type.TOptional<Type.TString>;
        }, "id" | "company" | "title" | "location", Type.InferOptionalKeys<{
            readonly id: Type.TString;
            readonly title: Type.TString;
            readonly company: Type.TString;
            readonly location: Type.TString;
            readonly description: Type.TOptional<Type.TString>;
            readonly requirements: Type.TOptional<Type.TArray<Type.TString>>;
            readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
            readonly source: Type.TOptional<Type.TString>;
            readonly postedDate: Type.TOptional<Type.TString>;
            readonly url: Type.TOptional<Type.TString>;
        }>>>;
        readonly candidateContext: Type.TOptional<Type.TObject<{
            readonly resumeId: Type.TOptional<Type.TString>;
            readonly coverLetterId: Type.TOptional<Type.TString>;
            readonly portfolioId: Type.TOptional<Type.TString>;
        }, never, Type.InferOptionalKeys<{
            readonly resumeId: Type.TOptional<Type.TString>;
            readonly coverLetterId: Type.TOptional<Type.TString>;
            readonly portfolioId: Type.TOptional<Type.TString>;
        }>>>;
    }, never, Type.InferOptionalKeys<{
        readonly roleType: Type.TOptional<Type.TString>;
        readonly roleCategory: Type.TOptional<Type.TString>;
        readonly experienceLevel: Type.TOptional<Type.TString>;
        readonly focusAreas: Type.TOptional<Type.TArray<Type.TString>>;
        readonly duration: Type.TOptional<Type.TInteger>;
        readonly questionCount: Type.TOptional<Type.TInteger>;
        readonly includeTechnical: Type.TOptional<Type.TBoolean>;
        readonly includeBehavioral: Type.TOptional<Type.TBoolean>;
        readonly includeStudioSpecific: Type.TOptional<Type.TBoolean>;
        readonly enableVoiceMode: Type.TOptional<Type.TBoolean>;
        readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
        readonly voiceSettings: Type.TOptional<Type.TObject<{
            readonly microphoneId: Type.TOptional<Type.TString>;
            readonly speakerId: Type.TOptional<Type.TString>;
            readonly voiceId: Type.TOptional<Type.TString>;
            readonly rate: Type.TOptional<Type.TNumber>;
            readonly pitch: Type.TOptional<Type.TNumber>;
            readonly volume: Type.TOptional<Type.TNumber>;
            readonly language: Type.TOptional<Type.TString>;
        }, never, Type.InferOptionalKeys<{
            readonly microphoneId: Type.TOptional<Type.TString>;
            readonly speakerId: Type.TOptional<Type.TString>;
            readonly voiceId: Type.TOptional<Type.TString>;
            readonly rate: Type.TOptional<Type.TNumber>;
            readonly pitch: Type.TOptional<Type.TNumber>;
            readonly volume: Type.TOptional<Type.TNumber>;
            readonly language: Type.TOptional<Type.TString>;
        }>>>;
        readonly interviewMode: Type.TOptional<Type.TUnion<(Type.TLiteral<"studio"> | Type.TLiteral<"job">)[]>>;
        readonly conversationStyle: Type.TOptional<Type.TUnion<(Type.TLiteral<"natural"> | Type.TLiteral<"structured">)[]>>;
        readonly targetJob: Type.TOptional<Type.TObject<{
            readonly id: Type.TString;
            readonly title: Type.TString;
            readonly company: Type.TString;
            readonly location: Type.TString;
            readonly description: Type.TOptional<Type.TString>;
            readonly requirements: Type.TOptional<Type.TArray<Type.TString>>;
            readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
            readonly source: Type.TOptional<Type.TString>;
            readonly postedDate: Type.TOptional<Type.TString>;
            readonly url: Type.TOptional<Type.TString>;
        }, "id" | "company" | "title" | "location", Type.InferOptionalKeys<{
            readonly id: Type.TString;
            readonly title: Type.TString;
            readonly company: Type.TString;
            readonly location: Type.TString;
            readonly description: Type.TOptional<Type.TString>;
            readonly requirements: Type.TOptional<Type.TArray<Type.TString>>;
            readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
            readonly source: Type.TOptional<Type.TString>;
            readonly postedDate: Type.TOptional<Type.TString>;
            readonly url: Type.TOptional<Type.TString>;
        }>>>;
        readonly candidateContext: Type.TOptional<Type.TObject<{
            readonly resumeId: Type.TOptional<Type.TString>;
            readonly coverLetterId: Type.TOptional<Type.TString>;
            readonly portfolioId: Type.TOptional<Type.TString>;
        }, never, Type.InferOptionalKeys<{
            readonly resumeId: Type.TOptional<Type.TString>;
            readonly coverLetterId: Type.TOptional<Type.TString>;
            readonly portfolioId: Type.TOptional<Type.TString>;
        }>>>;
    }>>>;
}>>;
export type CreateSessionBody = StaticParse<typeof createSessionBodySchema>;
export declare const interviewSessionParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export type InterviewSessionParams = StaticParse<typeof interviewSessionParamsSchema>;
export declare const submitResponseBodySchema: Type.TObject<{
    readonly questionId: Type.TOptional<Type.TString>;
    readonly questionIndex: Type.TOptional<Type.TInteger>;
    readonly response: Type.TString;
}, "response", Type.InferOptionalKeys<{
    readonly questionId: Type.TOptional<Type.TString>;
    readonly questionIndex: Type.TOptional<Type.TInteger>;
    readonly response: Type.TString;
}>>;
export type SubmitResponseRouteBody = StaticParse<typeof submitResponseBodySchema>;
