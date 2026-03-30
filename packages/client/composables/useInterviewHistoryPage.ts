import { useI18n } from "vue-i18n";
import type { InterviewHistoryPageContext } from "./interview-history-page-contracts";
import { createInterviewHistoryDetailActions, useInterviewHistoryPageSessionSync } from "./interview-history-page-actions";
import { createInterviewHistoryDerivedState } from "./interview-history-page-derived";
import { createInterviewHistoryFormatters, createInterviewHistoryScoreState } from "./interview-history-page-formatters";
import { createInterviewHistoryPageState } from "./interview-history-page-state";

export function useInterviewHistoryPage() {
  const state = createInterviewHistoryPageState();
  const { t, locale, fallbackLocale } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const { $toast } = useNuxtApp();
  const { sessions, loading, fetchSessions, getSession } = useInterview();
  const context: InterviewHistoryPageContext = {
    route,
    router,
    t,
    localeValue: () => locale.value,
    fallbackLocaleValue: () => fallbackLocale.value,
    toast: $toast,
    sessions,
    fetchSessions,
    getSession,
    state,
  };
  const { loadSelectedSession, viewSessionDetail, closeDetail, retryDetail } =
    createInterviewHistoryDetailActions(context);
  const { filteredSessions, studios } = createInterviewHistoryDerivedState(sessions, state);
  const { formatDate, formatDuration, formatScore, questionScoreText } =
    createInterviewHistoryFormatters(t, context.localeValue, context.fallbackLocaleValue);
  const { scoreBadgeClass, getScoreColorClass, getTimelineLineClass } =
    createInterviewHistoryScoreState();

  useInterviewHistoryPageSessionSync(context, loadSelectedSession);

  return {
    t,
    sessions,
    loading,
    filteredSessions,
    studios,
    historyView: state.historyView,
    studioFilter: state.studioFilter,
    selectedSessionId: state.selectedSessionId,
    selectedSession: state.selectedSession,
    detailLoading: state.detailLoading,
    detailError: state.detailError,
    viewSessionDetail,
    closeDetail,
    retryDetail,
    formatDate,
    formatDuration,
    formatScore,
    questionScoreText,
    scoreBadgeClass,
    getScoreColorClass,
    getTimelineLineClass,
  };
}
