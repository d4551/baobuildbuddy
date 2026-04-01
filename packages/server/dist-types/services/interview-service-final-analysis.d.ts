import type { InterviewAnalysis, InterviewConfig, InterviewResponse } from "@bao/shared/types/interview";
import type { StudioContext } from "./interview-service-contracts";
export declare function generateFinalAnalysis(session: {
    config: InterviewConfig;
    responses: InterviewResponse[];
}, studio: StudioContext): Promise<InterviewAnalysis>;
