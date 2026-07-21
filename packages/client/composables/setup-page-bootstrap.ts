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

const applyLocalModelFields = (ctx: SetupPageBootstrapContext): void => {
  if (ctx.settings.value?.localModelEndpoint) {
    ctx.localModelEndpoint.value = ctx.settings.value.localModelEndpoint;
  }
  if (ctx.settings.value?.localModelName) {
    ctx.localModelName.value = ctx.settings.value.localModelName;
  }
};

const loadDashboardStats = async (ctx: SetupPageBootstrapContext): Promise<void> => {
  const statsResult = await settlePromise(
    ctx.fetchDashboardStats(),
    ctx.t("apiErrors.statistics.fetchDashboardFailed"),
  );
  ctx.dashboardStats.value =
    statsResult.ok && !statsResult.value.error ? statsResult.value.data : null;
};

const runSetupBootstrap = async (
  ctx: SetupPageBootstrapContext,
): Promise<{ initialized: true }> => {
  // Auth first: bootstrap/setup must not require authenticated /api/settings.
  const authStatusResult = await settlePromise(
    ctx.checkAuthStatus(),
    ctx.t("apiErrors.auth.initFailed"),
  );
  if (!authStatusResult.ok) {
    throw new Error(getErrorMessage(authStatusResult.error, ctx.t("apiErrors.auth.initFailed")));
  }
  ctx.authStatus.value = authStatusResult.value;

  const needsBootstrap = authStatusResult.value.bootstrapRequired === true;
  const settingsResult = await settlePromise(
    needsBootstrap || ctx.settings.value ? Promise.resolve() : ctx.fetchSettings(),
    ctx.t("apiErrors.settings.fetchFailed"),
  );
  if (!settingsResult.ok) {
    throw new Error(getErrorMessage(settingsResult.error, ctx.t("apiErrors.settings.fetchFailed")));
  }

  applyLocalModelFields(ctx);

  if (needsBootstrap) {
    ctx.dashboardStats.value = null;
  } else {
    await loadDashboardStats(ctx);
  }

  return { initialized: true };
};

export function useSetupPageBootstrap(ctx: SetupPageBootstrapContext) {
  const { error, refresh, status } = useAsyncData("setup-bootstrap", () => runSetupBootstrap(ctx), {
    server: true,
    lazy: false,
  });

  return {
    setupBootstrapError: error,
    setupBootstrapPending: computed(() => status.value === "pending" || status.value === "idle"),
    refreshSetupBootstrap: refresh,
  };
}
