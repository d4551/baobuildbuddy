import type { AIChatContext } from "@bao/shared";
export declare const chatContextSchema: import("@sinclair/typebox").TObject<{
    source: import("@sinclair/typebox").TString;
    domain: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    route: import("@sinclair/typebox").TObject<{
        path: import("@sinclair/typebox").TString;
        name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        params: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
        query: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
    }>;
    entity: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TString;
        id: import("@sinclair/typebox").TString;
        label: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    state: import("@sinclair/typebox").TObject<{
        hasResumes: import("@sinclair/typebox").TBoolean;
        resumeCount: import("@sinclair/typebox").TNumber;
        hasJobs: import("@sinclair/typebox").TBoolean;
        jobCount: import("@sinclair/typebox").TNumber;
        hasStudios: import("@sinclair/typebox").TBoolean;
        studioCount: import("@sinclair/typebox").TNumber;
        hasInterviewSessions: import("@sinclair/typebox").TBoolean;
        interviewSessionCount: import("@sinclair/typebox").TNumber;
        hasPortfolioProjects: import("@sinclair/typebox").TBoolean;
        portfolioProjectCount: import("@sinclair/typebox").TNumber;
    }>;
}>;
export declare const aiPreferenceSchema: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean]>>;
export type ChatContextPayload = typeof chatContextSchema.static;
export declare function normalizeClientChatContext(context?: ChatContextPayload): AIChatContext | null;
export declare function serializeClientChatContext(context: AIChatContext): string;
export declare function composeChatSystemPrompt(basePrompt: string, contextualPrompt: string, clientContext: AIChatContext | null): string;
