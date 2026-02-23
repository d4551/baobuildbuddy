<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useTemplateRef } from "vue";
import {
  API_ENDPOINTS,
  safeParseJson,
  type JsonObject,
  type JsonValue,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { getErrorMessage } from "~/utils/errors";
import { resolveApiEndpoint } from "~/utils/endpoints";
import { useAuth } from "~/composables/useAuth";

const { t } = useI18n();

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
type ApiDocsUiState = "idle" | "loading" | "success" | "empty" | "errorRetryable" | "errorNonRetryable" | "unauthorized";
type ApiTesterState = "idle" | "loading" | "success" | "errorRetryable" | "errorNonRetryable" | "unauthorized";

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

type OpenApiPaths = Record<string, Record<string, unknown>>;

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

type ApiDocsTextKey = `apiDocs.${string}`;

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
const UNKNOWN_TAG_LABEL_KEY: ApiDocsTextKey = "apiDocs.groups.untagged";
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

const HASH_PREFIX = "#";
const EMPTY_TEXT_LABEL = "—";

const route = useRoute();
const config = useRuntimeConfig();
const requestUrl = useRequestURL();
const auth = useAuth();

const apiBase = String(config.public.apiBase || "/");
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
  const seen = new Map<string, string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.set(key, normalized);
    output.push(normalized);
  }
  return output;
};

const normalizeSectionHash = (hashValue: string): string => hashValue.replace(new RegExp(`^\\${HASH_PREFIX}`), "").trim();

const readOpenApiSpec = (value: unknown): OpenApiSpec | null => {
  if (!isRecord(value)) return null;

  const openapi = typeof value.openapi === "string" ? value.openapi : undefined;
  const infoRaw = isRecord(value.info) ? value.info : undefined;
  const info: OpenApiInfo = {
    title: typeof infoRaw?.title === "string" ? infoRaw.title : undefined,
    description: typeof infoRaw?.description === "string" ? infoRaw.description : undefined,
    version: typeof infoRaw?.version === "string" ? infoRaw.version : undefined,
  };

  const paths = isRecord(value.paths) ? (value.paths as OpenApiPaths) : {};

  return {
    openapi,
    info,
    paths,
  };
};

const getOperation = (
  value: unknown,
  pathParameters: readonly OpenApiParameter[],
): OpenApiOperation | null => {
  if (!isRecord(value)) return null;

  const parameters = Array.isArray(value.parameters) ? value.parameters : [];
  const operationParameters = parameters.filter((parameter): parameter is OpenApiParameter => {
    if (!isRecord(parameter)) return false;
    if (typeof parameter.name !== "string") return false;
    if (!isOpenApiParameterIn(parameter.in)) return false;
    return true;
  });
  const safeParameters = dedupeParameters([...pathParameters, ...operationParameters]);

  const requestBody = isRecord(value.requestBody) ? (value.requestBody as OpenApiRequestBody) : undefined;
  const responses = isRecord(value.responses) ? (value.responses as Record<string, OpenApiResponse>) : undefined;
  const tags = Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string") : undefined;

  return {
    operationId: typeof value.operationId === "string" ? value.operationId : undefined,
    summary: typeof value.summary === "string" ? value.summary : undefined,
    description: typeof value.description === "string" ? value.description : undefined,
    tags,
    deprecated: typeof value.deprecated === "boolean" ? value.deprecated : undefined,
    parameters: safeParameters,
    requestBody,
    responses,
  };
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

const dedupeParameters = (parameters: readonly OpenApiParameter[]): OpenApiParameter[] => {
  const unique = new Map<string, OpenApiParameter>();
  for (const parameter of parameters) {
    const parameterName = parameter.name.trim();
    if (!parameterName) continue;

    const key = `${parameter.in}:${parameterName.toLowerCase()}`;
    if (!unique.has(key)) {
      unique.set(key, {
        ...parameter,
        name: parameterName,
      });
    }
  }
  return Array.from(unique.values());
};

const getParameterValueDefault = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

const collectParameters = (parameters: readonly OpenApiParameter[], inValue: OpenApiParameter["in"]): OpenApiParameter[] =>
  dedupeParameters(parameters.filter((param) => param.in === inValue));

const getPathParameters = (pathItem: Record<string, unknown>): OpenApiParameter[] => {
  const rawParameters = Array.isArray((pathItem as { parameters?: unknown }).parameters)
    ? ((pathItem as { parameters?: unknown }).parameters as unknown[])
    : [];
  const normalizedParameters = rawParameters
    .filter((parameter): parameter is OpenApiParameter => {
      if (!isRecord(parameter)) return false;
      if (typeof parameter.name !== "string") return false;
      if (!isOpenApiParameterIn(parameter.in)) return false;
      return true;
    })
    .map((parameter) => ({
      ...parameter,
      name: parameter.name.trim(),
    }))
    .filter((parameter) => parameter.name.trim().length > 0);
  return dedupeParameters(normalizedParameters);
};

const requestBodyTemplate = (requestBody: OpenApiRequestBody | undefined): string => {
  const content = isRecord(requestBody?.content) ? requestBody.content : undefined;
  if (!content) return "";

  const jsonBody = content["application/json"];
  if (!isRecord(jsonBody)) return "";

  const candidate =
    (jsonBody as OpenApiMediaType).example ??
    Object.values((jsonBody as OpenApiMediaType).examples ?? {})[0]?.value;

  if (candidate === undefined) return "";
  if (typeof candidate === "string") return candidate;
  return JSON.stringify(candidate, null, 2);
};

const {
  data: rawApiSpecData,
  status: apiSpecStatus,
  error: apiSpecError,
  refresh: refreshApiSpec,
} = await useAsyncData(
  API_DOCS_ASYNC_DATA_KEY,
  async () => {
    return $fetch<unknown>(resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.apiDocsJson));
  },
  { server: true, lazy: false },
);

const openApiSpec = computed<OpenApiSpec | null>(() => readOpenApiSpec(rawApiSpecData.value));

const endpointGroups = computed<ApiEndpointGroup[]>(() => {
  const paths = openApiSpec.value?.paths ?? {};
  const grouped = new Map<string, ApiEndpoint[]>();

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) continue;
    const pathParameters = getPathParameters(pathItem);

    for (const [rawMethod, rawOperation] of Object.entries(pathItem)) {
      if (!isApiHttpMethod(rawMethod)) continue;

      const operation = getOperation(rawOperation, pathParameters);
      if (!operation) continue;

      const pathParameters = dedupeCaseInsensitiveStrings([
        ...collectPathParameters(path),
        ...collectParameters(operation.parameters ?? [], "path").map((param) => param.name),
      ]);

      const queryParameters = collectParameters(operation.parameters ?? [], "query");
      const requestBody = operation.requestBody;
      const label = operation.tags?.[0] ?? t(UNKNOWN_TAG_LABEL_KEY);
      const groupEndpoints = grouped.get(label) ?? [];
      groupEndpoints.push({
        id: `${rawMethod}-${normalizePathForId(path)}`,
        path,
        method: rawMethod,
        operation,
        groupLabel: label,
        pathParameters,
        queryParameters,
        requestBodyTemplate: requestBodyTemplate(requestBody),
        requestBodyRequired: Boolean(requestBody?.required),
      });
      grouped.set(label, groupEndpoints);
    }
  }

  const sortedGroups = Array.from(grouped.entries()).sort(([first], [second]) =>
    first.localeCompare(second, "en"),
  );
  const methodOrder = new Map<ApiHttpMethod, number>(HTTP_METHODS_ORDER.map((method, index) => [method, index]));

  return sortedGroups.map(([label, endpoints]) => {
    const sortedEndpoints = endpoints.sort((left, right) => {
      const pathCompare = left.path.localeCompare(right.path, "en");
      if (pathCompare !== 0) return pathCompare;
      return methodOrder.get(left.method)! - methodOrder.get(right.method)!;
    });

    return {
      id: `group-${normalizePathForId(label)}`,
      label,
      endpoints: sortedEndpoints,
    };
  });
});

const apiDocsUiState = computed<ApiDocsUiState>(() => {
  if (apiSpecStatus.value === "pending") return "loading";
  if (apiSpecStatus.value === "idle") return "idle";
  if (apiSpecError.value) {
    const statusValue = (() => {
      const nextError = apiSpecError.value as { status?: number; statusCode?: number };
      const status = nextError.status ?? nextError.statusCode;
      return typeof status === "number" ? status : null;
    })();

    if (statusValue === 401) return "unauthorized";
    if (statusValue === null || statusValue >= 500) return "errorRetryable";
    return "errorNonRetryable";
  }
  if (endpointGroups.value.length === 0) return "empty";
  return "success";
});

const isRetryableStatus = (statusCode: number): boolean =>
  statusCode === 408 || statusCode === 429 || statusCode >= 500;

const apiDocsTitle = computed<string>(() => {
  const infoTitle = openApiSpec.value?.info?.title;
  return infoTitle?.trim().length ? infoTitle : t("apiDocs.title");
});

const activeSectionId = ref<string>("");
const sectionNodes = new Map<string, HTMLElement>();
const endpointTesterDialogRef = useTemplateRef<HTMLDialogElement>("apiEndpointTesterDialog");
const selectedEndpoint = ref<ApiEndpoint | null>(null);
const sectionObserver = ref<IntersectionObserver | null>(null);
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

const canRunEndpoint = computed<boolean>(() => {
  const endpoint = selectedEndpoint.value;
  if (!endpoint) return false;
  if (endpoint.pathParameters.some((name) => pathParameterValues.value[name]?.trim().length === 0)) {
    return false;
  }

  if (!endpoint.requestBodyRequired) {
    if (endpoint.requestBodyTemplate.length > 0 && requestBodyText.value.trim().length > 0) {
      const parsedBody = safeParseJson(requestBodyText.value);
      return parsedBody !== null;
    }
    return true;
  }

  if (requestBodyText.value.trim().length === 0) return false;
  return safeParseJson(requestBodyText.value) !== null;
});

const endpointMethodClass = (method: ApiHttpMethod): string => HTTP_METHOD_CLASSES[method];

const selectedOperationDescription = computed<string>(() => {
  const endpoint = selectedEndpoint.value;
  if (!endpoint) return "";
  return endpoint.operation.description?.trim() || endpoint.operation.summary?.trim() || t("apiDocs.endpoint.noDescription");
});

const selectedPathParameters = computed<string[]>(() => selectedEndpoint.value?.pathParameters ?? []);
const selectedQueryParameters = computed<readonly OpenApiParameter[]>(
  () => selectedEndpoint.value?.queryParameters ?? [],
);
const selectedRequestBodyTemplate = computed<string>(() => selectedEndpoint.value?.requestBodyTemplate ?? "");
const responseHeaderEntries = computed<readonly [string, string][]>(
  () => Object.entries(testResponseHeaders.value),
);
const hasResponseHeaders = computed<boolean>(() => responseHeaderEntries.value.length > 0);
const hasSelectedEndpointRequestTrace = computed<boolean>(
  () => testRequestMethod.value !== null && testRequestUrl.value.length > 0,
);

const endpointHasBody = computed<boolean>(
  () => selectedEndpoint.value?.requestBodyTemplate?.length > 0 || (selectedEndpoint.value?.requestBodyRequired ?? false),
);

const focusEndpointTesterFirstInput = () => {
  const dialog = endpointTesterDialogRef.value;
  if (!dialog) {
    return;
  }

  const firstFocusable = dialog.querySelector<HTMLElement>(
    "input:not([disabled]), textarea:not([disabled]), button:not([disabled])",
  );
  if (firstFocusable) {
    firstFocusable.focus();
  }
};

const setSectionRef = (sectionId: string, element: Element | null) => {
  if (!element) {
    sectionNodes.delete(sectionId);
    return;
  }
  sectionNodes.set(sectionId, element as HTMLElement);
};

const resolveTesterPath = (endpoint: ApiEndpoint): string => {
  let path = endpoint.path;
  for (const parameter of endpoint.pathParameters) {
    const value = pathParameterValues.value[parameter]?.trim();
    if (!value) return "";
    path = path.replaceAll(`{${parameter}}`, encodeURIComponent(value));
  }
  return path;
};

const buildTesterUrl = (endpoint: ApiEndpoint, basePath: string): string => {
  const query = new URLSearchParams();
  for (const parameter of endpoint.queryParameters) {
    const value = queryParameterValues.value[parameter.name]?.trim();
    if (!value) continue;
    query.set(parameter.name, value);
  }

  const queryString = query.toString();
  return queryString.length > 0 ? `${basePath}${basePath.includes("?") ? "&" : "?"}${queryString}` : basePath;
};

const requestBodyDisplay = computed<string>(() => {
  if (testResponseBody.value.length === 0) return "";
  const parsedResponse = safeParseJson(testResponseBody.value);
  return parsedResponse === null ? testResponseBody.value : JSON.stringify(parsedResponse, null, 2);
});

const responseStatusText = computed<{ status: number | string; text: string }>(() => ({
  status: testStatusCode.value ?? EMPTY_TEXT_LABEL,
  text: testStatusText.value || EMPTY_TEXT_LABEL,
}));

const resetEndpointTesterState = () => {
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

const hydrateEndpointInputs = (endpoint: ApiEndpoint) => {
  const pathDefaults: Record<string, string> = {};
  for (const parameterName of endpoint.pathParameters) {
    pathDefaults[parameterName] = "";
  }

  const queryDefaults: Record<string, string> = {};
  for (const parameter of endpoint.queryParameters) {
    queryDefaults[parameter.name] = getParameterValueDefault(parameter.example);
  }

  pathParameterValues.value = pathDefaults;
  queryParameterValues.value = queryDefaults;
  requestBodyText.value = endpoint.requestBodyTemplate;
};

const openEndpointTester = (endpoint: ApiEndpoint) => {
  selectedEndpoint.value = endpoint;
  hydrateEndpointInputs(endpoint);
  resetEndpointTesterState();
  nextTick(() => {
    const dialog = endpointTesterDialogRef.value;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    focusEndpointTesterFirstInput();
  });
};

const handleEndpointTesterClose = () => {
  selectedEndpoint.value = null;
  resetEndpointTesterState();
};

const formatMethodLabel = (method: ApiHttpMethod): string => method.toUpperCase();

const sectionObserverCallback: IntersectionObserverCallback = (entries) => {
  const nextEntry = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => {
      const comparison = b.intersectionRatio - a.intersectionRatio;
      if (comparison !== 0) return comparison;
      return a.boundingClientRect.top - b.boundingClientRect.top;
    })[0];

  if (!nextEntry?.target.id) return;
  activeSectionId.value = nextEntry.target.id;
  if (typeof window !== "undefined") {
    window.history.replaceState({}, "", `#${nextEntry.target.id}`);
  }
};

const refreshSectionObserver = () => {
  const observer = sectionObserver.value;
  if (!observer) return;

  observer.disconnect();
  for (const sectionNode of sectionNodes.values()) {
    observer.observe(sectionNode);
  }
};

const setupSectionObserver = () => {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return;
  }

  if (!sectionObserver.value) {
    sectionObserver.value = new IntersectionObserver(sectionObserverCallback, {
      root: null,
      threshold: [0.1, 0.3, 0.5, 0.8],
      rootMargin: "-20% 0px -60% 0px",
    });
  }

  refreshSectionObserver();
};

type ScrollOptions = {
  focus?: boolean;
  smooth?: boolean;
  updateHash?: boolean;
};

const scrollToEndpoint = (sectionId: string, options: ScrollOptions = {}) => {
  const { focus = true, smooth = true, updateHash = true } = options;
  const section = sectionNodes.get(sectionId);
  if (!section) return;

  activeSectionId.value = sectionId;
  section.scrollIntoView({
    behavior: smooth ? "smooth" : "auto",
    block: "start",
  });
  if (updateHash && typeof window !== "undefined") {
    window.history.replaceState({}, "", `#${sectionId}`);
  }
  if (focus) {
    section.focus({ preventScroll: true });
  }
};

const setActiveSectionByHash = (hashValue: string): boolean => {
  const candidate = normalizeSectionHash(hashValue);
  if (!candidate || activeSectionId.value === candidate || !sectionNodes.has(candidate)) {
    return false;
  }

  scrollToEndpoint(candidate, { smooth: false, updateHash: false, focus: false });
  return true;
};

const executeEndpointRequest = async (): Promise<void> => {
  const endpoint = selectedEndpoint.value;
  if (!endpoint || testerState.value === "loading" || !canRunEndpoint.value) return;

  const resolvedPath = resolveTesterPath(endpoint);
  if (!resolvedPath) {
    testerState.value = "errorNonRetryable";
    testErrorMessage.value = t("apiDocs.tester.invalidPath");
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
  const authorization = auth.getStoredApiKey();
  if (authorization) headers.Authorization = `Bearer ${authorization}`;

  const requestBody = endpointHasBody.value ? requestBodyText.value.trim() : "";
  if (requestBody.length > 0) headers["Content-Type"] = "application/json";

  const startedAt = Date.now();
  const body = requestBody.length > 0 ? requestBody : undefined;
  const fetchResult = await fetch(endpointUrl, {
    method: formatMethodLabel(endpoint.method),
    headers,
    body,
  })
    .then(async (response) => {
      const responseText = await response.text();
      const durationMs = Date.now() - startedAt;
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      return {
        ok: true as const,
        statusCode: response.status,
        statusText: response.statusText,
        headers,
        body: responseText,
        durationMs,
      };
    })
    .catch((error: unknown) => ({
      ok: false as const,
      errorMessage: getErrorMessage(error, t("apiDocs.tester.requestFailure")),
    }));

  if (!fetchResult.ok) {
    testerState.value = "errorRetryable";
    testErrorMessage.value = fetchResult.errorMessage;
    testDurationMs.value = Date.now() - startedAt;
    return;
  }

  testStatusCode.value = fetchResult.statusCode;
  testStatusText.value = fetchResult.statusText;
  testResponseHeaders.value = fetchResult.headers;
  testResponseBody.value = fetchResult.body;
  testDurationMs.value = fetchResult.durationMs;

  if (fetchResult.statusCode === 401) {
    testerState.value = "unauthorized";
    return;
  }

  if (fetchResult.statusCode >= 400) {
    testerState.value = isRetryableStatus(fetchResult.statusCode)
      ? "errorRetryable"
      : "errorNonRetryable";
    return;
  }

  testerState.value = "success";
};

watch(
  endpointGroups,
  () => {
    nextTick(() => {
      setupSectionObserver();
      const firstEndpoint = endpointGroups.value.flatMap((group) => group.endpoints)[0];
      const didRestoreFromHash = setActiveSectionByHash(route.hash);
      if (!didRestoreFromHash && !activeSectionId.value && firstEndpoint) {
        activeSectionId.value = firstEndpoint.id;
      }
    });
  },
  { immediate: true, deep: true },
);

watch(
  () => route.hash,
  (hash) => {
    setActiveSectionByHash(hash);
  },
);

onMounted(() => {
  if (route.hash) {
    const didNavigate = setActiveSectionByHash(route.hash);
    if (!didNavigate && endpointGroups.value.flatMap((group) => group.endpoints)[0]) {
      activeSectionId.value = endpointGroups.value.flatMap((group) => group.endpoints)[0].id;
    }
  }

  setupSectionObserver();
});

onBeforeUnmount(() => {
  sectionObserver.value?.disconnect();
  sectionObserver.value = null;
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
                    :class="{ 'active': activeSectionId === endpoint.id }"
                    @click="scrollToEndpoint(endpoint.id)"
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
            :ref="(element) => setSectionRef(endpoint.id, element as Element)"
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
      <div class="modal-box max-w-5xl">
        <h3 class="text-lg font-bold">{{ t('apiDocs.tester.title') }}</h3>
        <p v-if="selectedEndpoint" class="mt-1 text-sm text-base-content/75">
          {{ selectedOperationDescription }}
        </p>
        <p v-if="selectedPathParameters.length > 0" class="mt-3 text-sm text-base-content/80">
          {{ t('apiDocs.tester.pathParametersIntro') }}
        </p>
          <div v-if="selectedEndpoint && selectedPathParameters.length > 0" class="mt-3 grid gap-3 sm:grid-cols-2">
            <label
              v-for="pathParameter in selectedPathParameters"
              :key="`${selectedEndpoint.id}-${pathParameter}`"
              class="form-control"
            >
              <span class="label text-xs">{{ t('apiDocs.tester.parameterLabel', { name: pathParameter }) }}</span>
              <input
                :aria-label="t('apiDocs.tester.parameterLabel', { name: pathParameter })"
                class="input input-bordered input-sm"
                type="text"
                v-model="pathParameterValues[pathParameter]"
              />
            </label>
          </div>

        <div v-if="selectedEndpoint?.queryParameters && selectedEndpoint.queryParameters.length > 0" class="mt-4">
          <p class="text-sm text-base-content/80">{{ t('apiDocs.tester.queryParametersIntro') }}</p>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <label v-for="parameter in selectedQueryParameters" :key="`${selectedEndpoint?.id}-${parameter.name}`" class="form-control">
              <span class="label-text text-xs">{{ t('apiDocs.tester.parameterLabel', { name: parameter.name }) }}</span>
              <input
                class="input input-bordered input-sm"
                :aria-label="t('apiDocs.tester.parameterLabel', { name: parameter.name })"
                type="text"
                v-model="queryParameterValues[parameter.name]"
              />
            </label>
          </div>
        </div>

        <div v-if="selectedEndpoint && endpointHasBody" class="mt-4">
          <p class="text-sm text-base-content/80">{{ t('apiDocs.tester.requestBodyIntro') }}</p>
          <textarea
            v-model="requestBodyText"
            class="textarea textarea-bordered w-full min-h-28 font-mono text-sm mt-2"
            :aria-label="t('apiDocs.tester.requestBodyAria')"
            spellcheck="false"
            :placeholder="t('apiDocs.tester.bodyPlaceholder')"
          />
          <p v-if="selectedRequestBodyTemplate.length === 0" class="mt-1 text-xs text-base-content/50">
            {{ t('apiDocs.tester.noRequestBodyTemplate') }}
          </p>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn"
            :disabled="!canRunEndpoint || testerState === 'loading'"
            @click="executeEndpointRequest"
          >
            <span v-if="testerState === 'loading'" class="loading loading-spinner loading-xs"></span>
            {{ testerState === 'loading' ? t('apiDocs.tester.sending') : t('apiDocs.tester.send') }}
          </button>
          <button class="btn btn-ghost" type="button" @click="handleEndpointTesterClose">
            {{ t('apiDocs.tester.close') }}
          </button>
        </div>

        <section class="mt-4">
          <h4 class="font-semibold">{{ t('apiDocs.tester.requestTraceTitle') }}</h4>
          <div class="mt-2 rounded-box bg-base-300 p-3 text-xs">
            <p class="break-words">
              <span class="font-semibold">{{ t('apiDocs.tester.requestMethodLabel') }}:</span>
              {{ hasSelectedEndpointRequestTrace ? testRequestMethod : EMPTY_TEXT_LABEL }}
            </p>
            <p class="break-words">
              <span class="font-semibold">{{ t('apiDocs.tester.requestUrlLabel') }}:</span>
              {{ hasSelectedEndpointRequestTrace ? testRequestUrl : EMPTY_TEXT_LABEL }}
            </p>
          </div>
        </section>

        <section class="mt-4">
          <h4 class="font-semibold">{{ t('apiDocs.tester.responseTitle') }}</h4>
          <div
            v-if="testerState === 'success' || testerState === 'errorRetryable' || testerState === 'errorNonRetryable' || testerState === 'unauthorized'"
            class="mt-2 space-y-2"
          >
            <div class="rounded-box bg-base-300 p-3 text-sm">
              <p>{{ t('apiDocs.tester.responseStatusLabel', responseStatusText) }}</p>
              <p v-if="testDurationMs !== null">{{ t('apiDocs.tester.durationLabel', { duration: testDurationMs }) }}</p>
            </div>
            <div class="rounded-box bg-base-300 p-3 text-xs">
              <p class="font-semibold">{{ t('apiDocs.tester.responseHeadersLabel') }}</p>
              <p v-if="!hasResponseHeaders" class="mt-1 text-base-content/60">{{ t('apiDocs.tester.noResponseHeaders') }}</p>
              <ul v-else class="mt-1 space-y-1">
                <li v-for="[name, value] in responseHeaderEntries" :key="name" class="break-words">
                  {{ name }}: {{ value }}
                </li>
              </ul>
            </div>
            <pre class="max-h-72 overflow-auto rounded-box bg-base-300 p-3 text-xs whitespace-pre-wrap">{{ requestBodyDisplay }}</pre>
          </div>
          <div v-if="testerState === 'errorRetryable' || testerState === 'errorNonRetryable' || testerState === 'unauthorized'" class="alert alert-error mt-3">
            {{ testErrorMessage || t('apiDocs.tester.errorFallback') }}
          </div>
        </section>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button :aria-label="t('apiDocs.tester.closeAria')"></button>
      </form>
    </dialog>
  </div>
</template>
