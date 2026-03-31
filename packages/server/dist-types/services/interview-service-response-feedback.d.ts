import type { InterviewConfig, InterviewQuestion, InterviewResponse } from "@bao/shared/types/interview";
import type { StudioContext } from "./interview-service-contracts";
export declare function generateResponseFeedback(session: {
    config: InterviewConfig;
    responses: InterviewResponse[];
}, studio: StudioContext, question: InterviewQuestion, transcript: string): Promise<NonNullable<InterviewResponse["aiAnalysis"]>>;
