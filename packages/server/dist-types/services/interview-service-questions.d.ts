import type { InterviewConfig, InterviewQuestion, InterviewResponse } from "@bao/shared/types/interview";
import type { StudioContext } from "./interview-service-contracts";
export declare function generateNextNaturalQuestion(session: {
    config: InterviewConfig;
    responses: InterviewResponse[];
}, studio: StudioContext, latestResponse: InterviewResponse, previousQuestion: InterviewQuestion): Promise<InterviewQuestion | null>;
export declare function generateQuestions(config: InterviewConfig, studio: StudioContext): Promise<InterviewQuestion[]>;
