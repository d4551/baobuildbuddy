import { APP_ROUTES, APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { useAutomationScraperActions } from "~/composables/automation-scraper-actions";
import { useAutomationScraperBootstrap } from "~/composables/automation-scraper-bootstrap";
import { useAutomationScraperDerived } from "~/composables/automation-scraper-derived";
import { useAutomation } from "~/composables/useAutomation";
import { getErrorMessage } from "~/utils/errors";

export async function useAutomationScraperPage() {
  const jobsApi = useJobs();
  const router = useRouter();
  const { $toast } = useNuxtApp();
  const i18n = useI18n();
  const { awardForAction } = usePipelineGamification();
  const automation = useAutomation();
  const bootstrap = await useAutomationScraperBootstrap({
    getRpaCapabilities: automation.getRpaCapabilities,
    searchJobs: jobsApi.searchJobs,
  });
  const derived = useAutomationScraperDerived(
    {
      capabilityAuditData: bootstrap.capabilityAuditData,
      fallbackLocale: i18n.fallbackLocale,
      jobs: jobsApi.jobs,
      lastRunAt: bootstrap.lastRunAt,
      latestRuns: bootstrap.latestRuns,
      locale: i18n.locale,
      runStates: bootstrap.runStates,
    },
    i18n.t,
  );
  const actions = useAutomationScraperActions(
    {
      awardForAction,
      lastRunAt: bootstrap.lastRunAt,
      latestRuns: bootstrap.latestRuns,
      pendingAction: bootstrap.pendingAction,
      refreshCapabilityAudit: bootstrap.refreshCapabilityAudit,
      refreshScraperJobs: bootstrap.refreshScraperJobs,
      runMessages: bootstrap.runMessages,
      runStates: bootstrap.runStates,
      scheduleScrape: automation.scheduleScrape,
      scheduledRunAt: bootstrap.scheduledRunAt,
      triggerScrape: automation.triggerScrape,
    },
    router,
    { $toast },
    i18n.t,
  );

  return {
    APP_ROUTE_BUILDERS,
    APP_ROUTES,
    ...derived,
    ...actions,
    getErrorMessage,
    jobsLoading: jobsApi.loading,
    ...bootstrap,
  };
}
