import { type InterviewConfig } from "@bao/shared";
import { AIService } from "./ai/ai-service";
import type { CandidateInterviewContext, StudioContext } from "./interview-service-contracts";
export declare function resolveStudioContext(studioId: string): Promise<StudioContext>;
export declare function createAIService(): Promise<AIService>;
export declare function resolveCandidateInterviewContext(config: InterviewConfig): Promise<CandidateInterviewContext>;
