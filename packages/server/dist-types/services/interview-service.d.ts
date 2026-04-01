import type { InterviewResponse, InterviewSession } from "@bao/shared/types/interview";
import type { InterviewConfigInput } from "./interview-service-contracts";
export declare class InterviewService {
    startSession(studioId: string, rawConfig?: InterviewConfigInput): Promise<InterviewSession>;
    getSessions(): Promise<InterviewSession[]>;
    getSession(id: string): Promise<InterviewSession | null>;
    private selectQuestionForResponse;
    private buildAnalyzedResponse;
    private persistSessionResponses;
    private persistFinalAnalysis;
    addResponse(sessionId: string, response: InterviewResponse): Promise<InterviewSession | null>;
    completeSession(id: string): Promise<InterviewSession | null>;
    getStats(): Promise<{
        totalInterviews: number;
        completedInterviews: number;
        averageScore: number;
        strongestAreas: string[];
        improvementAreas: string[];
        totalTimeSpent: number;
        favoriteStudios: string[];
    }>;
}
export declare const interviewService: InterviewService;
