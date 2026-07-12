import Type, { type StaticParse } from "baobox";
export declare const interviewWebSocketBodySchema: Type.TObject<{
    readonly type: Type.TString;
    readonly sessionId: Type.TOptional<Type.TString>;
    readonly content: Type.TOptional<Type.TString>;
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
        readonly interviewMode: Type.TOptional<Type.TUnion<(Type.TLiteral<"job"> | Type.TLiteral<"studio">)[]>>;
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
        }, "company" | "id" | "location" | "title", Type.InferOptionalKeys<{
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
        readonly interviewMode: Type.TOptional<Type.TUnion<(Type.TLiteral<"job"> | Type.TLiteral<"studio">)[]>>;
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
        }, "company" | "id" | "location" | "title", Type.InferOptionalKeys<{
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
}, "type", Type.InferOptionalKeys<{
    readonly type: Type.TString;
    readonly sessionId: Type.TOptional<Type.TString>;
    readonly content: Type.TOptional<Type.TString>;
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
        readonly interviewMode: Type.TOptional<Type.TUnion<(Type.TLiteral<"job"> | Type.TLiteral<"studio">)[]>>;
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
        }, "company" | "id" | "location" | "title", Type.InferOptionalKeys<{
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
        readonly interviewMode: Type.TOptional<Type.TUnion<(Type.TLiteral<"job"> | Type.TLiteral<"studio">)[]>>;
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
        }, "company" | "id" | "location" | "title", Type.InferOptionalKeys<{
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
export type InterviewWebSocketBody = StaticParse<typeof interviewWebSocketBodySchema>;
