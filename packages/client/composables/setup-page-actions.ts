import { OLLAMA_WEBSITE_URL } from "@bao/shared";
import { settlePromise } from "~/composables/async-flow";
import type { CloudProvider, SetupProvider } from "~/components/setup/setup-page-contracts";
import type {
  SetupPageActionsContext,
  SetupPageToastApi,
} from "~/utils/setup-page-action-contracts";
import { useSetupCompletion } from "~/utils/setup-page-completion";
import { getErrorMessage } from "~/utils/errors";

const useProviderTesting = ({
  localModelEndpoint,
  localProviderState,
  providerCredentials,
  providerLabels,
  t,
  testApiKey,
  testResults,
  testing,
  testingProvider,
  toast,
}: Pick<
  SetupPageActionsContext,
  | "localModelEndpoint"
  | "localProviderState"
  | "providerCredentials"
  | "providerLabels"
  | "t"
  | "testApiKey"
  | "testResults"
  | "testing"
  | "testingProvider"
  | "toast"
>) => {
  const getProviderTestKey = (provider: SetupProvider): string =>
    provider === "local"
      ? localModelEndpoint.value.trim() || localProviderState.value.endpoint
      : providerCredentials[provider].trim();

  return async (provider: SetupProvider): Promise<void> => {
    const key = getProviderTestKey(provider);
    if (!key && provider !== "local") return;

    testing.value = true;
    testingProvider.value = provider;
    testResults.value[provider] = null;
    const providerTestResult = await settlePromise(
      testApiKey(
        provider,
        key,
        provider === "local" ? localProviderState.value.configuredModel || undefined : undefined,
      ),
      t("setup.providerTestErrorFallback"),
    );
    testing.value = false;
    if (testingProvider.value === provider) testingProvider.value = null;
    if (!providerTestResult.ok) {
      toast.error(getErrorMessage(providerTestResult.error, t("setup.providerTestErrorFallback")));
      testResults.value[provider] = { valid: false, provider };
      return;
    }

    testResults.value[provider] = providerTestResult.value;
    if (providerTestResult.value.valid) {
      toast.success(t("setup.providerReachable", { provider: providerLabels.value[provider] }));
      return;
    }
    toast.error(
      providerTestResult.value.message ||
        t("setup.providerTestFailed", { provider: providerLabels.value[provider] }),
    );
  };
};

const useOllamaCommandCopy =
  (
    ollamaCommand: SetupPageActionsContext["ollamaCommand"],
    t: SetupPageActionsContext["t"],
    toast: SetupPageToastApi,
  ) =>
  async (): Promise<void> => {
    if (!import.meta.client) return;

    const clipboardWriteResult = await settlePromise(
      navigator.clipboard.writeText(ollamaCommand.value),
      t("setup.ollamaCommandCopyFailed"),
    );
    if (!clipboardWriteResult.ok) {
      toast.error(getErrorMessage(clipboardWriteResult.error, t("setup.ollamaCommandCopyFailed")));
      return;
    }

    toast.success(t("setup.ollamaCommandCopied"));
  };

export function createSetupPageActions(context: SetupPageActionsContext) {
  return {
    OLLAMA_WEBSITE_URL,
    copyOllamaCommand: useOllamaCommandCopy(context.ollamaCommand, context.t, context.toast),
    handleComplete: useSetupCompletion(context),
    handleTestProvider: useProviderTesting(context),
    updateProviderCredential: (provider: CloudProvider, value: string): void => {
      context.providerCredentials[provider] = value;
    },
  };
}
