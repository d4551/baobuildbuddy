import { interviewService } from "../services/interview-service";

export const getInterviewStats = async () => {
  const sessions = await interviewService.getSessions();
  const completedSessions = sessions.filter((session) => session.status === "completed");

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    inProgressSessions: sessions.filter((session) => session.status === "active").length,
    averageQuestions:
      sessions.length > 0
        ? sessions.reduce((sum, session) => sum + session.questions.length, 0) / sessions.length
        : 0,
    averageResponses:
      sessions.length > 0
        ? sessions.reduce((sum, session) => sum + session.responses.length, 0) / sessions.length
        : 0,
    totalInterviews: sessions.length,
    completedInterviews: completedSessions.length,
    averageScore:
      completedSessions.length > 0
        ? Math.round(
            completedSessions.reduce(
              (sum, session) => sum + (session.finalAnalysis?.overallScore || 0),
              0,
            ) / completedSessions.length,
          )
        : 0,
    improvementTrend: 0,
  };
};
