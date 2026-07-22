import type { InterviewSession } from "@bao/shared/types/interview";
const NUM_3 = 3;

export function calculateInterviewStats(sessions: InterviewSession[]): {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  strongestAreas: string[];
  improvementAreas: string[];
  totalTimeSpent: number;
  favoriteStudios: string[];
} {
  const totalInterviews = sessions.length;
  const completedInterviews = sessions.filter((session) => session.status === "completed").length;
  const completedWithScore = sessions.filter(
    (session) => session.status === "completed" && session.finalAnalysis,
  );
  const averageScore =
    completedWithScore.length > 0
      ? Math.round(
          completedWithScore.reduce(
            (accumulator, session) => accumulator + (session.finalAnalysis?.overallScore || 0),
            0,
          ) / completedWithScore.length,
        )
      : 0;

  const strongestAreas = [
    ...new Set(sessions.flatMap((session) => session.finalAnalysis?.strengths || [])),
  ].slice(0, NUM_3);
  const improvementAreas = [
    ...new Set(sessions.flatMap((session) => session.finalAnalysis?.improvements || [])),
  ].slice(0, NUM_3);
  const totalTimeSpent = sessions.reduce((accumulator, session) => {
    if (session.startTime && session.endTime) {
      return accumulator + (session.endTime - session.startTime);
    }
    return accumulator;
  }, 0);
  const studioCounts = new Map<string, number>();
  for (const session of sessions) {
    studioCounts.set(session.studioId, (studioCounts.get(session.studioId) ?? 0) + 1);
  }
  const favoriteStudios = [...studioCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, NUM_3)
    .map(([studioId]) => studioId);

  return {
    totalInterviews,
    completedInterviews,
    averageScore,
    strongestAreas,
    improvementAreas,
    totalTimeSpent,
    favoriteStudios,
  };
}
