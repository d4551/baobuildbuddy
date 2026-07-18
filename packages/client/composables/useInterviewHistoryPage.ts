import { useI18n } from "vue-i18n";
import {
  createInterviewHistoryDetailActions,
  useInterviewHistoryPageSessionSync,
} from "./interview-history-page-actions";
import type { InterviewHistoryPageContext } from "./interview-history-page-contracts";
import { createInterviewHistoryDerivedState } from "./interview-history-page-derived";
import {
  createInterviewHistoryFormatters,
  createInterviewHistoryScoreState,
} from "./interview-history-page-formatters";
import { createInterviewHistoryPageState } from "./interview-history-page-state";

const createInterviewHistoryPageContext = (
  state: ReturnType<typeof createInterviewHistoryPageState>,
): {
  t: ReturnType<typeof useI18n>["t"];
  sessions: ReturnType<typeof useInterview>["sessions"];
  loading: ReturnType<typeof useInterview>["loading"];
  context: InterviewHistoryPageContext;
} => {
  const { t, locale, fallbackLocale } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const { $toast } = useNuxtApp();
  const { sessions, loading, fetchSessions, getSession } = useInterview();

  return {
    t,
    sessions,
    loading,
    context: {
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
    },
  };
};

interface InterviewHistoryPageResultOptions {
  readonly t: ReturnType<typeof useI18n>["t"];
  readonly sessions: ReturnType<typeof useInterview>["sessions"];
  readonly loading: ReturnType<typeof useInterview>["loading"];
  readonly state: ReturnType<typeof createInterviewHistoryPageState>;
  readonly derived: ReturnType<typeof createInterviewHistoryDerivedState>;
  readonly detailActions: ReturnType<typeof createInterviewHistoryDetailActions>;
  readonly formatters: ReturnType<typeof createInterviewHistoryFormatters>;
  readonly scoreState: ReturnType<typeof createInterviewHistoryScoreState>;
}

const createInterviewHistoryPageResult = ({
  t,
  sessions,
  loading,
  state,
  derived,
  detailActions,
  formatters,
  scoreState,
}: InterviewHistoryPageResultOptions) => ({
  t,
  sessions,
  loading,
  sessionsError: state.sessionsError,
  loadSessions: detailActions.loadInterviewSessions,
  filteredSessions: derived.filteredSessions,
  studios: derived.studios,
  historyView: state.historyView,
  studioFilter: state.studioFilter,
  selectedSessionId: state.selectedSessionId,
  selectedSession: state.selectedSession,
  detailLoading: state.detailLoading,
  detailError: state.detailError,
  viewSessionDetail: detailActions.viewSessionDetail,
  closeDetail: detailActions.closeDetail,
  retryDetail: detailActions.retryDetail,
  formatDate: formatters.formatDate,
  formatDuration: formatters.formatDuration,
  formatScore: formatters.formatScore,
  questionScoreText: formatters.questionScoreText,
  scoreBadgeClass: scoreState.scoreBadgeClass,
  getScoreColorClass: scoreState.getScoreColorClass,
  getTimelineLineClass: scoreState.getTimelineLineClass,
});

export function useInterviewHistoryPage() {
  const state = createInterviewHistoryPageState();
  const { t, sessions, loading, context } = createInterviewHistoryPageContext(state);
  const detailActions = createInterviewHistoryDetailActions(context);
  const derived = createInterviewHistoryDerivedState(sessions, state);
  const formatters = createInterviewHistoryFormatters(
    t,
    context.localeValue,
    context.fallbackLocaleValue,
  );
  const scoreState = createInterviewHistoryScoreState();

  useInterviewHistoryPageSessionSync(context, detailActions.loadSelectedSession);

  return createInterviewHistoryPageResult({
    t,
    sessions,
    loading,
    state,
    derived,
    detailActions,
    formatters,
    scoreState,
  });
}
