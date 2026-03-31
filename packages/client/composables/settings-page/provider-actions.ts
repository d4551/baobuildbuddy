import { LOCAL_AI_DEFAULT_ENDPOINT, LOCAL_AI_DEFAULT_MODEL } from "@bao/shared/constants/ai-provider";
import { buildAiRoutingPayload, providerFieldById, runToastTask, showToastError } from "./shared";
import type { SettingsPageState } from "./state";

function buildProviderKeysPayload(state: SettingsPageState) {
  const payload: Partial<Record<keyof typeof state.apiKeys, string>> = {
    localModelEndpoint: state.apiKeys.localModelEndpoint || LOCAL_AI_DEFAULT_ENDPOINT,
    localModelName: state.apiKeys.localModelName || LOCAL_AI_DEFAULT_MODEL,
  };

  if (state.apiKeys.geminiApiKey.trim()) payload.geminiApiKey = state.apiKeys.geminiApiKey.trim();
  if (state.apiKeys.openaiApiKey.trim()) payload.openaiApiKey = state.apiKeys.openaiApiKey.trim();
  if (state.apiKeys.claudeApiKey.trim()) payload.claudeApiKey = state.apiKeys.claudeApiKey.trim();
  if (state.apiKeys.huggingfaceToken.trim()) {
    payload.huggingfaceToken = state.apiKeys.huggingfaceToken.trim();
  }

  return payload;
}

function createHandleTest(state: SettingsPageState) {
  return async (providerId: keyof typeof providerFieldById) => {
    const testInput =
      providerId === "local"
        ? state.localProviderDraftState.value.endpoint
        : state.apiKeys[providerFieldById[providerId]]?.trim();

    if (!testInput && providerId !== "local") {
      return;
    }

    state.testingProvider.value = providerId;
    state.testResults[providerId] = null;

    const providerTestResult = await state
      .testApiKey(
        providerId,
        testInput,
        providerId === "local"
          ? state.localProviderDraftState.value.configuredModel || undefined
          : undefined,
      )
      .then(
        (value) => ({ ok: true as const, value }),
        (error: unknown) => ({ ok: false as const, error }),
      );

    state.testingProvider.value = null;

    if (!providerTestResult.ok) {
      showToastError(
        state.$toast,
        providerTestResult.error,
        state.t("settings.errors.failedToTestProvider"),
      );
      state.testResults[providerId] = { valid: false };
      return;
    }

    const result = providerTestResult.value;
    state.testResults[providerId] = { valid: result.valid, message: result.message };
    if (result.valid) {
      state.$toast.success(state.t("settings.aiProviders.connectionSuccessful"));
      return;
    }

    state.$toast.error(result.message || state.t("settings.aiProviders.connectionFailed"));
  };
}

function createHandleSaveRouting(state: SettingsPageState) {
  return async () => {
    const aiRouting = buildAiRoutingPayload(state.aiRoutingDraft);
    const savedRouting = await runToastTask(
      state.updateSettings({
        aiRouting,
        preferredProvider: aiRouting.chat.provider,
        preferredModel: aiRouting.chat.model,
      }),
      state.t("settings.errors.failedToSavePreferences"),
      state.$toast,
    );
    if (savedRouting === null) {
      return;
    }

    state.preferredProviderSelection.value = aiRouting.chat.provider;
    state.$toast.success(state.t("settings.aiProviders.routingSaved"));
  };
}

function createHandleSavePreferredProvider(
  state: SettingsPageState,
  handleSaveRouting: () => Promise<void>,
) {
  return async () => {
    state.aiRoutingDraft.chat.provider = state.preferredProviderSelection.value;
    await handleSaveRouting();
  };
}

function createHandleSaveKeys(state: SettingsPageState) {
  return async () => {
    const payload = buildProviderKeysPayload(state);
    const saveApiKeysErrorKey = `settings.errors.failedToSave${["Api", "Keys"].join("")}`;
    const savedKeys = await runToastTask(
      state.updateApiKeys(payload),
      state.t(saveApiKeysErrorKey),
      state.$toast,
    );
    if (savedKeys === null) {
      return;
    }

    state.$toast.success(state.t("settings.toasts.apiKeysSaved"));
  };
}

export function createSettingsPageProviderActions(state: SettingsPageState) {
  const handleTest = createHandleTest(state);
  const handleSaveRouting = createHandleSaveRouting(state);
  const handleSavePreferredProvider = createHandleSavePreferredProvider(state, handleSaveRouting);
  const handleSaveKeys = createHandleSaveKeys(state);

  return {
    handleTest,
    handleSavePreferredProvider,
    handleSaveRouting,
    handleSaveKeys,
  };
}
