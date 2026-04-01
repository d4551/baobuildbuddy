import type { InterviewSession } from "@bao/shared/types/interview";
export declare function calculateInterviewStats(sessions: InterviewSession[]): {
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    strongestAreas: string[];
    improvementAreas: string[];
    totalTimeSpent: number;
    favoriteStudios: string[];
};
