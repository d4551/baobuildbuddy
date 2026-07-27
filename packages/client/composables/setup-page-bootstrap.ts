import type { DashboardStats } from "@bao/shared/types/search";
import type { Ref } from "vue";
import type { SetupAuthStatus } from "~/components/setup/setup-page-contracts";
import { settlePromise } from "~/composables/async-flow";
import type { ApiEnvelope } from "~/types/client-api-contracts";
import { getErrorMessage } from "~/utils/errors";

interface SetupPageSettingsSnapshot {
  localModelEndpoint?: string | null;
  localModelName?: string | null;
}

interface SetupPageBootstrapContext {
  authStatus: Ref<SetupAuthStatus | null>;
  checkAuthStatus: () => Promise<SetupAuthStatus>;
  dashboardStats: Ref<DashboardStats | null>;
  fetchDashboardStats: () => Promise<ApiEnvelope<DashboardStats>>;
  fetchSettings: () => Promise<void>;
  localModelEndpoint: Ref<string>;
  localModelName: Ref<string>;
  settings: Ref<SetupPageSettingsSnapshot | null>;
  t: (key: string) => string;
}

export function useSetupPageBootstrap({
  authStatus,
  checkAuthStatus,
  dashboardStats,
  fetchDashboardStats,
  fetchSettings,
  localModelEndpoint,
  localModelName,
  settings,
  t,
}: SetupPageBootstrapContext) {
  const { error, refresh, status } = useAsyncData(
    "setup-bootstrap",
    async () => {
      // Auth status is public and must be resolved first: when bootstrap is
      // required the settings/stats endpoints are auth-gated (401) and are not
      // needed to complete first-run setup, so fetching them would deadlock the
      // wizard on "Failed to fetch settings".
      const authStatusResult = await settlePromise(
        checkAuthStatus(),
        t("apiErrors.auth.initFailed"),
      );
      if (!authStatusResult.ok) {
        throw new Error(getErrorMessage(authStatusResult.error, t("apiErrors.auth.initFailed")));
      }

      authStatus.value = authStatusResult.value;

      if (authStatusResult.value.bootstrapRequired) {
        return { initialized: true };
      }

      const settingsResult = await settlePromise(
        settings.value ? Promise.resolve() : fetchSettings(),
        t("apiErrors.settings.fetchFailed"),
      );
      if (!settingsResult.ok) {
        throw new Error(getErrorMessage(settingsResult.error, t("apiErrors.settings.fetchFailed")));
      }

      if (settings.value?.localModelEndpoint) {
        localModelEndpoint.value = settings.value.localModelEndpoint;
      }
      if (settings.value?.localModelName) {
        localModelName.value = settings.value.localModelName;
      }

      const statsResult = await settlePromise(
        fetchDashboardStats(),
        t("apiErrors.statistics.fetchDashboardFailed"),
      );
      dashboardStats.value =
        statsResult.ok && !statsResult.value.error ? statsResult.value.data : null;

      return { initialized: true };
    },
    {
      server: true,
      lazy: false,
    },
  );

  return {
    setupBootstrapError: error,
    setupBootstrapPending: computed(() => status.value === "pending" || status.value === "idle"),
    refreshSetupBootstrap: refresh,
  };
}
