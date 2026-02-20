import { type InterviewResponse, type InterviewSession } from "@bao/shared";
type InterviewConfigInput = Record<string, unknown>;
/**
 * Interview service layer for session lifecycle and studio-aware analysis.
 */
export declare class InterviewService {
    /**
     * Start a new studio-aware interview session.
     */
    startSession(studioId: string, rawConfig?: InterviewConfigInput): Promise<InterviewSession>;
    /**
     * Fetch all interview sessions in reverse-chronological order.
     */
    getSessions(): Promise<InterviewSession[]>;
    /**
     * Fetch one interview session.
     */
    getSession(id: string): Promise<InterviewSession | null>;
    /**
     * Add one candidate response and generate AI-backed feedback.
     */
    addResponse(sessionId: string, response: InterviewResponse): Promise<InterviewSession | null>;
    /**
     * Mark interview session complete and run final AI summary generation.
     */
    completeSession(id: string): Promise<InterviewSession | null>;
    /**
     * Get summary statistics for interview sessions.
     */
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
export {};
