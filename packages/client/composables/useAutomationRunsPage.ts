import { onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useSeoMeta } from "#imports";
import { isLiveAutomationRun } from "~/composables/automation-runs-page-merge";
import { createAutomationRunsPagePresentation } from "~/composables/automation-runs-page-presentation";
import { createAutomationRunsPageQuery } from "~/composables/automation-runs-page-query";
import { createAutomationRunsLiveState } from "~/composables/automation-runs-page-subscriptions";

export function useAutomationRunsPage() {
  const { t, locale, fallbackLocale } = useI18n();

  useSeoMeta({
    title: t("automation.runs.title"),
    description: t("automation.hub.cards.runHistory.description"),
  });

  const queryState = createAutomationRunsPageQuery(t);
  const { mergedRuns, clearSubscriptions } = createAutomationRunsLiveState(
    queryState.runs,
    queryState.subscribeToRun,
  );
  onBeforeUnmount(() => {
    clearSubscriptions();
  });

  const presentation = createAutomationRunsPagePresentation(
    mergedRuns,
    t,
    locale,
    fallbackLocale,
  );

  return {
    t,
    statusFilter: queryState.statusFilter,
    typeFilter: queryState.typeFilter,
    typeOptions: queryState.typeOptions,
    statusOptions: queryState.statusOptions,
    isLoading: queryState.isLoading,
    error: queryState.error,
    errorMessage: queryState.errorMessage,
    refresh: queryState.refresh,
    sortedRuns: presentation.sortedRuns,
    isLiveRun: isLiveAutomationRun,
    formatRunType: presentation.formatRunType,
    formatRunStatus: presentation.formatRunStatus,
    formatRunProgress: presentation.formatRunProgress,
    formatDate: presentation.formatDate,
    resolveRowClass: presentation.resolveRowClass,
  };
}
