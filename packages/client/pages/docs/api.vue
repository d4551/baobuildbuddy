<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useTemplateRef } from "vue";
import { API_ENDPOINTS, safeParseJson, type JsonObject, type JsonValue } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { useAuth } from "~/composables/useAuth";
import { useFocusTrap } from "~/composables/useFocusTrap";
import { useScrollSpy } from "~/composables/useScrollSpy";
import { useToast } from "~/composables/useToast";
import { resolveApiEndpoint } from "~/utils/endpoints";
import { getErrorMessage } from "~/utils/errors";

const { t } = useI18n();
const auth = useAuth();
const toast = useToast();

definePageMeta({
  middleware: ["auth"],
});

if (import.meta.server) {
  useServerSeoMeta({
    title: t("apiDocs.seoTitle"),
    description: t("apiDocs.seoDescription"),
  });
}

type ApiHttpMethod = "get" | "post" | "put" | "delete" | "patch" | "head" | "options" | "trace";
type ApiDocsUiState =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "errorRetryable"
  | "errorNonRetryable"
  | "unauthorized";
type ApiTesterState =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "errorRetryable"
  | "errorNonRetryable"
  | "unauthorized";

interface OpenApiInfo {
  title?: string;
  description?: string;
  version?: string;
}

interface OpenApiMediaType {
  example?: JsonValue;
  examples?: Record<string, { value?: JsonValue }>;
  schema?: JsonObject;
}

interface OpenApiRequestBody {
  required?: boolean;
  content?: Record<string, OpenApiMediaType>;
}

interface OpenApiResponse {
  description?: string;
  content?: Record<string, OpenApiMediaType>;
}

interface OpenApiParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  example?: string;
}

interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses?: Record<string, OpenApiResponse>;
}

interface OpenApiSpec {
  openapi?: string;
  info?: OpenApiInfo;
  paths?: Record<string, Record<string, unknown>>;
}

interface ApiEndpoint {
  readonly id: string;
  readonly path: string;
  readonly method: ApiHttpMethod;
  readonly operation: OpenApiOperation;
  readonly groupLabel: string;
  readonly pathParameters: readonly string[];
  readonly queryParameters: readonly OpenApiParameter[];
  readonly requestBodyTemplate: string;
  readonly requestBodyRequired: boolean;
}

interface ApiEndpointGroup {
  readonly id: string;
  readonly label: string;
  readonly endpoints: readonly ApiEndpoint[];
}

interface FetchEndpointResultOk {
  readonly ok: true;
  readonly statusCode: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly body: string;
  readonly durationMs: number;
}

interface FetchEndpointResultErr {
  readonly ok: false;
  readonly errorMessage: string;
}

type FetchEndpointResult = FetchEndpointResultOk | FetchEndpointResultErr;

const API_DOCS_ASYNC_DATA_KEY = "api-docs-json";
const UNKNOWN_TAG_LABEL_KEY = "apiDocs.groups.untagged" as const;
const HTTP_METHODS_ORDER = ["get", "post", "put", "patch", "delete", "head", "options", "trace"] as const;
const HTTP_METHOD_CLASSES: Record<ApiHttpMethod, string> = {
  get: "badge-success",
  post: "badge-info",
  put: "badge-warning",
  patch: "badge-accent",
  delete: "badge-error",
  head: "badge-neutral",
  options: "badge-neutral",
  trace: "badge-neutral",
};
const EMPTY_TEXT_LABEL = "—";

const route = useRoute();
const config = useRuntimeConfig();
const requestUrl = useRequestURL();
const apiBase = String(config.public.apiBase || "/");

const endpointTesterDialogRef = useTemplateRef<HTMLDialogElement>("apiEndpointTesterDialog");
const lastFocusedElement = ref<HTMLElement | null>(null);
useFocusTrap(endpointTesterDialogRef, computed(() => Boolean(endpointTesterDialogRef.value?.open)));

const {
  activeSectionId,
  setSectionRef,
  scrollToSection,
  syncFromHash,
  startObserver,
  refreshObserver,
  stopObserver,
} = useScrollSpy();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isOpenApiParameterIn = (value: unknown): value is OpenApiParameter["in"] =>
  value === "path" || value === "query" || value === "header" || value === "cookie";

const isApiHttpMethod = (value: string): value is ApiHttpMethod =>
  HTTP_METHODS_ORDER.includes(value as ApiHttpMethod);

const normalizePathForId = (path: string): string =>
  path
    .toLowerCase()
    .replace(/[^a-z0-9]+/giu, "-")
    .replace(/(^-|-$)/gu, "") || "root";

const dedupeCaseInsensitiveStrings = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(normalized);
  }
  return output;
};

const readOpenApiSpec = (value: unknown): OpenApiSpec | null => {
  if (!isRecord(value)) {
    return null;
  }

  const infoRaw = isRecord(value.info) ? value.info : undefined;
  return {
    openapi: typeof value.openapi === "string" ? value.openapi : undefined,
    info: {
      title: typeof infoRaw?.title === "string" ? infoRaw.title : undefined,
      description: typeof infoRaw?.description === "string" ? infoRaw.description : undefined,
      version: typeof infoRaw?.version === "string" ? infoRaw.version : undefined,
    },
    paths: isRecord(value.paths) ? value.paths : {},
  };
};

const dedupeParameters = (parameters: readonly OpenApiParameter[]): OpenApiParameter[] => {
  const unique = new Map<string, OpenApiParameter>();
  for (const parameter of parameters) {
    const key = `${parameter.in}:${parameter.name.toLowerCase()}`;
    if (!unique.has(key)) {
      unique.set(key, {
        ...parameter,
        name: parameter.name.trim(),
      });
    }
  }
  return Array.from(unique.values()).filter((parameter) => parameter.name.length > 0);
};

const collectPathParameters = (path: string): string[] => {
  const names: string[] = [];
  const pattern = /\{([^}]+)\}/gu;
  for (const match of path.matchAll(pattern)) {
    const value = match[1];
    if (typeof value === "string" && value.trim().length > 0) {
      names.push(value.trim());
    }
  }
  return names;
};

const getPathParameters = (pathItem: Record<string, unknown>): OpenApiParameter[] => {
  const rawParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
  const normalized = rawParameters
    .filter((parameter): parameter is OpenApiParameter => {
      if (!isRecord(parameter)) {
        return false;
      }
      if (typeof parameter.name !== "string") {
        return false;
      }
      return isOpenApiParameterIn(parameter.in);
    })
    .map((parameter) => ({
      ...parameter,
      name: parameter.name.trim(),
    }));
  return dedupeParameters(normalized);
};

const getOperation = (
  value: unknown,
  pathParameters: readonly OpenApiParameter[],
): OpenApiOperation | null => {
  if (!isRecord(value)) {
    return null;
  }

  const parameters = Array.isArray(value.parameters) ? value.parameters : [];
  const operationParameters = parameters.filter((parameter): parameter is OpenApiParameter => {
    if (!isRecord(parameter)) {
      return false;
    }
    if (typeof parameter.name !== "string") {
      return false;
    }
    return isOpenApiParameterIn(parameter.in);
  });

  const mergedParameters = dedupeParameters([...pathParameters, ...operationParameters]);
  return {
    operationId: typeof value.operationId === "string" ? value.operationId : undefined,
    summary: typeof value.summary === "string" ? value.summary : undefined,
    description: typeof value.description === "string" ? value.description : undefined,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
    deprecated: typeof value.deprecated === "boolean" ? value.deprecated : undefined,
    parameters: mergedParameters,
    requestBody: isRecord(value.requestBody) ? (value.requestBody as OpenApiRequestBody) : undefined,
    responses: isRecord(value.responses)
      ? (value.responses as Record<string, OpenApiResponse>)
      : undefined,
  };
};

const collectParameters = (
  parameters: readonly OpenApiParameter[],
  inValue: OpenApiParameter["in"],
): OpenApiParameter[] => dedupeParameters(parameters.filter((parameter) => parameter.in === inValue));

const getParameterValueDefault = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
};

const requestBodyTemplate = (requestBody: OpenApiRequestBody | undefined): string => {
  const content = isRecord(requestBody?.content) ? requestBody.content : undefined;
  if (!content) {
    return "";
  }
  const jsonBody = content["application/json"];
  if (!isRecord(jsonBody)) {
    return "";
  }

  const candidate =
    jsonBody.example ?? Object.values(jsonBody.examples ?? {})[0]?.value;
  if (candidate === undefined) {
    return "";
  }
  if (typeof candidate === "string") {
    return candidate;
  }
  return JSON.stringify(candidate, null, 2);
};

const {
  data: rawApiSpecData,
  status: apiSpecStatus,
  error: apiSpecError,
  refresh: refreshApiSpec,
} = await useAsyncData(
  API_DOCS_ASYNC_DATA_KEY,
  async () => $fetch<unknown>(resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.apiDocsJson)),
  { server: true, lazy: false },
);

const openApiSpec = computed<OpenApiSpec | null>(() => readOpenApiSpec(rawApiSpecData.value));

const endpointGroups = computed<ApiEndpointGroup[]>(() => {
  const paths = openApiSpec.value?.paths ?? {};
  const grouped = new Map<string, ApiEndpoint[]>();
  const methodOrder = new Map<ApiHttpMethod, number>(
    HTTP_METHODS_ORDER.map((method, index) => [method, index]),
  );

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) {
      continue;
    }
    const inheritedPathParameters = getPathParameters(pathItem);
    for (const [rawMethod, rawOperation] of Object.entries(pathItem)) {
      if (!isApiHttpMethod(rawMethod)) {
        continue;
      }
      const operation = getOperation(rawOperation, inheritedPathParameters);
      if (!operation) {
        continue;
      }

      const pathParameters = dedupeCaseInsensitiveStrings([
        ...collectPathParameters(path),
        ...collectParameters(operation.parameters ?? [], "path").map((parameter) => parameter.name),
      ]);
      const queryParameters = collectParameters(operation.parameters ?? [], "query");
      const requestBody = operation.requestBody;
      const groupLabel = operation.tags?.[0] ?? t(UNKNOWN_TAG_LABEL_KEY);
      const currentGroup = grouped.get(groupLabel) ?? [];
      currentGroup.push({
        id: `${rawMethod}-${normalizePathForId(path)}`,
        path,
        method: rawMethod,
        operation,
        groupLabel,
        pathParameters,
        queryParameters,
        requestBodyTemplate: requestBodyTemplate(requestBody),
        requestBodyRequired: Boolean(requestBody?.required),
      });
      grouped.set(groupLabel, currentGroup);
    }
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right, "en"))
    .map(([label, endpoints]) => ({
      id: `group-${normalizePathForId(label)}`,
      label,
      endpoints: endpoints.sort((left, right) => {
        const pathCompare = left.path.localeCompare(right.path, "en");
        if (pathCompare !== 0) {
          return pathCompare;
        }
        return (methodOrder.get(left.method) ?? 0) - (methodOrder.get(right.method) ?? 0);
      }),
    }));
});

const apiDocsUiState = computed<ApiDocsUiState>(() => {
  if (apiSpecStatus.value === "pending") {
    return "loading";
  }
  if (apiSpecStatus.value === "idle") {
    return "idle";
  }
  if (apiSpecError.value) {
    const errorObject = apiSpecError.value as { status?: number; statusCode?: number };
    const statusCode =
      typeof errorObject.status === "number"
        ? errorObject.status
        : typeof errorObject.statusCode === "number"
          ? errorObject.statusCode
          : null;
    if (statusCode === 401) {
      return "unauthorized";
    }
    if (statusCode === null || statusCode >= 500) {
      return "errorRetryable";
    }
    return "errorNonRetryable";
  }
  if (endpointGroups.value.length === 0) {
    return "empty";
  }
  return "success";
});

const apiDocsTitle = computed<string>(() => {
  const infoTitle = openApiSpec.value?.info?.title;
  return infoTitle?.trim().length ? infoTitle : t("apiDocs.title");
});

const selectedEndpoint = ref<ApiEndpoint | null>(null);
const testerState = ref<ApiTesterState>("idle");
const pathParameterValues = ref<Record<string, string>>({});
const queryParameterValues = ref<Record<string, string>>({});
const requestBodyText = ref("");
const testStatusCode = ref<number | null>(null);
const testStatusText = ref("");
const testDurationMs = ref<number | null>(null);
const testResponseBody = ref("");
const testResponseHeaders = ref<Record<string, string>>({});
const testErrorMessage = ref("");
const testRequestMethod = ref<ApiHttpMethod | null>(null);
const testRequestUrl = ref("");

const endpointMethodClass = (method: ApiHttpMethod): string => HTTP_METHOD_CLASSES[method];
const formatMethodLabel = (method: ApiHttpMethod): string => method.toUpperCase();

const selectedOperationDescription = computed<string>(() => {
  const endpoint = selectedEndpoint.value;
  if (!endpoint) {
    return "";
  }
  return (
    endpoint.operation.description?.trim() ||
    endpoint.operation.summary?.trim() ||
    t("apiDocs.endpoint.noDescription")
  );
});

const selectedPathParameters = computed<string[]>(() => selectedEndpoint.value?.pathParameters ?? []);
const selectedQueryParameters = computed<readonly OpenApiParameter[]>(
  () => selectedEndpoint.value?.queryParameters ?? [],
);
const selectedRequestBodyTemplate = computed<string>(
  () => selectedEndpoint.value?.requestBodyTemplate ?? "",
);
const responseHeaderEntries = computed<readonly [string, string][]>(
  () => Object.entries(testResponseHeaders.value),
);
const hasResponseHeaders = computed<boolean>(() => responseHeaderEntries.value.length > 0);
const hasSelectedEndpointRequestTrace = computed<boolean>(
  () => testRequestMethod.value !== null && testRequestUrl.value.length > 0,
);
const endpointHasBody = computed<boolean>(
  () =>
    (selectedEndpoint.value?.requestBodyTemplate?.length ?? 0) > 0 ||
    Boolean(selectedEndpoint.value?.requestBodyRequired),
);

const canRunEndpoint = computed<boolean>(() => {
  const endpoint = selectedEndpoint.value;
  if (!endpoint) {
    return false;
  }
  if (endpoint.pathParameters.some((name) => pathParameterValues.value[name]?.trim().length === 0)) {
    return false;
  }
  if (!endpoint.requestBodyRequired) {
    if (endpoint.requestBodyTemplate.length > 0 && requestBodyText.value.trim().length > 0) {
      return safeParseJson(requestBodyText.value) !== null;
    }
    return true;
  }
  if (requestBodyText.value.trim().length === 0) {
    return false;
  }
  return safeParseJson(requestBodyText.value) !== null;
});

const requestBodyDisplay = computed<string>(() => {
  if (testResponseBody.value.length === 0) {
    return "";
  }
  const parsedResponse = safeParseJson(testResponseBody.value);
  return parsedResponse === null ? testResponseBody.value : JSON.stringify(parsedResponse, null, 2);
});

const showTesterResponsePanel = computed<boolean>(
  () =>
    testerState.value === "success" ||
    testerState.value === "empty" ||
    testerState.value === "errorRetryable" ||
    testerState.value === "errorNonRetryable" ||
    testerState.value === "unauthorized",
);

const responseStatusText = computed<{ status: number | string; text: string }>(() => ({
  status: testStatusCode.value ?? EMPTY_TEXT_LABEL,
  text: testStatusText.value || EMPTY_TEXT_LABEL,
}));

const lifecycleStepClasses = computed<[string, string, string]>(() => {
  const configureClass = "step step-primary";
  const sendClass =
    testerState.value === "loading" ||
    testerState.value === "success" ||
    testerState.value === "empty" ||
    testerState.value === "errorRetryable" ||
    testerState.value === "errorNonRetryable" ||
    testerState.value === "unauthorized"
      ? "step step-primary"
      : "step";
  const responseClass =
    testerState.value === "success"
      ? "step step-success"
      : testerState.value === "empty"
        ? "step step-warning"
        : testerState.value === "errorRetryable" ||
            testerState.value === "errorNonRetryable" ||
            testerState.value === "unauthorized"
          ? "step step-error"
          : "step";
  return [configureClass, sendClass, responseClass];
});

const resetEndpointTesterState = (): void => {
  testerState.value = "idle";
  testStatusCode.value = null;
  testStatusText.value = "";
  testDurationMs.value = null;
  testResponseBody.value = "";
  testResponseHeaders.value = {};
  testErrorMessage.value = "";
  testRequestMethod.value = null;
  testRequestUrl.value = "";
};

const hydrateEndpointInputs = (endpoint: ApiEndpoint): void => {
  const pathDefaults: Record<string, string> = {};
  endpoint.pathParameters.forEach((parameterName) => {
    pathDefaults[parameterName] = "";
  });

  const queryDefaults: Record<string, string> = {};
  endpoint.queryParameters.forEach((parameter) => {
    queryDefaults[parameter.name] = getParameterValueDefault(parameter.example);
  });

  pathParameterValues.value = pathDefaults;
  queryParameterValues.value = queryDefaults;
  requestBodyText.value = endpoint.requestBodyTemplate;
};

const openEndpointTester = (endpoint: ApiEndpoint): void => {
  selectedEndpoint.value = endpoint;
  hydrateEndpointInputs(endpoint);
  resetEndpointTesterState();
  if (import.meta.client && document.activeElement instanceof HTMLElement) {
    lastFocusedElement.value = document.activeElement;
  }
  nextTick(() => {
    const dialog = endpointTesterDialogRef.value;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  });
};

const handleEndpointTesterClose = (): void => {
  selectedEndpoint.value = null;
  resetEndpointTesterState();
  nextTick(() => {
    lastFocusedElement.value?.focus();
  });
};

const closeEndpointTester = (): void => {
  const dialog = endpointTesterDialogRef.value;
  if (dialog?.open) {
    dialog.close();
  } else {
    handleEndpointTesterClose();
  }
};

const resolveTesterPath = (endpoint: ApiEndpoint): string => {
  let path = endpoint.path;
  for (const parameterName of endpoint.pathParameters) {
    const value = pathParameterValues.value[parameterName]?.trim();
    if (!value) {
      return "";
    }
    path = path.replaceAll(`{${parameterName}}`, encodeURIComponent(value));
  }
  return path;
};

const buildTesterUrl = (endpoint: ApiEndpoint, basePath: string): string => {
  const query = new URLSearchParams();
  endpoint.queryParameters.forEach((parameter) => {
    const value = queryParameterValues.value[parameter.name]?.trim();
    if (value) {
      query.set(parameter.name, value);
    }
  });
  const queryString = query.toString();
  return queryString.length > 0
    ? `${basePath}${basePath.includes("?") ? "&" : "?"}${queryString}`
    : basePath;
};

const isRetryableStatus = (statusCode: number): boolean =>
  statusCode === 408 || statusCode === 429 || statusCode >= 500;

const executeEndpointRequest = async (): Promise<void> => {
  const endpoint = selectedEndpoint.value;
  if (!endpoint || testerState.value === "loading" || !canRunEndpoint.value) {
    return;
  }

  const resolvedPath = resolveTesterPath(endpoint);
  if (!resolvedPath) {
    testerState.value = "errorNonRetryable";
    testErrorMessage.value = t("apiDocs.tester.invalidPath");
    toast.warning(t("apiDocs.tester.requestErrorToast"));
    return;
  }

  testerState.value = "loading";
  testErrorMessage.value = "";
  testStatusCode.value = null;
  testStatusText.value = "";
  testResponseBody.value = "";
  testResponseHeaders.value = {};
  testRequestMethod.value = endpoint.method;

  const endpointUrl = buildTesterUrl(endpoint, resolveApiEndpoint(apiBase, requestUrl, resolvedPath));
  testRequestUrl.value = endpointUrl;
  const headers: Record<string, string> = {};
  const apiKey = auth.getStoredApiKey();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const requestBody = endpointHasBody.value ? requestBodyText.value.trim() : "";
  if (requestBody.length > 0) {
    headers["Content-Type"] = "application/json";
  }

  const startedAt = Date.now();
  const fetchResult: FetchEndpointResult = await fetch(endpointUrl, {
    method: formatMethodLabel(endpoint.method),
    headers,
    body: requestBody.length > 0 ? requestBody : undefined,
  }).then(
    async (response) => {
      const body = await response.text();
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      return {
        ok: true,
        statusCode: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body,
        durationMs: Date.now() - startedAt,
      };
    },
    (error: unknown) => ({
      ok: false,
      errorMessage: getErrorMessage(error, t("apiDocs.tester.requestFailure")),
    }),
  );

  if (!fetchResult.ok) {
    testerState.value = "errorRetryable";
    testErrorMessage.value = fetchResult.errorMessage;
    testDurationMs.value = Date.now() - startedAt;
    toast.error(t("apiDocs.tester.requestErrorToast"));
    return;
  }

  testStatusCode.value = fetchResult.statusCode;
  testStatusText.value = fetchResult.statusText;
  testResponseHeaders.value = fetchResult.headers;
  testResponseBody.value = fetchResult.body;
  testDurationMs.value = fetchResult.durationMs;

  if (fetchResult.statusCode === 401) {
    testerState.value = "unauthorized";
    toast.error(t("apiDocs.tester.requestErrorToast"));
    return;
  }

  if (fetchResult.statusCode >= 400) {
    testerState.value = isRetryableStatus(fetchResult.statusCode)
      ? "errorRetryable"
      : "errorNonRetryable";
    toast.error(t("apiDocs.tester.requestErrorToast"));
    return;
  }

  if (fetchResult.body.trim().length === 0) {
    testerState.value = "empty";
    toast.info(t("apiDocs.tester.emptyResponseToast"));
    return;
  }

  testerState.value = "success";
  toast.success(t("apiDocs.tester.requestSuccessToast"));
};

watch(
  endpointGroups,
  () => {
    nextTick(() => {
      startObserver();
      refreshObserver();
      const firstEndpoint = endpointGroups.value.flatMap((group) => group.endpoints)[0];
      const restoredFromHash = syncFromHash(route.hash);
      if (!restoredFromHash && firstEndpoint) {
        scrollToSection(firstEndpoint.id, {
          smooth: false,
          focus: false,
          updateHash: false,
        });
      }
    });
  },
  { immediate: true, deep: true },
);

watch(
  () => route.hash,
  (hash) => {
    syncFromHash(hash);
  },
);

onMounted(() => {
  const firstEndpoint = endpointGroups.value.flatMap((group) => group.endpoints)[0];
  const restoredFromHash = syncFromHash(route.hash);
  if (!restoredFromHash && firstEndpoint) {
    scrollToSection(firstEndpoint.id, {
      smooth: false,
      focus: false,
      updateHash: false,
    });
  }
  startObserver();
});

onBeforeUnmount(() => {
  stopObserver();
});

const uiStateMessageKey = computed(() => {
  if (apiDocsUiState.value === "loading") return "apiDocs.state.loading";
  if (apiDocsUiState.value === "errorRetryable") return "apiDocs.state.errorRetryable";
  if (apiDocsUiState.value === "errorNonRetryable") return "apiDocs.state.errorNonRetryable";
  if (apiDocsUiState.value === "unauthorized") return "apiDocs.state.unauthorized";
  if (apiDocsUiState.value === "empty") return "apiDocs.state.empty";
  return "";
});
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 id="api-docs-page-title" class="text-3xl font-bold">{{ apiDocsTitle }}</h1>
      <p class="text-sm text-base-content/75">{{ t("apiDocs.intro") }}</p>
    </header>

    <div v-if="apiDocsUiState !== 'success'" class="rounded-box bg-base-200 p-4">
      <div
        v-if="apiDocsUiState === 'loading' || apiDocsUiState === 'idle'"
        class="flex items-center gap-3"
        role="status"
        aria-live="polite"
      >
        <span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
        <span>{{ t("apiDocs.state.loading") }}</span>
      </div>
      <div v-else-if="apiDocsUiState === 'empty'" class="alert alert-info" role="status">
        <span>{{ t("apiDocs.state.empty") }}</span>
      </div>
      <div
        v-else
        :class="{
          'alert alert-warning': apiDocsUiState === 'errorRetryable' || apiDocsUiState === 'errorNonRetryable',
          'alert alert-error': apiDocsUiState === 'unauthorized',
        }"
        role="alert"
      >
        <span>{{ t(uiStateMessageKey) }}</span>
        <button
          v-if="apiDocsUiState === 'errorRetryable'"
          type="button"
          class="btn btn-sm btn-outline"
          :disabled="apiSpecStatus === 'pending'"
          :aria-label="t('apiDocs.actions.retry')"
          @click="refreshApiSpec()"
        >
          {{ t("apiDocs.actions.retry") }}
        </button>
      </div>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside :aria-label="t('apiDocs.a11y.endpointNavigation')" class="lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)]">
        <h2 class="mb-2 text-lg font-semibold">{{ t("apiDocs.endpointNavigator") }}</h2>
        <ul class="menu rounded-box bg-base-200 p-2">
          <li v-for="group in endpointGroups" :key="group.id">
            <details open>
              <summary>{{ group.label }}</summary>
              <ul class="menu px-2 pb-2">
                <li v-for="endpoint in group.endpoints" :key="endpoint.id">
                  <button
                    type="button"
                    :aria-label="t('apiDocs.endpoint.openTesterAria', { method: endpoint.method.toUpperCase(), path: endpoint.path })"
                    :aria-current="activeSectionId === endpoint.id ? 'location' : undefined"
                    :class="{ active: activeSectionId === endpoint.id }"
                    @click="scrollToSection(endpoint.id)"
                  >
                    <span :class="`badge badge-sm ${endpointMethodClass(endpoint.method)}`">
                      {{ endpoint.method.toUpperCase() }}
                    </span>
                    <span class="truncate font-mono text-xs">{{ endpoint.path }}</span>
                  </button>
                </li>
              </ul>
            </details>
          </li>
        </ul>
      </aside>

      <main class="space-y-8">
        <section
          v-for="group in endpointGroups"
          :key="group.id"
          :id="group.id"
          :aria-labelledby="`${group.id}-title`"
          class="space-y-4"
        >
          <h2 :id="`${group.id}-title`" class="text-xl font-semibold">{{ group.label }}</h2>
          <article
            v-for="endpoint in group.endpoints"
            :id="endpoint.id"
            :key="endpoint.id"
            :ref="(element) => setSectionRef(endpoint.id, element)"
            tabindex="-1"
            class="scroll-mt-20 rounded-box border border-base-300 bg-base-200 p-4"
          >
            <header class="mb-3 flex flex-wrap items-start gap-2">
              <span :class="`badge ${endpointMethodClass(endpoint.method)}`">
                {{ endpoint.method.toUpperCase() }}
              </span>
              <h3 class="font-mono text-base font-semibold">{{ endpoint.path }}</h3>
              <span v-if="endpoint.operation.deprecated" class="badge badge-warning badge-outline">
                {{ t("apiDocs.endpoint.deprecated") }}
              </span>
            </header>
            <p class="mb-3 text-sm text-base-content/80">
              {{ endpoint.operation.summary?.trim() || endpoint.operation.description?.trim() || t('apiDocs.endpoint.noDescription') }}
            </p>
            <div class="mb-3 flex flex-wrap gap-2 text-xs text-base-content/60">
              <span>{{ t("apiDocs.endpoint.methodLabel") }}: {{ formatMethodLabel(endpoint.method) }}</span>
              <span v-if="endpoint.operation.operationId">
                | {{ t("apiDocs.endpoint.operationIdLabel") }}: {{ endpoint.operation.operationId }}
              </span>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-primary"
              :aria-label="t('apiDocs.endpoint.openTesterAria', { method: endpoint.method.toUpperCase(), path: endpoint.path })"
              @click="openEndpointTester(endpoint)"
            >
              {{ t("apiDocs.endpoint.openTester") }}
            </button>
          </article>
        </section>
      </main>
    </div>

    <dialog ref="apiEndpointTesterDialog" class="modal modal-bottom sm:modal-middle" @close="handleEndpointTesterClose">
      <div class="modal-box max-w-5xl" role="dialog" :aria-label="t('apiDocs.tester.title')" aria-modal="true">
        <h3 class="text-lg font-bold">{{ t("apiDocs.tester.title") }}</h3>
        <p v-if="selectedEndpoint" class="mt-1 text-sm text-base-content/75">
          {{ selectedOperationDescription }}
        </p>

        <section class="mt-4">
          <h4 class="text-sm font-semibold">{{ t("apiDocs.tester.lifecycleTitle") }}</h4>
          <ul class="steps steps-vertical mt-2 w-full lg:steps-horizontal">
            <li :class="lifecycleStepClasses[0]">{{ t("apiDocs.tester.steps.configure") }}</li>
            <li :class="lifecycleStepClasses[1]">{{ t("apiDocs.tester.steps.send") }}</li>
            <li :class="lifecycleStepClasses[2]">{{ t("apiDocs.tester.steps.response") }}</li>
          </ul>
        </section>

        <section v-if="selectedPathParameters.length > 0" class="mt-4" :aria-label="t('apiDocs.tester.pathParametersIntro')">
          <p class="text-sm text-base-content/80">{{ t("apiDocs.tester.pathParametersIntro") }}</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label
              v-for="pathParameter in selectedPathParameters"
              :key="`${selectedEndpoint?.id}-${pathParameter}`"
              class="form-control"
            >
              <span class="label text-xs">{{ t("apiDocs.tester.parameterLabel", { name: pathParameter }) }}</span>
              <input
                v-model="pathParameterValues[pathParameter]"
                class="input input-bordered input-sm"
                type="text"
                :aria-label="t('apiDocs.tester.parameterLabel', { name: pathParameter })"
              />
            </label>
          </div>
        </section>

        <section
          v-if="selectedEndpoint?.queryParameters && selectedEndpoint.queryParameters.length > 0"
          class="mt-4"
          :aria-label="t('apiDocs.tester.queryParametersIntro')"
        >
          <p class="text-sm text-base-content/80">{{ t("apiDocs.tester.queryParametersIntro") }}</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label
              v-for="parameter in selectedQueryParameters"
              :key="`${selectedEndpoint?.id}-${parameter.name}`"
              class="form-control"
            >
              <span class="label-text text-xs">{{ t("apiDocs.tester.parameterLabel", { name: parameter.name }) }}</span>
              <input
                v-model="queryParameterValues[parameter.name]"
                class="input input-bordered input-sm"
                :aria-label="t('apiDocs.tester.parameterLabel', { name: parameter.name })"
                type="text"
              />
            </label>
          </div>
        </section>

        <section v-if="selectedEndpoint && endpointHasBody" class="mt-4" :aria-label="t('apiDocs.tester.requestBodyIntro')">
          <p class="text-sm text-base-content/80">{{ t("apiDocs.tester.requestBodyIntro") }}</p>
          <textarea
            v-model="requestBodyText"
            class="textarea textarea-bordered mt-2 min-h-28 w-full font-mono text-sm"
            :aria-label="t('apiDocs.tester.requestBodyAria')"
            spellcheck="false"
            :placeholder="t('apiDocs.tester.bodyPlaceholder')"
          />
          <p v-if="selectedRequestBodyTemplate.length === 0" class="mt-1 text-xs text-base-content/50">
            {{ t("apiDocs.tester.noRequestBodyTemplate") }}
          </p>
        </section>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!canRunEndpoint || testerState === 'loading'"
            :aria-label="t('apiDocs.tester.send')"
            @click="executeEndpointRequest"
          >
            <span v-if="testerState === 'loading'" class="loading loading-spinner loading-xs" aria-hidden="true"></span>
            <span>{{ testerState === "loading" ? t("apiDocs.tester.sending") : t("apiDocs.tester.send") }}</span>
          </button>
          <button
            class="btn btn-ghost"
            type="button"
            :aria-label="t('apiDocs.tester.closeAria')"
            @click="closeEndpointTester"
          >
            {{ t("apiDocs.tester.close") }}
          </button>
        </div>

        <section class="mt-4" :aria-label="t('apiDocs.tester.requestTraceTitle')">
          <h4 class="font-semibold">{{ t("apiDocs.tester.requestTraceTitle") }}</h4>
          <div class="mt-2 rounded-box bg-base-300 p-3 text-xs">
            <p class="break-words">
              <span class="font-semibold">{{ t("apiDocs.tester.requestMethodLabel") }}:</span>
              {{ hasSelectedEndpointRequestTrace ? testRequestMethod : EMPTY_TEXT_LABEL }}
            </p>
            <p class="break-words">
              <span class="font-semibold">{{ t("apiDocs.tester.requestUrlLabel") }}:</span>
              {{ hasSelectedEndpointRequestTrace ? testRequestUrl : EMPTY_TEXT_LABEL }}
            </p>
          </div>
        </section>

        <section class="mt-4" :aria-label="t('apiDocs.tester.metadataTitle')">
          <h4 class="font-semibold">{{ t("apiDocs.tester.metadataTitle") }}</h4>
          <div class="overflow-x-auto mt-2">
            <table class="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>{{ t("apiDocs.tester.metadata.columns.label") }}</th>
                  <th>{{ t("apiDocs.tester.metadata.columns.value") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ t("apiDocs.tester.metadata.responseStatus") }}</td>
                  <td>{{ responseStatusText.status }} {{ responseStatusText.text }}</td>
                </tr>
                <tr>
                  <td>{{ t("apiDocs.tester.metadata.duration") }}</td>
                  <td>{{ testDurationMs !== null ? `${testDurationMs} ms` : EMPTY_TEXT_LABEL }}</td>
                </tr>
                <tr>
                  <td>{{ t("apiDocs.tester.metadata.responseHeaders") }}</td>
                  <td>{{ hasResponseHeaders ? responseHeaderEntries.length : 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="mt-4" :aria-label="t('apiDocs.tester.responseTitle')">
          <h4 class="font-semibold">{{ t("apiDocs.tester.responseTitle") }}</h4>
          <div v-if="showTesterResponsePanel" class="mt-2 space-y-2">
            <div
              v-if="testerState === 'empty'"
              class="alert alert-info"
              role="status"
            >
              {{ t("apiDocs.tester.emptyResponse") }}
            </div>
            <div
              v-if="testerState === 'errorRetryable' || testerState === 'errorNonRetryable' || testerState === 'unauthorized'"
              class="alert alert-error"
              role="alert"
            >
              {{ testErrorMessage || t("apiDocs.tester.errorFallback") }}
            </div>
            <div class="rounded-box bg-base-300 p-3 text-xs">
              <p class="font-semibold">{{ t("apiDocs.tester.responseHeadersLabel") }}</p>
              <p v-if="!hasResponseHeaders" class="mt-1 text-base-content/60">{{ t("apiDocs.tester.noResponseHeaders") }}</p>
              <ul v-else class="mt-1 space-y-1">
                <li v-for="[name, value] in responseHeaderEntries" :key="name" class="break-words">
                  {{ name }}: {{ value }}
                </li>
              </ul>
            </div>
            <pre class="max-h-72 overflow-auto rounded-box bg-base-300 p-3 text-xs whitespace-pre-wrap">{{ requestBodyDisplay }}</pre>
          </div>
        </section>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button :aria-label="t('apiDocs.tester.closeAria')"></button>
      </form>
    </dialog>
  </div>
</template>
