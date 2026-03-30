import { APP_ROUTE_QUERY_KEYS } from "@bao/shared";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";
import type { InterviewHistoryPageContext } from "./interview-history-page-contracts";
import { normalizeInterviewHistoryQuerySession } from "./interview-history-page-state";

const createLoadSelectedSession = (context: InterviewHistoryPageContext) => {
  return async (nextSessionId: string | null): Promise<void> => {
    context.state.detailError.value = "";

    if (!nextSessionId) {
      context.state.selectedSessionId.value = null;
      context.state.selectedSession.value = null;
      return;
    }

    if (
      context.state.selectedSessionId.value === nextSessionId &&
      context.state.selectedSession.value
    ) {
      return;
    }

    context.state.selectedSessionId.value = nextSessionId;
    context.state.detailLoading.value = true;
    const sessionResult = await settlePromise(
      context.getSession(nextSessionId),
      context.t("interviewHistory.detailLoadErrorFallback"),
    );
    context.state.detailLoading.value = false;

    if (!sessionResult.ok) {
      context.state.detailError.value = getErrorMessage(
        sessionResult.error,
        context.t("interviewHistory.detailLoadErrorFallback"),
      );
      context.toast.error(context.state.detailError.value);
      context.state.selectedSession.value = null;
      return;
    }

    context.state.selectedSession.value = sessionResult.value;
    if (!context.state.selectedSession.value) {
      context.state.detailError.value = context.t("interviewHistory.sessionNotFound");
    }
  };
};

export const createInterviewHistoryDetailActions = (context: InterviewHistoryPageContext) => {
  const loadSelectedSession = createLoadSelectedSession(context);

  const viewSessionDetail = async (id: string): Promise<void> => {
    await context.router.replace({
      query: {
        ...context.route.query,
        [APP_ROUTE_QUERY_KEYS.sessionId]: id,
      },
    });
  };

  const closeDetail = async (): Promise<void> => {
    const nextQuery = { ...context.route.query };
    delete nextQuery[APP_ROUTE_QUERY_KEYS.sessionId];
    await context.router.replace({ query: nextQuery });
  };

  const retryDetail = async (): Promise<void> => {
    await loadSelectedSession(context.state.selectedSessionId.value);
  };

  return {
    loadSelectedSession,
    viewSessionDetail,
    closeDetail,
    retryDetail,
  };
};

export const useInterviewHistoryPageSessionSync = (
  context: InterviewHistoryPageContext,
  loadSelectedSession: (nextSessionId: string | null) => Promise<void>,
) => {
  onMounted(async () => {
    const sessionsResult = await settlePromise(
      context.fetchSessions(),
      context.t("interviewHistory.fetchErrorFallback"),
    );
    if (!sessionsResult.ok) {
      context.toast.error(
        getErrorMessage(sessionsResult.error, context.t("interviewHistory.fetchErrorFallback")),
      );
    }
  });

  watch(
    () => context.route.query[APP_ROUTE_QUERY_KEYS.sessionId],
    async (nextSessionQuery) => {
      await loadSelectedSession(normalizeInterviewHistoryQuerySession(nextSessionQuery));
    },
    { immediate: true },
  );
};
