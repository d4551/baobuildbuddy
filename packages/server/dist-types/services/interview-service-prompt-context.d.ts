import type { InterviewConfig, InterviewerPersona } from "@bao/shared/types/interview";
import type { CandidateInterviewContext, StudioContext } from "./interview-service-contracts";
export declare function buildCandidatePromptContext(candidateContext: CandidateInterviewContext): string;
export declare function buildStudioPromptContext(studio: StudioContext): string;
export declare function buildJobPromptContext(config: InterviewConfig): string;
export declare function buildInterviewerPersona(studio: StudioContext, config: InterviewConfig): InterviewerPersona;
