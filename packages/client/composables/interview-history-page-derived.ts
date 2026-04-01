import type { InterviewHistoryPageState } from "./interview-history-page-contracts";

export const createInterviewHistoryDerivedState = (
  sessions: ReturnType<typeof useInterview>["sessions"],
  state: InterviewHistoryPageState,
) => {
  const filteredSessions = computed(() => {
    if (!state.studioFilter.value) {
      return sessions.value;
    }

    return sessions.value.filter((session) => session.studioName === state.studioFilter.value);
  });

  const studios = computed(() =>
    [...new Set(sessions.value.map((session) => session.studioName))].filter(Boolean),
  );

  return {
    filteredSessions,
    studios,
  };
};
