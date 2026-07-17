import type { Static } from "typebox";
import type { InterviewConfig, InterviewSession, VoiceSettings } from "@bao/shared/types/interview";
export type CreateSessionConfigInput = Omit<Partial<InterviewConfig>, "voiceSettings"> & {
    voiceSettings?: Partial<VoiceSettings>;
};
export type SessionPayload = InterviewSession & {
    message?: string;
};
export type SubmitResponseBody = {
    questionId?: string;
    questionIndex?: number;
    response: string;
};
export declare const sessionConfigSchema: import("typebox").TObject<{
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
}>;
export declare const createSessionBodySchema: import("typebox").TObject<{
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
export type CreateSessionBody = Static<typeof createSessionBodySchema>;
export declare const interviewSessionParamsSchema: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export type InterviewSessionParams = Static<typeof interviewSessionParamsSchema>;
export declare const submitResponseBodySchema: import("typebox").TObject<{
    questionId: import("typebox").TOptional<import("typebox").TString>;
    questionIndex: import("typebox").TOptional<import("typebox").TInteger>;
    response: import("typebox").TString;
}>;
export type SubmitResponseRouteBody = Static<typeof submitResponseBodySchema>;
export declare const interviewSessionResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    studioId: import("typebox").TString;
    config: import("typebox").TObject<{
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
    }>;
    questions: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        type: import("typebox").TUnion<[import("typebox").TLiteral<"behavioral">, import("typebox").TLiteral<"technical">, import("typebox").TLiteral<"studio-specific">, import("typebox").TLiteral<"intro">, import("typebox").TLiteral<"closing">]>;
        question: import("typebox").TString;
        followUps: import("typebox").TArray<import("typebox").TString>;
        expectedDuration: import("typebox").TNumber;
        difficulty: import("typebox").TUnion<[import("typebox").TLiteral<"easy">, import("typebox").TLiteral<"medium">, import("typebox").TLiteral<"hard">]>;
        tags: import("typebox").TArray<import("typebox").TString>;
        score: import("typebox").TOptional<import("typebox").TNumber>;
        feedback: import("typebox").TOptional<import("typebox").TString>;
        response: import("typebox").TOptional<import("typebox").TString>;
    }>>;
    currentQuestionIndex: import("typebox").TNumber;
    totalQuestions: import("typebox").TNumber;
    startTime: import("typebox").TNumber;
    endTime: import("typebox").TOptional<import("typebox").TNumber>;
    status: import("typebox").TUnion<[import("typebox").TLiteral<"preparing">, import("typebox").TLiteral<"active">, import("typebox").TLiteral<"paused">, import("typebox").TLiteral<"completed">, import("typebox").TLiteral<"cancelled">]>;
    responses: import("typebox").TArray<import("typebox").TObject<{
        questionId: import("typebox").TString;
        transcript: import("typebox").TString;
        duration: import("typebox").TNumber;
        timestamp: import("typebox").TNumber;
        confidence: import("typebox").TNumber;
        aiAnalysis: import("typebox").TOptional<import("typebox").TObject<{
            score: import("typebox").TNumber;
            feedback: import("typebox").TString;
            strengths: import("typebox").TArray<import("typebox").TString>;
            improvements: import("typebox").TArray<import("typebox").TString>;
        }>>;
    }>>;
    finalAnalysis: import("typebox").TOptional<import("typebox").TObject<{
        overallScore: import("typebox").TNumber;
        strengths: import("typebox").TArray<import("typebox").TString>;
        improvements: import("typebox").TArray<import("typebox").TString>;
        recommendations: import("typebox").TArray<import("typebox").TString>;
        feedback: import("typebox").TOptional<import("typebox").TString>;
    }>>;
    interviewerPersona: import("typebox").TOptional<import("typebox").TObject<{
        name: import("typebox").TString;
        role: import("typebox").TString;
        studioName: import("typebox").TString;
        background: import("typebox").TString;
        style: import("typebox").TString;
        experience: import("typebox").TString;
    }>>;
    role: import("typebox").TOptional<import("typebox").TString>;
    studioName: import("typebox").TOptional<import("typebox").TString>;
    score: import("typebox").TOptional<import("typebox").TNumber>;
    duration: import("typebox").TOptional<import("typebox").TString>;
    overallFeedback: import("typebox").TOptional<import("typebox").TString>;
    totalResponses: import("typebox").TOptional<import("typebox").TNumber>;
    createdAt: import("typebox").TOptional<import("typebox").TString>;
    updatedAt: import("typebox").TOptional<import("typebox").TString>;
    message: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const interviewStatsResponseSchema: import("typebox").TObject<{
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
export declare const createInterviewSessionResponses: {
    201: import("typebox").TUnknown;
};
export declare const interviewSessionsListResponses: {
    200: import("typebox").TUnknown;
};
export declare const interviewSessionResponses: {
    200: import("typebox").TUnknown;
    404: import("typebox").TUnknown;
};
export declare const submitInterviewResponseResponses: {
    200: import("typebox").TUnknown;
    400: import("typebox").TUnknown;
    404: import("typebox").TUnknown;
};
export declare const completeInterviewSessionResponses: {
    200: import("typebox").TUnknown;
    404: import("typebox").TUnknown;
};
export declare const interviewStatsResponses: {
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
