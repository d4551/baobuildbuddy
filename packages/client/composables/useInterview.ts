import { INTERVIEW_FALLBACK_STUDIO_ID } from "@bao/shared/constants/interview";
import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import type { InterviewConfig, InterviewSession } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import { assertApiResponse, requireValue, withLoadingState } from "./async-flow";
import { toInterviewSession, toInterviewSessions, toNumericRecord } from "./interview-normalizers";

interface SubmitResponseInput {
  questionId?: string;
  questionIndex?: number;
  response: string;
}

interface InterviewState {
  sessions: ReturnType<typeof useState<InterviewSession[]>>;
  currentSession: ReturnType<typeof useState<InterviewSession | null>>;
  stats: ReturnType<typeof useState<Record<string, number> | null>>;
  loading: ReturnType<typeof useState<boolean>>;
}

interface InterviewContext extends InterviewState {
  api: ReturnType<typeof useApi>;
  t: ReturnType<typeof useI18n>["t"];
}
const requireSession = (value: unknown, invalidMessage: string): InterviewSession =>
  requireValue(toInterviewSession(value), invalidMessage);

const createInterviewState = (): InterviewState => ({
  sessions: useState<InterviewSession[]>(STATE_KEYS.INTERVIEW_SESSIONS, () => []),
  currentSession: useState<InterviewSession | null>(
    STATE_KEYS.INTERVIEW_CURRENT_SESSION,
    () => null,
  ),
  stats: useState<Record<string, number> | null>(STATE_KEYS.INTERVIEW_STATS, () => null),
  loading: useState(STATE_KEYS.INTERVIEW_LOADING, () => false),
});

const createFetchSessionsAction = (context: InterviewContext) => async () =>
  withLoadingState(context.loading, async () => {
    const { data, error } = await context.api.interview.sessions.get();
    assertApiResponse(error, context.t("apiErrors.interview.fetchSessionsFailed"));
    context.sessions.value = toInterviewSessions(data);
  });

const createFetchStatsAction = (context: InterviewContext) => async () =>
  withLoadingState(context.loading, async () => {
    const { data, error } = await context.api.interview.stats.get();
    assertApiResponse(error, context.t("apiErrors.interview.fetchStatsFailed"));
    context.stats.value = toNumericRecord(data);
  });

const createStartSessionAction =
  (context: InterviewContext, fetchSessions: () => Promise<void>) =>
  async (studioId?: string, config?: Partial<InterviewConfig>) =>
    withLoadingState(context.loading, async () => {
      const trimmedStudioId = studioId?.trim() ?? "";
      const resolvedStudioId =
        trimmedStudioId.length > 0 ? trimmedStudioId : INTERVIEW_FALLBACK_STUDIO_ID;
      const { data, error } = await context.api.interview.sessions.post({
        studioId: resolvedStudioId,
        config,
      });
      assertApiResponse(error, context.t("apiErrors.interview.startFailed"));
      const normalized = requireSession(data, context.t("apiErrors.interview.invalidPayload"));
      context.currentSession.value = normalized;
      await fetchSessions();
      return normalized;
    });

const createGetSessionAction = (context: InterviewContext) => async (id: string) =>
  withLoadingState(context.loading, async () => {
    const { data, error } = await context.api.interview.sessions({ id }).get();
    assertApiResponse(error, context.t("apiErrors.interview.fetchSessionFailed"));
    const normalized = requireSession(data, context.t("apiErrors.interview.invalidPayload"));
    context.currentSession.value = normalized;
    return normalized;
  });

const createSubmitResponseAction =
  (context: InterviewContext) => async (sessionId: string, response: SubmitResponseInput) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.interview
        .sessions({ id: sessionId })
        .response.post(response);
      assertApiResponse(error, context.t("apiErrors.interview.submitResponseFailed"));
      const normalized = requireSession(data, context.t("apiErrors.interview.invalidPayload"));
      context.currentSession.value = normalized;
      return normalized;
    });

const createCompleteSessionAction =
  (
    context: InterviewContext,
    fetchSessions: () => Promise<void>,
    fetchStats: () => Promise<void>,
  ) =>
  async (id: string) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.interview.sessions({ id }).complete.post();
      assertApiResponse(error, context.t("apiErrors.interview.completeFailed"));
      const normalized = requireSession(data, context.t("apiErrors.interview.invalidPayload"));
      context.currentSession.value = normalized;
      await fetchSessions();
      await fetchStats();
      return normalized;
    });

/**
 * Interview practice session management composable.
 */
export function useInterview() {
  const state = createInterviewState();
  const context: InterviewContext = {
    ...state,
    api: useApi(),
    t: useI18n().t,
  };

  const fetchSessions = createFetchSessionsAction(context);
  const fetchStats = createFetchStatsAction(context);
  const actions = {
    startSession: createStartSessionAction(context, fetchSessions),
    fetchSessions,
    getSession: createGetSessionAction(context),
    submitResponse: createSubmitResponseAction(context),
    completeSession: createCompleteSessionAction(context, fetchSessions, fetchStats),
    fetchStats,
  };

  return {
    sessions: readonly(state.sessions),
    currentSession: readonly(state.currentSession),
    stats: readonly(state.stats),
    loading: readonly(state.loading),
    ...actions,
  };
}
