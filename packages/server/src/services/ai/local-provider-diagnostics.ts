import { LOCAL_AI_AUTO_DETECT_MODEL, LOCAL_AI_SERVERS } from "@bao/shared/constants/ai-provider";
import type { AIProviderDiagnostic } from "@bao/shared/types/ai";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import type { JsonValue } from "@bao/shared/utils/json";
import { settle } from "@bao/shared/utils/promise";

const LOCAL_PROVIDER_HEALTH_TIMEOUT_MS = 3_000;
export const LOCAL_PROVIDER_ERROR_CODE: AIProviderDiagnostic["code"] = "error";
const TRAILING_SLASH_PATTERN = /\/$/;

type LocalDiagnosticInput = {
  code: AIProviderDiagnostic["code"];
  endpoint: string;
  checkedAt: string;
  selectedModel?: string;
  message?: string;
  availableModels?: readonly string[];
};

type LocalModelDiscoveryResult =
  | {
      endpoint: string;
      checkedAt: string;
      availableModels: readonly string[];
    }
  | {
      diagnostic: AIProviderDiagnostic;
    };

const getModelIdFromPayloadEntry = <T>(entry: T): string | null => {
  if (typeof entry !== "object" || entry === null || !("id" in entry)) {
    return null;
  }

  const candidateId = entry.id;
  return typeof candidateId === "string" && candidateId.trim().length > 0
    ? candidateId.trim()
    : null;
};

const buildDiagnosticResponse = ({
  code,
  endpoint,
  checkedAt,
  selectedModel,
  message,
  availableModels,
}: LocalDiagnosticInput): AIProviderDiagnostic => ({
  provider: "local",
  code,
  checkedAt,
  endpoint,
  selectedModel,
  availableModels,
  ...(message ? { message } : {}),
});

const buildModelsUrl = (endpoint: string): string =>
  endpoint.endsWith("/models")
    ? endpoint
    : `${endpoint.replace(TRAILING_SLASH_PATTERN, "")}/models`;

const extractAvailableModels = <T>(payload: T): string[] => {
  const data =
    typeof payload === "object" && payload !== null && "data" in payload ? payload.data : null;
  return Array.isArray(data)
    ? data.flatMap((entry) => {
        const id = getModelIdFromPayloadEntry(entry);
        return id ? [id] : [];
      })
    : [];
};

const buildFetchFailureDiagnostic = (
  endpoint: string,
  checkedAt: string,
  selectedModel: string | undefined,
  error: Error | string,
): AIProviderDiagnostic => {
  const message = toErrorMessage(error);
  return buildDiagnosticResponse({
    code: message.toLowerCase().includes("timeout") ? "timeout" : "unreachable",
    endpoint,
    checkedAt,
    selectedModel,
    message,
  });
};

const buildHttpFailureDiagnostic = (
  endpoint: string,
  checkedAt: string,
  selectedModel: string | undefined,
  status: number,
): LocalModelDiscoveryResult => ({
  diagnostic: buildDiagnosticResponse({
    code: "unreachable",
    endpoint,
    checkedAt,
    selectedModel,
    message: `HTTP ${status}`,
  }),
});

const buildPayloadDiagnostic = (
  endpoint: string,
  checkedAt: string,
  selectedModel: string | undefined,
  payload: JsonValue,
): LocalModelDiscoveryResult => {
  const availableModels = extractAvailableModels(payload);
  if (availableModels.length === 0) {
    return {
      diagnostic: buildDiagnosticResponse({
        code: "empty-model-list",
        endpoint,
        checkedAt,
        selectedModel,
        message: "Endpoint responded without any available models",
        availableModels,
      }),
    };
  }

  return {
    endpoint,
    checkedAt,
    availableModels,
  };
};

const loadAvailableModels = async (
  endpoint: string,
  checkedAt: string,
  selectedModel?: string,
): Promise<LocalModelDiscoveryResult> => {
  const responseResult = await settle(
    fetch(buildModelsUrl(endpoint), {
      method: "GET",
      signal: AbortSignal.timeout(LOCAL_PROVIDER_HEALTH_TIMEOUT_MS),
    }),
  );

  if (responseResult.status === "rejected") {
    return {
      diagnostic: buildFetchFailureDiagnostic(
        endpoint,
        checkedAt,
        selectedModel,
        responseResult.reason,
      ),
    };
  }

  const response = responseResult.value;
  if (!response.ok) {
    return buildHttpFailureDiagnostic(endpoint, checkedAt, selectedModel, response.status);
  }

  const payloadResult = await settle<JsonValue>(response.json() as Promise<JsonValue>);
  if (payloadResult.status === "rejected") {
    return {
      diagnostic: buildDiagnosticResponse({
        code: "error",
        endpoint,
        checkedAt,
        selectedModel,
        message: toErrorMessage(payloadResult.reason),
      }),
    };
  }

  return buildPayloadDiagnostic(endpoint, checkedAt, selectedModel, payloadResult.value);
};

export async function inspectLocalProviderEndpoint(
  baseUrl: string,
  selectedModel?: string,
): Promise<AIProviderDiagnostic> {
  const checkedAt = new Date().toISOString();
  const endpoint = baseUrl.trim();
  const modelDiscovery = await loadAvailableModels(endpoint, checkedAt, selectedModel);
  if ("diagnostic" in modelDiscovery) {
    return modelDiscovery.diagnostic;
  }

  const { availableModels } = modelDiscovery;
  if (
    selectedModel &&
    selectedModel !== LOCAL_AI_AUTO_DETECT_MODEL &&
    !availableModels.includes(selectedModel)
  ) {
    return buildDiagnosticResponse({
      code: "invalid-model",
      endpoint,
      checkedAt,
      selectedModel,
      message: "Configured model was not returned by the endpoint",
      availableModels,
    });
  }

  return buildDiagnosticResponse({
    code: "healthy",
    endpoint,
    checkedAt,
    selectedModel:
      selectedModel && selectedModel !== LOCAL_AI_AUTO_DETECT_MODEL
        ? selectedModel
        : availableModels[0],
    availableModels,
  });
}

export async function detectFirstLocalProviderModel(baseUrl: string): Promise<string | null> {
  const diagnostics = await inspectLocalProviderEndpoint(baseUrl);
  return diagnostics.availableModels?.[0] ?? null;
}

/**
 * Model ids the local server actually serves. Used to reject a per-request model
 * the endpoint does not have installed before it turns into a 404.
 */
export async function listLocalProviderModelIds(baseUrl: string): Promise<readonly string[]> {
  const diagnostics = await inspectLocalProviderEndpoint(baseUrl);
  return diagnostics.availableModels ?? [];
}

export async function detectLocalProviderServers(): Promise<
  Array<{
    id?: string;
    baseUrl: string;
    name: string;
    available: boolean;
    availableModels?: readonly string[];
    diagnosticCode?: AIProviderDiagnostic["code"];
    message?: string;
  }>
> {
  const servers = LOCAL_AI_SERVERS.map((server) => ({
    id: server.id,
    baseUrl: server.baseUrl,
    name: server.name,
  }));

  return await Promise.all(
    servers.map(async (server) => {
      const result = await settle(
        Promise.resolve().then(async () => {
          const diagnostics = await inspectLocalProviderEndpoint(server.baseUrl);
          return {
            ...server,
            available: diagnostics.code === "healthy",
            availableModels: diagnostics.availableModels
              ? [...diagnostics.availableModels]
              : undefined,
            diagnosticCode: diagnostics.code,
            message: diagnostics.message,
          };
        }),
      );

      if (result.status === "rejected") {
        return {
          ...server,
          available: false,
          diagnosticCode: LOCAL_PROVIDER_ERROR_CODE,
          message: toErrorMessage(result.reason),
        };
      }

      return result.value;
    }),
  );
}
