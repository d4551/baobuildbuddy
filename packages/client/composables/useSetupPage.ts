import { LOCAL_AI_DEFAULT_ENDPOINT, LOCAL_AI_DEFAULT_MODEL } from "@bao/shared/constants/ai-provider";
import type { DashboardStats } from "@bao/shared/types/search";
import { useI18n } from "vue-i18n";
import { createFlowEngineInput } from "~/constants/flow-engine";
import {
  CLOUD_PROVIDER_IDS,
  type CloudProvider,
  type SetupAuthStatus,
  type SetupProvider,
  type SetupStep,
  type SetupTestResult,
} from "~/components/setup/setup-page-contracts";
import { createSetupPageActions } from "~/composables/setup-page-actions";
import { useSetupPageBootstrap } from "~/composables/setup-page-bootstrap";
import { resolveLocalProviderState, resolveProviderMetadata } from "~/utils/ai-control-plane";

type ProviderCredentialState = Record<CloudProvider, string>;

const createEmptyProviderCredentials = (): ProviderCredentialState => ({
  gemini: "",
  openai: "",
  claude: "",
  huggingface: "",
});

const createEmptyTestResults = (): Record<SetupProvider, SetupTestResult | null> => ({
  local: null,
  gemini: null,
  openai: null,
  claude: null,
  huggingface: null,
});

const createSetupPageRefs = () => ({
  authSetupToken: ref(""),
  authStatus: ref<SetupAuthStatus | null>(null),
  currentRole: ref(""),
  dashboardStats: ref<DashboardStats | null>(null),
  existingApiKey: ref(""),
  localModelEndpoint: ref(LOCAL_AI_DEFAULT_ENDPOINT),
  localModelName: ref(LOCAL_AI_DEFAULT_MODEL),
  name: ref(""),
  providerCredentials: reactive(createEmptyProviderCredentials()),
  saving: ref(false),
  step: ref<SetupStep>(1),
  testResults: ref(createEmptyTestResults()),
  testing: ref(false),
  testingProvider: ref<SetupProvider | null>(null),
});

const useSetupProviderLabels = (t: ReturnType<typeof useI18n>["t"]) =>
  computed<Record<SetupProvider, string>>(() => {
    const resolveProviderName = (providerId: SetupProvider): string => {
      const provider = resolveProviderMetadata(providerId);
      return provider ? t(provider.nameKey) : providerId;
    };

    return {
      local: resolveProviderName("local"),
      gemini: resolveProviderName("gemini"),
      openai: resolveProviderName("openai"),
      claude: resolveProviderName("claude"),
      huggingface: resolveProviderName("huggingface"),
    };
  });

const useSetupCompletionFlowTarget = (dashboardStats: Ref<DashboardStats | null>) => {
  const flowInput = computed(() =>
    createFlowEngineInput(dashboardStats.value, {
      isProfileComplete: true,
      isSetupComplete: true,
    }),
  );
  const { primaryAction } = useFlowEngine(flowInput);
  return computed(() => primaryAction.value.to);
};

const useSetupAuthFlags = (
  authStatus: Ref<SetupAuthStatus | null>,
  getStoredApiKey: () => string | null,
) => ({
  authBootstrapRequired: computed(
    () => authStatus.value?.authRequired === true && authStatus.value.bootstrapRequired,
  ),
  authSetupTokenConfigured: computed(() => authStatus.value?.setupTokenConfigured === true),
  needsStoredApiKey: computed(
    () =>
      authStatus.value?.authRequired === true &&
      authStatus.value.bootstrapRequired === false &&
      getStoredApiKey() === null,
  ),
});

const useSetupLocalProviderState = (
  settings: ReturnType<typeof useSettings>["settings"],
  localModelEndpoint: Ref<string>,
  localModelName: Ref<string>,
  testResults: Ref<Record<SetupProvider, SetupTestResult | null>>,
) => {
  const localProviderState = computed(() =>
    resolveLocalProviderState({
      settings: settings.value,
      endpoint: localModelEndpoint.value,
      model: localModelName.value,
      testResult: testResults.value.local,
    }),
  );

  return {
    localProviderState,
    ollamaCommand: computed(() => `ollama run ${localProviderState.value.selectedModel}`),
  };
};

const useSetupPageServices = () => ({
  api: useApi(),
  auth: useAuth(),
  brand: useBrand(),
  router: useRouter(),
  settings: useSettings(),
  toast: useNuxtApp().$toast,
  user: useUser(),
});

interface SetupPageDerivedStateOptions {
  authStatus: Ref<SetupAuthStatus | null>;
  dashboardStats: Ref<DashboardStats | null>;
  getStoredApiKey: () => string | null;
  localModelEndpoint: Ref<string>;
  localModelName: Ref<string>;
  settings: ReturnType<typeof useSettings>["settings"];
  t: ReturnType<typeof useI18n>["t"];
  testResults: Ref<Record<SetupProvider, SetupTestResult | null>>;
}

const useSetupPageDerivedState = ({
  authStatus,
  dashboardStats,
  getStoredApiKey,
  localModelEndpoint,
  localModelName,
  settings,
  t,
  testResults,
}: SetupPageDerivedStateOptions) => {
  const authFlags = useSetupAuthFlags(authStatus, getStoredApiKey);
  const localProvider = useSetupLocalProviderState(
    settings,
    localModelEndpoint,
    localModelName,
    testResults,
  );
  const providerLabels = useSetupProviderLabels(t);
  const postSetupFlowTarget = useSetupCompletionFlowTarget(dashboardStats);

  return { ...authFlags, ...localProvider, postSetupFlowTarget, providerLabels };
};

const useSetupPageContext = (t: ReturnType<typeof useI18n>["t"]) => {
  const services = useSetupPageServices();
  const state = createSetupPageRefs();
  const derived = useSetupPageDerivedState({
    authStatus: state.authStatus,
    dashboardStats: state.dashboardStats,
    getStoredApiKey: services.auth.getStoredApiKey,
    localModelEndpoint: state.localModelEndpoint,
    localModelName: state.localModelName,
    settings: services.settings.settings,
    t,
    testResults: state.testResults,
  });

  return { ...services, ...state, ...derived };
};

const useSetupPageAsyncState = async (
  context: ReturnType<typeof useSetupPageContext>,
  t: ReturnType<typeof useI18n>["t"],
) => {
  const { setupBootstrapError, setupBootstrapPending, refreshSetupBootstrap } =
    await useSetupPageBootstrap({
      authStatus: context.authStatus,
      checkAuthStatus: context.auth.checkAuthStatus,
      dashboardStats: context.dashboardStats,
      fetchDashboardStats: () => context.api.stats.dashboard.get(),
      fetchSettings: context.settings.fetchSettings,
      localModelEndpoint: context.localModelEndpoint,
      localModelName: context.localModelName,
      settings: context.settings.settings,
      t,
    });
  const actions = createSetupPageActions({
    authSetupToken: context.authSetupToken,
    authStatus: context.authStatus,
    checkAuthStatus: context.auth.checkAuthStatus,
    currentRole: context.currentRole,
    existingApiKey: context.existingApiKey,
    getStoredApiKey: context.auth.getStoredApiKey,
    initAuth: context.auth.initAuth,
    localModelEndpoint: context.localModelEndpoint,
    localModelName: context.localModelName,
    localProviderState: context.localProviderState,
    name: context.name,
    ollamaCommand: context.ollamaCommand,
    postSetupFlowTarget: context.postSetupFlowTarget,
    providerCredentials: context.providerCredentials,
    providerLabels: context.providerLabels,
    router: context.router,
    saving: context.saving,
    setStoredApiKey: context.auth.setStoredApiKey,
    settings: context.settings.settings,
    t,
    testApiKey: context.settings.testApiKey,
    testResults: context.testResults,
    testing: context.testing,
    testingProvider: context.testingProvider,
    toast: context.toast,
    updateApiKeys: context.settings.updateApiKeys,
    updateProfile: context.user.updateProfile,
  });

  return { ...actions, refreshSetupBootstrap, setupBootstrapError, setupBootstrapPending };
};

export async function useSetupPage() {
  const { t } = useI18n();
  const context = useSetupPageContext(t);
  const asyncState = await useSetupPageAsyncState(context, t);
  return {
    resolvedBrand: context.brand.resolvedBrand,
    OLLAMA_WEBSITE_URL: asyncState.OLLAMA_WEBSITE_URL,
    authBootstrapRequired: context.authBootstrapRequired,
    authSetupToken: context.authSetupToken,
    authSetupTokenConfigured: context.authSetupTokenConfigured,
    cloudProviderIds: CLOUD_PROVIDER_IDS,
    copyOllamaCommand: asyncState.copyOllamaCommand,
    currentRole: context.currentRole,
    existingApiKey: context.existingApiKey,
    handleComplete: asyncState.handleComplete,
    handleTestProvider: asyncState.handleTestProvider,
    localModelEndpoint: context.localModelEndpoint,
    localModelName: context.localModelName,
    name: context.name,
    needsStoredApiKey: context.needsStoredApiKey,
    ollamaCommand: context.ollamaCommand,
    providerLabels: context.providerLabels,
    providerCredentials: context.providerCredentials,
    refreshSetupBootstrap: asyncState.refreshSetupBootstrap,
    saving: context.saving,
    setupBootstrapError: asyncState.setupBootstrapError,
    setupBootstrapPending: asyncState.setupBootstrapPending,
    step: context.step,
    testing: context.testing,
    testingProvider: context.testingProvider,
    updateProviderCredential: asyncState.updateProviderCredential,
  };
}

export type SetupPageState = Awaited<ReturnType<typeof useSetupPage>>;
