export declare const getInterviewStats: () => Promise<{
    totalSessions: number;
    completedSessions: number;
    inProgressSessions: number;
    averageQuestions: number;
    averageResponses: number;
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    improvementTrend: number;
}>;
