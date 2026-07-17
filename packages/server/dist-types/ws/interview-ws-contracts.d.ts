import type { Static } from "typebox";
export declare const interviewWebSocketBodySchema: import("typebox").TObject<{
    type: import("typebox").TString;
    sessionId: import("typebox").TOptional<import("typebox").TString>;
    content: import("typebox").TOptional<import("typebox").TString>;
    studioId: import("typebox").TOptional<import("typebox").TString>;
    config: import("typebox").TOptional<import("typebox").TObject<{
        roleType: import("typebox").TOptional<import("typebox").TString>;
        roleCategory: import("typebox").TOptional<import("typebox").TString>;
        experienceLevel: import("typebox").TOptional<import("typebox").TString>;
        focusAreas: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        duration: import("typebox").TOptional<import("typebox").TInteger>;
        questionCount: import("typebox").TOptional<import("typebox").TInteger>;
        includeTechnical: import("typebox").TOptional<import("typebox").TBoolean>;
        includeBehavioral: import("typebox").TOptional<import("typebox").TBoolean>;
        includeStudioSpecific: import("typebox").TOptional<import("typebox").TBoolean>;
        enableVoiceMode: import("typebox").TOptional<import("typebox").TBoolean>;
        technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        voiceSettings: import("typebox").TOptional<import("typebox").TObject<{
            microphoneId: import("typebox").TOptional<import("typebox").TString>;
            speakerId: import("typebox").TOptional<import("typebox").TString>;
            voiceId: import("typebox").TOptional<import("typebox").TString>;
            rate: import("typebox").TOptional<import("typebox").TNumber>;
            pitch: import("typebox").TOptional<import("typebox").TNumber>;
            volume: import("typebox").TOptional<import("typebox").TNumber>;
            language: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        interviewMode: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"studio">, import("typebox").TLiteral<"job">]>>;
        conversationStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"natural">, import("typebox").TLiteral<"structured">]>>;
        targetJob: import("typebox").TOptional<import("typebox").TObject<{
            id: import("typebox").TString;
            title: import("typebox").TString;
            company: import("typebox").TString;
            location: import("typebox").TString;
            description: import("typebox").TOptional<import("typebox").TString>;
            requirements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            source: import("typebox").TOptional<import("typebox").TString>;
            postedDate: import("typebox").TOptional<import("typebox").TString>;
            url: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        candidateContext: import("typebox").TOptional<import("typebox").TObject<{
            resumeId: import("typebox").TOptional<import("typebox").TString>;
            coverLetterId: import("typebox").TOptional<import("typebox").TString>;
            portfolioId: import("typebox").TOptional<import("typebox").TString>;
        }>>;
    }>>;
}>;
export type InterviewWebSocketBody = Static<typeof interviewWebSocketBodySchema>;
