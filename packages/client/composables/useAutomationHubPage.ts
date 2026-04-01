import { useI18n } from "vue-i18n";
import { useAutomationHubPageData } from "~/composables/automation-hub-page-data";
import { createAutomationHubPagePresentation } from "~/composables/automation-hub-page-presentation";

export function useAutomationHubPage() {
  const { t } = useI18n();

  const data = useAutomationHubPageData(t);
  const presentation = createAutomationHubPagePresentation({
    stats: data.stats,
    t,
  });

  const retryLoad = async (): Promise<void> => {
    await Promise.all([data.refresh(), data.refreshCapabilityAudit()]);
  };

  return {
    t,
    error: data.error,
    uiState: data.uiState,
    totalRuns: data.totalRuns,
    todayRuns: data.todayRuns,
    successRate: data.successRate,
    pipelineSteps: presentation.pipelineSteps,
    nextPipelineStepLabel: presentation.nextPipelineStepLabel,
    capabilityAuditStatus: data.capabilityAuditStatus,
    capabilityAuditError: data.capabilityAuditError,
    capabilitySummary: data.capabilitySummary,
    capabilityEntries: data.capabilityEntries,
    orderedCards: presentation.orderedCards,
    primaryCardId: presentation.primaryCardId,
    primaryCard: presentation.primaryCard,
    retryLoad,
    refreshCapabilityAudit: data.refreshCapabilityAudit,
    capabilityStatusClass: (value: boolean, issueCount = 0) =>
      presentation.capabilityStatusClass(value, issueCount),
    capabilityStatusLabel: (value: boolean, issueCount = 0) =>
      presentation.capabilityStatusLabel(value, issueCount),
  };
}
