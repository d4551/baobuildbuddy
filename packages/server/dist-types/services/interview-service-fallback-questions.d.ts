import { type InterviewConfig, type InterviewQuestion, type InterviewResponse } from "@bao/shared";
import type { CandidateInterviewContext, StudioContext } from "./interview-service-contracts";
export declare function buildFallbackQuestions(config: InterviewConfig, studio: StudioContext, candidateContext: CandidateInterviewContext): InterviewQuestion[];
export declare function buildFallbackNaturalQuestion(session: {
    config: InterviewConfig;
    responses: InterviewResponse[];
}, studio: StudioContext, candidateContext: CandidateInterviewContext): InterviewQuestion | null;
