import { type AIChatContext } from "@bao/shared/types/ai";
import type { Static } from "typebox";
export declare const chatContextSchema: import("typebox").TObject<{
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
}>;
export declare const aiPreferenceSchema: import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean]>>;
export type ChatContextPayload = Static<typeof chatContextSchema>;
export declare function normalizeClientChatContext(context?: ChatContextPayload): AIChatContext | null;
export declare function serializeClientChatContext(context: AIChatContext): string;
export declare function composeChatSystemPrompt(basePrompt: string, contextualPrompt: string, clientContext: AIChatContext | null, entityEnrichment?: string): string;
