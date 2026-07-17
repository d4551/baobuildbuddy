import type { Static } from "typebox";
export declare const chatRouteBodySchema: import("typebox").TObject<{
    message: import("typebox").TString;
    sessionId: import("typebox").TOptional<import("typebox").TString>;
    context: import("typebox").TOptional<import("typebox").TObject<{
        source: import("typebox").TString;
        domain: import("typebox").TOptional<import("typebox").TString>;
        route: import("typebox").TObject<{
            path: import("typebox").TString;
            name: import("typebox").TOptional<import("typebox").TString>;
            params: import("typebox").TRecord<"^.*$", import("typebox").TString>;
            query: import("typebox").TRecord<"^.*$", import("typebox").TString>;
        }>;
        entity: import("typebox").TOptional<import("typebox").TObject<{
            type: import("typebox").TString;
            id: import("typebox").TString;
            label: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        state: import("typebox").TObject<{
            hasResumes: import("typebox").TBoolean;
            resumeCount: import("typebox").TNumber;
            hasJobs: import("typebox").TBoolean;
            jobCount: import("typebox").TNumber;
            hasStudios: import("typebox").TBoolean;
            studioCount: import("typebox").TNumber;
            hasInterviewSessions: import("typebox").TBoolean;
            interviewSessionCount: import("typebox").TNumber;
            hasPortfolioProjects: import("typebox").TBoolean;
            portfolioProjectCount: import("typebox").TNumber;
        }>;
    }>>;
}>;
export type ChatRouteBody = Static<typeof chatRouteBodySchema>;
export declare const analyzeResumeRouteBodySchema: import("typebox").TObject<{
    resumeId: import("typebox").TString;
    jobId: import("typebox").TOptional<import("typebox").TString>;
}>;
export type AnalyzeResumeRouteBody = Static<typeof analyzeResumeRouteBodySchema>;
export declare const generateCoverLetterRouteBodySchema: import("typebox").TObject<{
    resumeId: import("typebox").TString;
    jobId: import("typebox").TOptional<import("typebox").TString>;
    company: import("typebox").TString;
    position: import("typebox").TString;
}>;
export type GenerateCoverLetterRouteBody = Static<typeof generateCoverLetterRouteBodySchema>;
export declare const matchJobsRouteBodySchema: import("typebox").TObject<{
    resumeId: import("typebox").TOptional<import("typebox").TString>;
    skills: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    preferences: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean]>>>;
}>;
export type MatchJobsRouteBody = Static<typeof matchJobsRouteBodySchema>;
export declare const automationActionRouteBodySchema: import("typebox").TObject<{
    action: import("typebox").TString;
    jobUrl: import("typebox").TString;
    resumeId: import("typebox").TString;
    coverLetterId: import("typebox").TOptional<import("typebox").TString>;
    jobId: import("typebox").TOptional<import("typebox").TString>;
}>;
export type AutomationActionRouteBody = Static<typeof automationActionRouteBodySchema>;
export type AnalyzeResumeBody = AnalyzeResumeRouteBody;
export type GenerateCoverLetterBody = GenerateCoverLetterRouteBody;
export type MatchJobsBody = MatchJobsRouteBody;
export declare const aiModelsResponseSchema: import("typebox").TObject<{
    aiRouting: import("typebox").TOptional<import("typebox").TObject<{
        chat: import("typebox").TObject<{
            provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
            model: import("typebox").TOptional<import("typebox").TString>;
        }>;
        interviewQuestions: import("typebox").TObject<{
            provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
            model: import("typebox").TOptional<import("typebox").TString>;
        }>;
        interviewFeedback: import("typebox").TObject<{
            provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
            model: import("typebox").TOptional<import("typebox").TString>;
        }>;
        resume: import("typebox").TObject<{
            provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
            model: import("typebox").TOptional<import("typebox").TString>;
        }>;
        coverLetter: import("typebox").TObject<{
            provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
            model: import("typebox").TOptional<import("typebox").TString>;
        }>;
        emailResponse: import("typebox").TObject<{
            provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
            model: import("typebox").TOptional<import("typebox").TString>;
        }>;
        jobMatch: import("typebox").TObject<{
            provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
            model: import("typebox").TOptional<import("typebox").TString>;
        }>;
        scrapeEnrichment: import("typebox").TObject<{
            provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
            model: import("typebox").TOptional<import("typebox").TString>;
        }>;
        automationFieldMapping: import("typebox").TObject<{
            provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
            model: import("typebox").TOptional<import("typebox").TString>;
        }>;
    }>>;
    configuredProviders: import("typebox").TOptional<import("typebox").TArray<import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>>>;
    error: import("typebox").TOptional<import("typebox").TString>;
    preferredModel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    preferredProvider: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>>;
    providerDiagnostics: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TObject<{
        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
        code: import("typebox").TString;
        checkedAt: import("typebox").TString;
        endpoint: import("typebox").TOptional<import("typebox").TString>;
        selectedModel: import("typebox").TOptional<import("typebox").TString>;
        availableModels: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        message: import("typebox").TOptional<import("typebox").TString>;
    }>>>;
    providers: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
        nameKey: import("typebox").TString;
        descriptionKey: import("typebox").TString;
        iconId: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
        models: import("typebox").TArray<import("typebox").TString>;
        available: import("typebox").TBoolean;
        health: import("typebox").TUnion<[import("typebox").TLiteral<"healthy">, import("typebox").TLiteral<"degraded">, import("typebox").TLiteral<"down">, import("typebox").TLiteral<"unconfigured">]>;
        selectedModel: import("typebox").TOptional<import("typebox").TString>;
        diagnosticCode: import("typebox").TOptional<import("typebox").TString>;
        availableModels: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        error: import("typebox").TOptional<import("typebox").TString>;
    }>>;
}>;
export declare const chatRouteResponseSchema: import("typebox").TObject<{
    message: import("typebox").TString;
    sessionId: import("typebox").TString;
    timestamp: import("typebox").TString;
    provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
    model: import("typebox").TString;
    followUps: import("typebox").TArray<import("typebox").TString>;
    contextDomain: import("typebox").TString;
}>;
export declare const resumeAnalysisResultResponseSchema: import("typebox").TObject<{
    score: import("typebox").TNumber;
    strengths: import("typebox").TArray<import("typebox").TString>;
    improvements: import("typebox").TArray<import("typebox").TString>;
    keywords: import("typebox").TArray<import("typebox").TString>;
}>;
export type ResumeAnalysisResult = Static<typeof resumeAnalysisResultResponseSchema>;
export declare const analyzeResumeResponseSchema: import("typebox").TObject<{
    message: import("typebox").TString;
    resumeId: import("typebox").TString;
    jobId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    analysis: import("typebox").TObject<{
        score: import("typebox").TNumber;
        strengths: import("typebox").TArray<import("typebox").TString>;
        improvements: import("typebox").TArray<import("typebox").TString>;
        keywords: import("typebox").TArray<import("typebox").TString>;
    }>;
    provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
    model: import("typebox").TString;
}>;
export declare const coverLetterSectionsResponseSchema: import("typebox").TObject<{
    introduction: import("typebox").TString;
    body: import("typebox").TString;
    conclusion: import("typebox").TString;
}>;
export type CoverLetterSections = Static<typeof coverLetterSectionsResponseSchema>;
export declare const generateCoverLetterResponseSchema: import("typebox").TObject<{
    message: import("typebox").TString;
    content: import("typebox").TObject<{
        introduction: import("typebox").TString;
        body: import("typebox").TString;
        conclusion: import("typebox").TString;
    }>;
    provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
    model: import("typebox").TString;
}>;
export declare const matchJobsResponseSchema: import("typebox").TObject<{
    message: import("typebox").TString;
    matches: import("typebox").TArray<import("typebox").TObject<{
        jobId: import("typebox").TString;
        title: import("typebox").TString;
        company: import("typebox").TString;
        location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        remote: import("typebox").TBoolean;
        score: import("typebox").TNumber;
        strengths: import("typebox").TArray<import("typebox").TString>;
        concerns: import("typebox").TArray<import("typebox").TString>;
        highlightSkills: import("typebox").TArray<import("typebox").TString>;
    }>>;
    recommendations: import("typebox").TArray<import("typebox").TString>;
}>;
export type MatchJobsResponse = Static<typeof matchJobsResponseSchema>;
export declare const aiUsageResponseSchema: import("typebox").TObject<{
    totalMessages: import("typebox").TNumber;
    userMessages: import("typebox").TNumber;
    assistantMessages: import("typebox").TNumber;
    sessions: import("typebox").TNumber;
    recentActivity: import("typebox").TArray<import("typebox").TObject<{
        timestamp: import("typebox").TString;
        role: import("typebox").TString;
        sessionId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    }>>;
}>;
export declare const automationActionResponseSchema: import("typebox").TObject<{
    runId: import("typebox").TString;
    status: import("typebox").TString;
    message: import("typebox").TString;
}>;
export declare const chatRouteResponses: {
    readonly 200: import("typebox").TObject<{
        message: import("typebox").TString;
        sessionId: import("typebox").TString;
        timestamp: import("typebox").TString;
        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
        model: import("typebox").TString;
        followUps: import("typebox").TArray<import("typebox").TString>;
        contextDomain: import("typebox").TString;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
};
export declare const analyzeResumeResponses: {
    readonly 200: import("typebox").TObject<{
        message: import("typebox").TString;
        resumeId: import("typebox").TString;
        jobId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        analysis: import("typebox").TObject<{
            score: import("typebox").TNumber;
            strengths: import("typebox").TArray<import("typebox").TString>;
            improvements: import("typebox").TArray<import("typebox").TString>;
            keywords: import("typebox").TArray<import("typebox").TString>;
        }>;
        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
        model: import("typebox").TString;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
};
export declare const generateCoverLetterResponses: {
    readonly 200: import("typebox").TObject<{
        message: import("typebox").TString;
        content: import("typebox").TObject<{
            introduction: import("typebox").TString;
            body: import("typebox").TString;
            conclusion: import("typebox").TString;
        }>;
        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
        model: import("typebox").TString;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
};
export declare const matchJobsResponses: {
    readonly 200: import("typebox").TObject<{
        message: import("typebox").TString;
        matches: import("typebox").TArray<import("typebox").TObject<{
            jobId: import("typebox").TString;
            title: import("typebox").TString;
            company: import("typebox").TString;
            location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            remote: import("typebox").TBoolean;
            score: import("typebox").TNumber;
            strengths: import("typebox").TArray<import("typebox").TString>;
            concerns: import("typebox").TArray<import("typebox").TString>;
            highlightSkills: import("typebox").TArray<import("typebox").TString>;
        }>>;
        recommendations: import("typebox").TArray<import("typebox").TString>;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
};
export declare const aiModelsResponses: {
    readonly 200: import("typebox").TObject<{
        aiRouting: import("typebox").TOptional<import("typebox").TObject<{
            chat: import("typebox").TObject<{
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                model: import("typebox").TOptional<import("typebox").TString>;
            }>;
            interviewQuestions: import("typebox").TObject<{
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                model: import("typebox").TOptional<import("typebox").TString>;
            }>;
            interviewFeedback: import("typebox").TObject<{
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                model: import("typebox").TOptional<import("typebox").TString>;
            }>;
            resume: import("typebox").TObject<{
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                model: import("typebox").TOptional<import("typebox").TString>;
            }>;
            coverLetter: import("typebox").TObject<{
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                model: import("typebox").TOptional<import("typebox").TString>;
            }>;
            emailResponse: import("typebox").TObject<{
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                model: import("typebox").TOptional<import("typebox").TString>;
            }>;
            jobMatch: import("typebox").TObject<{
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                model: import("typebox").TOptional<import("typebox").TString>;
            }>;
            scrapeEnrichment: import("typebox").TObject<{
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                model: import("typebox").TOptional<import("typebox").TString>;
            }>;
            automationFieldMapping: import("typebox").TObject<{
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                model: import("typebox").TOptional<import("typebox").TString>;
            }>;
        }>>;
        configuredProviders: import("typebox").TOptional<import("typebox").TArray<import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>>>;
        error: import("typebox").TOptional<import("typebox").TString>;
        preferredModel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        preferredProvider: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>>;
        providerDiagnostics: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TObject<{
            provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
            code: import("typebox").TString;
            checkedAt: import("typebox").TString;
            endpoint: import("typebox").TOptional<import("typebox").TString>;
            selectedModel: import("typebox").TOptional<import("typebox").TString>;
            availableModels: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            message: import("typebox").TOptional<import("typebox").TString>;
        }>>>;
        providers: import("typebox").TArray<import("typebox").TObject<{
            id: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
            nameKey: import("typebox").TString;
            descriptionKey: import("typebox").TString;
            iconId: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
            models: import("typebox").TArray<import("typebox").TString>;
            available: import("typebox").TBoolean;
            health: import("typebox").TUnion<[import("typebox").TLiteral<"healthy">, import("typebox").TLiteral<"degraded">, import("typebox").TLiteral<"down">, import("typebox").TLiteral<"unconfigured">]>;
            selectedModel: import("typebox").TOptional<import("typebox").TString>;
            diagnosticCode: import("typebox").TOptional<import("typebox").TString>;
            availableModels: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            error: import("typebox").TOptional<import("typebox").TString>;
        }>>;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
};
export declare const aiUsageResponses: {
    readonly 200: import("typebox").TObject<{
        totalMessages: import("typebox").TNumber;
        userMessages: import("typebox").TNumber;
        assistantMessages: import("typebox").TNumber;
        sessions: import("typebox").TNumber;
        recentActivity: import("typebox").TArray<import("typebox").TObject<{
            timestamp: import("typebox").TString;
            role: import("typebox").TString;
            sessionId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        }>>;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
};
export declare const automationActionResponses: {
    readonly 200: import("typebox").TObject<{
        runId: import("typebox").TString;
        status: import("typebox").TString;
        message: import("typebox").TString;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
};
export declare const usageTailLimit = 10;
