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
    }, "params" | "path" | "query", "name">;
    readonly entity: Type.TOptional<Type.TObject<{
        readonly type: Type.TString;
        readonly id: Type.TString;
        readonly label: Type.TOptional<Type.TString>;
    }, "id" | "type", "label">>;
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
    }, "hasInterviewSessions" | "hasJobs" | "hasPortfolioProjects" | "hasResumes" | "hasStudios" | "interviewSessionCount" | "jobCount" | "portfolioProjectCount" | "resumeCount" | "studioCount", never>;
}, "route" | "source" | "state", Type.InferOptionalKeys<{
    readonly source: Type.TString;
    readonly domain: Type.TOptional<Type.TString>;
    readonly route: Type.TObject<{
        readonly path: Type.TString;
        readonly name: Type.TOptional<Type.TString>;
        readonly params: Type.TRecord<Type.TString, Type.TString>;
        readonly query: Type.TRecord<Type.TString, Type.TString>;
    }, "params" | "path" | "query", "name">;
    readonly entity: Type.TOptional<Type.TObject<{
        readonly type: Type.TString;
        readonly id: Type.TString;
        readonly label: Type.TOptional<Type.TString>;
    }, "id" | "type", "label">>;
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
    }, "hasInterviewSessions" | "hasJobs" | "hasPortfolioProjects" | "hasResumes" | "hasStudios" | "interviewSessionCount" | "jobCount" | "portfolioProjectCount" | "resumeCount" | "studioCount", never>;
}>>;
export declare const aiPreferenceSchema: Type.TRecord<Type.TString, Type.TUnion<(Type.TBoolean | Type.TNumber | Type.TString)[]>>;
export type ChatContextPayload = StaticParse<typeof chatContextSchema>;
export declare function normalizeClientChatContext(context?: ChatContextPayload): AIChatContext | null;
export declare function serializeClientChatContext(context: AIChatContext): string;
export declare function composeChatSystemPrompt(basePrompt: string, contextualPrompt: string, clientContext: AIChatContext | null): string;
