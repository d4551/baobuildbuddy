import { type AIChatContext } from "@bao/shared/types/ai";
import Type, { type StaticParse } from "baobox";
export declare const chatContextSchema: Type.TObject<{
    readonly source: Type.TString;
    readonly domain: Type.TOptional<Type.TString>;
    readonly route: Type.TObject<{
        readonly path: Type.TString;
        readonly name: Type.TOptional<Type.TString>;
        readonly params: Type.TRecord<Type.TString, Type.TString>;
        readonly query: Type.TRecord<Type.TString, Type.TString>;
    }, "path" | "params" | "query", never>;
    readonly entity: Type.TOptional<Type.TObject<{
        readonly type: Type.TString;
        readonly id: Type.TString;
        readonly label: Type.TOptional<Type.TString>;
    }, "id" | "type", never>>;
    readonly state: Type.TObject<{
        readonly hasResumes: Type.TBoolean;
        readonly resumeCount: Type.TNumber;
        readonly hasJobs: Type.TBoolean;
        readonly jobCount: Type.TNumber;
        readonly hasStudios: Type.TBoolean;
        readonly studioCount: Type.TNumber;
        readonly hasInterviewSessions: Type.TBoolean;
        readonly interviewSessionCount: Type.TNumber;
        readonly hasPortfolioProjects: Type.TBoolean;
        readonly portfolioProjectCount: Type.TNumber;
    }, "hasResumes" | "resumeCount" | "hasJobs" | "jobCount" | "hasStudios" | "studioCount" | "hasInterviewSessions" | "interviewSessionCount" | "hasPortfolioProjects" | "portfolioProjectCount", never>;
}, "source" | "route" | "state", never>;
export declare const aiPreferenceSchema: Type.TRecord<Type.TString, Type.TUnion<(Type.TString | Type.TBoolean | Type.TNumber)[]>>;
export type ChatContextPayload = StaticParse<typeof chatContextSchema>;
export declare function normalizeClientChatContext(context?: ChatContextPayload): AIChatContext | null;
export declare function serializeClientChatContext(context: AIChatContext): string;
export declare function composeChatSystemPrompt(basePrompt: string, contextualPrompt: string, clientContext: AIChatContext | null): string;
