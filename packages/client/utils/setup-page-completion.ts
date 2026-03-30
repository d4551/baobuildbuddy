import {
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
} from "@bao/shared";
import { settlePromise } from "~/composables/async-flow";
import { API_KEY_FIELD_BY_PROVIDER, CLOUD_PROVIDER_IDS } from "~/components/setup/setup-page-contracts";
import type {
  ProviderCredentialState,
  SetupCompletionInput,
  SetupPageActionsContext,
  SetupPageToastApi,
} from "~/utils/setup-page-action-contracts";
import { getErrorMessage } from "~/utils/errors";

const createCompletionInput = (context: SetupPageActionsContext): SetupCompletionInput => ({
  providedApiKey: context.existingApiKey.value.trim(),
  setupToken: context.authSetupToken.value.trim(),
  storedApiKey: context.getStoredApiKey(),
  trimmedName: context.name.value.trim(),
  trimmedRole: context.currentRole.value.trim(),
});

const failSetupAction = (
  saving: SetupPageActionsContext["saving"],
  toast: SetupPageToastApi,
  message: string,
): false => {
  saving.value = false;
  toast.error(message);
  return false;
};

const ensureSetupApiKey = async (
  context: Pick<
    SetupPageActionsContext,
    "authStatus" | "checkAuthStatus" | "initAuth" | "saving" | "setStoredApiKey" | "t" | "toast"
  >,
  input: SetupCompletionInput,
): Promise<SetupPageActionsContext["authStatus"]["value"]> => {
  const nextAuthStatus = context.authStatus.value ?? (await context.checkAuthStatus());
  context.authStatus.value = nextAuthStatus;
  if (!nextAuthStatus.authRequired || input.storedApiKey) return nextAuthStatus;

  if (!nextAuthStatus.bootstrapRequired) {
    if (!input.providedApiKey) {
      failSetupAction(context.saving, context.toast, context.t("setup.auth.apiKeyRequiredError"));
      return null;
    }
    context.setStoredApiKey(input.providedApiKey);
    return nextAuthStatus;
  }

  if (!nextAuthStatus.setupTokenConfigured) {
    failSetupAction(
      context.saving,
      context.toast,
      context.t("setup.auth.bootstrapUnavailableDescription"),
    );
    return null;
  }
  if (!input.setupToken) {
    failSetupAction(context.saving, context.toast, context.t("setup.auth.setupTokenRequiredError"));
    return null;
  }

  const authInitResult = await settlePromise(
    context.initAuth(input.setupToken),
    context.t("apiErrors.auth.initFailed"),
  );
  if (!authInitResult.ok) {
    failSetupAction(
      context.saving,
      context.toast,
      getErrorMessage(authInitResult.error, context.t("apiErrors.auth.initFailed")),
    );
    return null;
  }

  const issuedApiKey = authInitResult.value.apiKey;
  if (typeof issuedApiKey !== "string" || issuedApiKey.length === 0) {
    failSetupAction(context.saving, context.toast, context.t("apiErrors.auth.initFailed"));
    return null;
  }

  context.setStoredApiKey(issuedApiKey);
  return nextAuthStatus;
};

const ensureProfileSaved = async (
  context: Pick<
    SetupPageActionsContext,
    "saving" | "setStoredApiKey" | "t" | "toast" | "updateProfile"
  >,
  input: SetupCompletionInput,
): Promise<boolean> => {
  if (!input.trimmedName) return true;

  const profileUpdateResult = await settlePromise(
    context.updateProfile({
      name: input.trimmedName,
      ...(input.trimmedRole ? { currentRole: input.trimmedRole } : {}),
    }),
    context.t("setup.completeErrorFallback"),
  );
  if (profileUpdateResult.ok) return true;

  if (!input.storedApiKey && input.providedApiKey.length > 0) {
    context.setStoredApiKey(null);
  }
  return failSetupAction(
    context.saving,
    context.toast,
    getErrorMessage(profileUpdateResult.error, context.t("setup.completeErrorFallback")),
  );
};

const hasStoredCloudCredentials = (
  providerCredentials: ProviderCredentialState,
  settings: SetupPageActionsContext["settings"],
): boolean =>
  CLOUD_PROVIDER_IDS.some((provider) => providerCredentials[provider].trim().length > 0) ||
  Boolean(settings.value?.hasGeminiKey) ||
  Boolean(settings.value?.hasOpenaiKey) ||
  Boolean(settings.value?.hasClaudeKey) ||
  Boolean(settings.value?.hasHuggingfaceToken);

const ensureProviderAvailability = async (
  context: Pick<
    SetupPageActionsContext,
    | "localProviderState"
    | "providerCredentials"
    | "providerLabels"
    | "saving"
    | "settings"
    | "t"
    | "testApiKey"
    | "testResults"
    | "toast"
  >,
): Promise<boolean> => {
  const localProviderCheck = await settlePromise(
    context.testApiKey(
      "local",
      context.localProviderState.value.endpoint,
      context.localProviderState.value.configuredModel || undefined,
    ),
    context.t("setup.providerTestErrorFallback"),
  );
  if (!localProviderCheck.ok) {
    return failSetupAction(
      context.saving,
      context.toast,
      getErrorMessage(localProviderCheck.error, context.t("setup.providerTestErrorFallback")),
    );
  }

  context.testResults.value.local = localProviderCheck.value;
  if (hasStoredCloudCredentials(context.providerCredentials, context.settings)) return true;
  if (localProviderCheck.value.valid) return true;

  return failSetupAction(
    context.saving,
    context.toast,
    localProviderCheck.value.message ||
      context.t("setup.providerTestFailed", { provider: context.providerLabels.value.local }),
  );
};

const persistProviderConfiguration = async (
  context: Pick<
    SetupPageActionsContext,
    | "localModelEndpoint"
    | "localModelName"
    | "providerCredentials"
    | "saving"
    | "t"
    | "toast"
    | "updateApiKeys"
  >,
): Promise<boolean> => {
  const update: Record<string, string> = {
    localModelEndpoint: context.localModelEndpoint.value.trim() || LOCAL_AI_DEFAULT_ENDPOINT,
    localModelName: context.localModelName.value.trim() || LOCAL_AI_DEFAULT_MODEL,
  };

  for (const provider of CLOUD_PROVIDER_IDS) {
    const credential = context.providerCredentials[provider].trim();
    if (credential) update[API_KEY_FIELD_BY_PROVIDER[provider]] = credential;
  }

  const apiKeyUpdateResult = await settlePromise(
    context.updateApiKeys(update),
    context.t("setup.completeErrorFallback"),
  );
  if (apiKeyUpdateResult.ok) {
    context.saving.value = false;
    return true;
  }

  return failSetupAction(
    context.saving,
    context.toast,
    getErrorMessage(apiKeyUpdateResult.error, context.t("setup.completeErrorFallback")),
  );
};

export const useSetupCompletion = (context: SetupPageActionsContext) => async (): Promise<void> => {
  context.saving.value = true;
  const input = createCompletionInput(context);
  const nextAuthStatus = await ensureSetupApiKey(context, input);
  if (!nextAuthStatus) return;
  if (nextAuthStatus.authRequired && !context.getStoredApiKey()) {
    failSetupAction(context.saving, context.toast, context.t("apiErrors.auth.initFailed"));
    return;
  }
  if (!(await ensureProfileSaved(context, input))) return;
  if (!(await ensureProviderAvailability(context))) return;
  if (!(await persistProviderConfiguration(context))) return;

  context.toast.success(context.t("setup.completeToast"));
  await context.router.push(context.postSetupFlowTarget.value);
};
