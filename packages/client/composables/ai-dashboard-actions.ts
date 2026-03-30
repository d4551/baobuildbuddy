import { AI_ROUTING_PURPOSE_IDS, type AIProviderType, type AIRouting } from "@bao/shared";
import type { Ref } from "vue";
import { settlePromise } from "~/composables/async-flow";
import type { ProviderConnectivityResult } from "~/types/ai-dashboard";
import { getErrorMessage } from "~/utils/errors";

type ApiClient = ReturnType<typeof useApi>;
type TestApiKeyInput = NonNullable<Parameters<ApiClient["settings"]["test-api-key"]["post"]>[0]>;
type Translate = (key: string, params?: Record<string, unknown>) => string;

export function createDefaultRouting(provider: AIProviderType) {
  const [
    chat,
    interviewQuestions,
    interviewFeedback,
    resume,
    coverLetter,
    emailResponse,
    jobMatch,
    scrapeEnrichment,
    automationFieldMapping,
  ] = AI_ROUTING_PURPOSE_IDS;

  return {
    [chat]: { provider },
    [interviewQuestions]: { provider },
    [interviewFeedback]: { provider },
    [resume]: { provider },
    [coverLetter]: { provider },
    [emailResponse]: { provider },
    [jobMatch]: { provider },
    [scrapeEnrichment]: { provider },
    [automationFieldMapping]: { provider },
  } satisfies AIRouting;
}

function resolveProviderCredential(
  settings: ReturnType<typeof useSettings>["settings"],
  providerId: TestApiKeyInput["provider"],
): string {
  const currentSettings = settings.value;
  if (!currentSettings) return "";
  if (providerId === "gemini") return currentSettings.geminiApiKey ?? "";
  if (providerId === "openai") return currentSettings.openaiApiKey ?? "";
  if (providerId === "claude") return currentSettings.claudeApiKey ?? "";
  if (providerId === "huggingface") return currentSettings.huggingfaceToken ?? "";
  return "";
}

async function testProviderConnectivity(input: {
  providerId: AIProviderType;
  settings: ReturnType<typeof useSettings>["settings"];
  localProviderState: ReturnType<typeof useSettings>["localProviderState"];
  testApiKey: ReturnType<typeof useSettings>["testApiKey"];
  t: Translate;
}): Promise<ProviderConnectivityResult> {
  if (input.providerId === "local") {
    const result = await input.testApiKey(
      "local",
      input.localProviderState.value.endpoint,
      input.localProviderState.value.configuredModel || undefined,
    );
    return {
      valid: result.valid,
      message:
        result.message ||
        (result.valid
          ? input.t("aiDashboard.tests.localSuccess")
          : input.t("aiDashboard.tests.localFailure")),
    };
  }

  const providerCredential = resolveProviderCredential(input.settings, input.providerId);
  if (!providerCredential.trim()) {
    return {
      valid: false,
      message: input.t("aiDashboard.tests.missingCredential"),
    };
  }

  const result = await input.testApiKey(input.providerId, providerCredential);
  return {
    valid: result.valid,
    message:
      result.message ||
      (result.valid
        ? input.t("aiDashboard.tests.connectionSuccess")
        : input.t("aiDashboard.tests.connectionFailure")),
  };
}

function createDashboardRefreshAction(input: {
  refreshDashboardBootstrap: () => Promise<unknown>;
  t: Translate;
  toast: ReturnType<typeof useNuxtApp>["$toast"];
}) {
  return async function fetchProviderStats() {
    const refreshResult = await settlePromise(
      input.refreshDashboardBootstrap(),
      input.t("aiDashboard.toasts.loadFailed"),
    );
    if (!refreshResult.ok) {
      input.toast.error(getErrorMessage(refreshResult.error, input.t("aiDashboard.toasts.loadFailed")));
    }
  };
}

function createProviderTestAction(input: {
  localProviderState: ReturnType<typeof useSettings>["localProviderState"];
  settings: ReturnType<typeof useSettings>["settings"];
  t: Translate;
  testApiKey: ReturnType<typeof useSettings>["testApiKey"];
  testResults: Record<AIProviderType, ProviderConnectivityResult | null>;
  testingProvider: Ref<AIProviderType | null>;
}) {
  return async function handleTestProvider(providerId: AIProviderType) {
    input.testingProvider.value = providerId;
    input.testResults[providerId] = null;

    const providerTestResult = await settlePromise(
      testProviderConnectivity({
        providerId,
        settings: input.settings,
        localProviderState: input.localProviderState,
        testApiKey: input.testApiKey,
        t: input.t,
      }),
      input.t("aiDashboard.tests.connectionFailure"),
    );
    input.testingProvider.value = null;

    if (!providerTestResult.ok) {
      input.testResults[providerId] = {
        valid: false,
        message: getErrorMessage(providerTestResult.error, input.t("aiDashboard.tests.connectionFailure")),
      };
      return;
    }

    input.testResults[providerId] = providerTestResult.value;
  };
}

function createDashboardPreferenceAction(
  input: {
    api: ReturnType<typeof useApi>;
    selectedModel: Ref<string>;
    selectedProvider: Ref<AIProviderType>;
    settings: ReturnType<typeof useSettings>["settings"];
    t: Translate;
    toast: ReturnType<typeof useNuxtApp>["$toast"];
  },
  fetchProviderStats: () => Promise<void>,
) {
  return async function handleSetPreference() {
    if (!(input.selectedProvider.value && input.selectedModel.value)) {
      return;
    }

    const preferenceResult = await settlePromise(
      (async () => {
        const { error } = await input.api.settings.put({
          aiRouting: {
            ...(input.settings.value?.aiRouting ?? createDefaultRouting(input.selectedProvider.value)),
            chat: {
              provider: input.selectedProvider.value,
              ...(input.selectedModel.value ? { model: input.selectedModel.value } : {}),
            },
          },
          preferredProvider: input.selectedProvider.value,
          preferredModel: input.selectedModel.value || undefined,
        });
        if (error) {
          throw new Error(input.t("aiDashboard.errors.preferenceSaveFailed"));
        }
      })(),
      input.t("aiDashboard.toasts.preferenceSaveFailed"),
    );
    if (!preferenceResult.ok) {
      input.toast.error(
        getErrorMessage(preferenceResult.error, input.t("aiDashboard.toasts.preferenceSaveFailed")),
      );
      return;
    }

    input.toast.success(input.t("aiDashboard.toasts.preferenceSaved"));
    await fetchProviderStats();
  };
}

export function createAIDashboardActions(input: {
  api: ReturnType<typeof useApi>;
  localProviderState: ReturnType<typeof useSettings>["localProviderState"];
  refreshDashboardBootstrap: () => Promise<unknown>;
  selectedModel: Ref<string>;
  selectedProvider: Ref<AIProviderType>;
  settings: ReturnType<typeof useSettings>["settings"];
  t: Translate;
  testApiKey: ReturnType<typeof useSettings>["testApiKey"];
  testResults: Record<AIProviderType, ProviderConnectivityResult | null>;
  testingProvider: Ref<AIProviderType | null>;
  toast: ReturnType<typeof useNuxtApp>["$toast"];
}) {
  const fetchProviderStats = createDashboardRefreshAction(input);
  const handleTestProvider = createProviderTestAction(input);
  const handleSetPreference = createDashboardPreferenceAction(input, fetchProviderStats);

  return {
    fetchProviderStats,
    handleSetPreference,
    handleTestProvider,
  };
}
