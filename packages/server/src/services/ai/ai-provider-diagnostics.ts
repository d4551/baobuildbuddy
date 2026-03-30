import type { AIProviderStatus, AIProviderType } from "@bao/shared";
import { LOCAL_AI_AUTO_DETECT_MODEL, settle, toErrorMessage } from "@bao/shared";
import { LocalProvider } from "./local-provider";
import type { AIProvider } from "./provider-interface";

const getLocalProviderStatus = async (
  providerName: AIProviderType,
  provider: AIProvider,
  getActiveModel: (providerType: AIProviderType) => string | null,
): Promise<AIProviderStatus> => {
  const diagnostics = await LocalProvider.inspectEndpoint(
    provider.baseUrl || "",
    getActiveModel("local") ?? undefined,
  );
  return {
    provider: providerName,
    available: diagnostics.code === "healthy",
    health: diagnostics.code === "healthy" ? "healthy" : "down",
    lastCheck: Date.now(),
    error: diagnostics.message,
    endpoint: diagnostics.endpoint,
    selectedModel: diagnostics.selectedModel,
    availableModels: diagnostics.availableModels ? [...diagnostics.availableModels] : undefined,
    diagnosticCode: diagnostics.code,
  } satisfies AIProviderStatus;
};

const getRemoteProviderStatus = async (
  providerName: AIProviderType,
  provider: AIProvider,
): Promise<AIProviderStatus> => {
  const availabilityResult = await settle(provider.isAvailable());
  if (availabilityResult.status === "fulfilled") {
    return {
      provider: providerName,
      available: availabilityResult.value,
      health: availabilityResult.value ? "healthy" : "down",
      lastCheck: Date.now(),
      selectedModel: provider.model,
    } satisfies AIProviderStatus;
  }

  return {
    provider: providerName,
    available: false,
    health: "down",
    lastCheck: Date.now(),
    error: toErrorMessage(availabilityResult.reason),
    selectedModel: provider.model === LOCAL_AI_AUTO_DETECT_MODEL ? undefined : provider.model,
    diagnosticCode: "error",
  } satisfies AIProviderStatus;
};

export const getProviderStatuses = async (
  providers: Map<AIProviderType, AIProvider>,
  getActiveModel: (providerType: AIProviderType) => string | null,
): Promise<AIProviderStatus[]> => {
  const checks = Array.from(providers.entries()).map(async ([providerName, provider]) => {
    if (providerName === "local" && provider.baseUrl) {
      return getLocalProviderStatus(providerName, provider, getActiveModel);
    }

    return getRemoteProviderStatus(providerName, provider);
  });

  return Promise.all(checks);
};

export const detectLocalProviders = async (): Promise<
  Array<{
    baseUrl: string;
    name: string;
    available: boolean;
    availableModels?: readonly string[];
    diagnosticCode?: AIProviderStatus["diagnosticCode"];
    message?: string;
  }>
> => LocalProvider.detectLocalServers();
