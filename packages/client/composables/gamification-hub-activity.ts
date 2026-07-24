/**
 * Weekly activity + career progress stats for the gamification hub page.
 * Sources: GET /api/stats/weekly and GET /api/stats/career via useStatistics.
 */
export function useGamificationHubActivity() {
  const statistics = useStatistics();

  const { status, error, refresh } = useAsyncData("gamification-hub-activity", async () => {
    await Promise.all([statistics.fetchWeekly(), statistics.fetchCareerProgress()]);
    return true;
  });

  const isActivityEmpty = computed(() => {
    const weeklyValue = statistics.weekly.value;
    const careerValue = statistics.career.value;
    const hasWeeklyActions = weeklyValue
      ? weeklyValue.days.some((day) => day.actions > 0)
      : false;
    const hasCareerProgress = careerValue
      ? careerValue.skillCoverage > 0 ||
        careerValue.applicationSuccessRate > 0 ||
        careerValue.interviewTrend.length > 0
      : false;
    return !(hasWeeklyActions || hasCareerProgress);
  });

  const activeDays = computed(
    () => statistics.weekly.value?.days.filter((day) => day.actions > 0) ?? [],
  );

  return {
    activeDays,
    career: statistics.career,
    error,
    isActivityEmpty,
    refresh,
    status,
    weekly: statistics.weekly,
  };
}
