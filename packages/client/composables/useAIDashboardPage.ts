import type { AIProviderType } from "@bao/shared/types/ai";
import { createAIDashboardActions } from "~/composables/ai-dashboard-actions";
import {
  createAIDashboardBootstrapState,
  createAIDashboardRuntime,
} from "~/composables/ai-dashboard-bootstrap";
import {
  buildAIDashboardViewModel,
  createDashboardProviderPresentation,
  createDashboardStatsPresentation,
} from "~/composables/ai-dashboard-presentation";
import {
  syncDashboardSelections,
  useAIDashboardSelection,
} from "~/composables/ai-dashboard-selection";
import { resolveProviderMetadata } from "~/utils/ai-control-plane";

function resolveCatalogDefaultModel(providerId: AIProviderType): string {
  return resolveProviderMetadata(providerId)?.modelHints[0] ?? "";
}

function createAIDashboardPresentationState(input: {
  runtime: ReturnType<typeof createAIDashboardRuntime>;
  bootstrap: Awaited<ReturnType<typeof createAIDashboardBootstrapState>>;
}) {
  const providers = computed(
    () => input.bootstrap.dashboardBootstrap.value?.resolvedProviders ?? [],
  );
  const providerStats = computed(
    () => input.bootstrap.dashboardBootstrap.value?.normalizedStats ?? null,
  );
  const providerPresentation = createDashboardProviderPresentation(
    input.runtime.dependencies.t,
    input.runtime.dependencies.settings,
  );
  const statsPresentation = createDashboardStatsPresentation(
    providerStats,
    input.runtime.dependencies.t,
    providerPresentation.providerLabel,
  );

  return {
    providerPresentation,
    providerStats,
    providers,
    statsPresentation,
  };
}

function createAIDashboardLoadingState(
  bootstrapStatus: Ref<"idle" | "pending" | "success" | "error">,
) {
  return computed(() => bootstrapStatus.value === "pending" || bootstrapStatus.value === "idle");
}

export function useAIDashboardPage() {
  const runtime = createAIDashboardRuntime();
  const bootstrap = createAIDashboardBootstrapState(runtime, resolveCatalogDefaultModel);
  const providers = computed(() => bootstrap.dashboardBootstrap.value?.resolvedProviders ?? []);
  const dashboardSelection = useAIDashboardSelection(runtime.dependencies.settings, providers);
  const presentationState = createAIDashboardPresentationState({
    runtime,
    bootstrap,
  });

  syncDashboardSelections({
    dashboardBootstrap: bootstrap.dashboardBootstrap,
    selectedProvider: dashboardSelection.selectedProvider,
    selectedModel: dashboardSelection.selectedModel,
    settings: runtime.dependencies.settings,
    selectedProviderModels: dashboardSelection.selectedProviderModels,
  });

  const actions = createAIDashboardActions({
    api: runtime.dependencies.api,
    localProviderState: runtime.dependencies.localProviderState,
    refreshDashboardBootstrap: bootstrap.refreshDashboardBootstrap,
    selectedModel: dashboardSelection.selectedModel,
    selectedProvider: dashboardSelection.selectedProvider,
    settings: runtime.dependencies.settings,
    t: runtime.dependencies.t,
    testApiKey: runtime.dependencies.testApiKey,
    testResults: runtime.testResults,
    testingProvider: runtime.testingProvider,
    toast: runtime.dependencies.toast,
  });

  return buildAIDashboardViewModel({
    dashboardBootstrapError: bootstrap.dashboardBootstrapError,
    loading: createAIDashboardLoadingState(bootstrap.dashboardBootstrapStatus),
    providerPresentation: presentationState.providerPresentation,
    providerStats: presentationState.providerStats,
    providers: presentationState.providers,
    selection: dashboardSelection,
    statsPresentation: presentationState.statsPresentation,
    actions,
    testResults: runtime.testResults,
    testingProvider: runtime.testingProvider,
    t: runtime.dependencies.t,
  });
}
