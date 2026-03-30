import type { InterviewConfig, VoiceSettings } from "@bao/shared";
export type CreateSessionConfigInput = Omit<Partial<InterviewConfig>, "voiceSettings"> & {
    voiceSettings?: Partial<VoiceSettings>;
};
export type SessionPayload = Record<string, unknown>;
export type SubmitResponseBody = {
    questionId?: string;
    questionIndex?: number;
    response: string;
};
export declare const sessionConfigSchema: import("@sinclair/typebox").TObject<{
    roleType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    roleCategory: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    experienceLevel: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    focusAreas: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    duration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
    questionCount: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
    includeTechnical: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    includeBehavioral: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    includeStudioSpecific: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    enableVoiceMode: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    technologies: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    voiceSettings: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        microphoneId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        speakerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        voiceId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        rate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        pitch: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        volume: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        language: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    interviewMode: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"studio">, import("@sinclair/typebox").TLiteral<"job">]>>;
    conversationStyle: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"natural">, import("@sinclair/typebox").TLiteral<"structured">]>>;
    targetJob: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        title: import("@sinclair/typebox").TString;
        company: import("@sinclair/typebox").TString;
        location: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        requirements: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
        technologies: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
        source: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        postedDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        url: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    candidateContext: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        resumeId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        coverLetterId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        portfolioId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
}>;
export declare const createSessionBodySchema: import("@sinclair/typebox").TObject<{
    studioId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    config: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        roleType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        roleCategory: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        experienceLevel: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        focusAreas: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
        duration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
        questionCount: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
        includeTechnical: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        includeBehavioral: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        includeStudioSpecific: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        enableVoiceMode: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        technologies: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
        voiceSettings: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            microphoneId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            speakerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            voiceId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            rate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            pitch: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            volume: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            language: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        interviewMode: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"studio">, import("@sinclair/typebox").TLiteral<"job">]>>;
        conversationStyle: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"natural">, import("@sinclair/typebox").TLiteral<"structured">]>>;
        targetJob: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            id: import("@sinclair/typebox").TString;
            title: import("@sinclair/typebox").TString;
            company: import("@sinclair/typebox").TString;
            location: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            requirements: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
            technologies: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
            source: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            postedDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            url: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        candidateContext: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            resumeId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            coverLetterId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            portfolioId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
    }>>;
}>;
export declare const interviewSessionParamsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
}>;
export declare const submitResponseBodySchema: import("@sinclair/typebox").TObject<{
    questionId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    questionIndex: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
    response: import("@sinclair/typebox").TString;
}>;
