import { type InterviewAnalysis, type InterviewConfig, type InterviewResponse } from "@bao/shared";
import type { StudioContext } from "./interview-service-contracts";
export declare function generateFinalAnalysis(session: {
    config: InterviewConfig;
    responses: InterviewResponse[];
}, studio: StudioContext): Promise<InterviewAnalysis>;
