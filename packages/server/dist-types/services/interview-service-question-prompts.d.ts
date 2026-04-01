import type { InterviewConfig, InterviewQuestion, InterviewResponse } from "@bao/shared/types/interview";
import type { CandidateInterviewContext, StudioContext } from "./interview-service-contracts";
export declare function buildQuestionGenerationPrompt(studio: StudioContext, config: InterviewConfig, candidateContext: CandidateInterviewContext): string;
export declare function buildSimpleQuestionPrompt(role: string, level: string, count: number): string;
export declare function buildNaturalNextQuestionPrompt(input: {
    studio: StudioContext;
    config: InterviewConfig;
    candidateContext: CandidateInterviewContext;
    previousQuestion: InterviewQuestion;
    latestResponse: InterviewResponse;
    responses: InterviewResponse[];
}): string;
