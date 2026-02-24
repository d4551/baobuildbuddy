<script setup lang="ts">
import { API_ENDPOINTS, type JsonObject, type JsonValue, safeParseJson } from "@bao/shared";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useScrollSpy } from "~/composables/useScrollSpy";
import { useToast } from "~/composables/useToast";
import { resolveApiEndpoint } from "~/utils/endpoints";

const { t } = useI18n();
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
  readonly statusCode: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly body: string;
  readonly durationMs: number;
  readonly url: string;
  readonly method: string;
}

const API_DOCS_ASYNC_DATA_KEY = "api-docs-json";
const UNKNOWN_TAG_LABEL_KEY = "apiDocs.groups.untagged" as const;
const API_TESTER_DIALOG_TITLE_ID = "api-endpoint-tester-title";
const API_TESTER_DIALOG_DESCRIPTION_ID = "api-endpoint-tester-description";
const HTTP_METHODS_ORDER = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
] as const;
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

const route = useRoute();
const config = useRuntimeConfig();
const requestUrl = useRequestURL();
const apiBase = String(config.public.apiBase || "/");

const testerInvoker = ref<HTMLElement | null>(null);
const testerDialogOpen = ref(false);

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

const toErrorStatusCode = (error: unknown): number | null => {
  if (!isRecord(error)) {
    return null;
  }
  const status = error.status;
  if (typeof status === "number") {
    return status;
  }
  const statusCode = error.statusCode;
  if (typeof statusCode === "number") {
    return statusCode;
  }
  return null;
};

const toUiStateFromStatusCode = (statusCode: number | null): ApiDocsUiState => {
  if (statusCode === 401) {
    return "unauthorized";
  }
  if (statusCode === null || statusCode >= 500 || statusCode === 429) {
    return "errorRetryable";
  }
  return "errorNonRetryable";
};

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
    requestBody: isRecord(value.requestBody)
      ? (value.requestBody as OpenApiRequestBody)
      : undefined,
    responses: isRecord(value.responses)
      ? (value.responses as Record<string, OpenApiResponse>)
      : undefined,
  };
};

const collectParameters = (
  parameters: readonly OpenApiParameter[],
  inValue: OpenApiParameter["in"],
): OpenApiParameter[] =>
  dedupeParameters(parameters.filter((parameter) => parameter.in === inValue));

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
  const content = requestBody?.content;
  if (!content) {
    return "";
  }
  const jsonBody = content["application/json"];
  if (!(jsonBody && typeof jsonBody === "object")) {
    return "";
  }
  const firstExample =
    jsonBody.examples && typeof jsonBody.examples === "object"
      ? Object.values(jsonBody.examples)[0]
      : undefined;
  const candidate = jsonBody.example ?? firstExample?.value;
  if (candidate === undefined) {
    return "";
  }
  return JSON.stringify(candidate, null, 2);
};

const fetchOpenApiSpec = (): Promise<unknown> =>
  $fetch<unknown>(resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.apiDocsJson)).then(
    (value) => value,
    () => $fetch<unknown>(resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.apiDocsJsonLegacy)),
  );

const {
  data: rawSpec,
  status: rawSpecStatus,
  error: rawSpecError,
  refresh: refreshSpec,
} = await useAsyncData<unknown>(API_DOCS_ASYNC_DATA_KEY, fetchOpenApiSpec, {
  server: true,
  default: () => null,
});

const parsedSpec = computed(() => readOpenApiSpec(rawSpec.value));
const endpointGroups = computed<ApiEndpointGroup[]>(() => {
  const spec = parsedSpec.value;
  if (!spec?.paths) {
    return [];
  }

  const grouped = new Map<string, ApiEndpoint[]>();
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!isRecord(pathItem)) {
      continue;
    }

    const pathParameters = getPathParameters(pathItem);
    for (const method of HTTP_METHODS_ORDER) {
      const operation = getOperation(pathItem[method], pathParameters);
      if (!operation || !isApiHttpMethod(method)) {
        continue;
      }

      const endpointTags = dedupeCaseInsensitiveStrings(operation.tags ?? []);
      const groupLabel = endpointTags[0] ?? t(UNKNOWN_TAG_LABEL_KEY);
      const pathParameterNames = dedupeCaseInsensitiveStrings(collectPathParameters(path));
      const queryParameters = collectParameters(operation.parameters ?? [], "query");
      const endpoint: ApiEndpoint = {
        id: `${groupLabel.toLowerCase().replace(/\s+/gu, "-")}-${method}-${normalizePathForId(path)}`,
        path,
        method,
        operation,
        groupLabel,
        pathParameters: pathParameterNames,
        queryParameters,
        requestBodyTemplate: requestBodyTemplate(operation.requestBody),
        requestBodyRequired: Boolean(operation.requestBody?.required),
      };

      const groupEndpoints = grouped.get(groupLabel);
      if (groupEndpoints) {
        groupEndpoints.push(endpoint);
      } else {
        grouped.set(groupLabel, [endpoint]);
      }
    }
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, endpoints]) => ({
      id: normalizePathForId(label),
      label,
      endpoints: endpoints.sort((left, right) => {
        const methodOrder =
          HTTP_METHODS_ORDER.indexOf(left.method) - HTTP_METHODS_ORDER.indexOf(right.method);
        if (methodOrder !== 0) {
          return methodOrder;
        }
        return left.path.localeCompare(right.path);
      }),
    }));
});

const endpointCount = computed(() =>
  endpointGroups.value.reduce((count, group) => count + group.endpoints.length, 0),
);

const docsUiState = computed<ApiDocsUiState>(() => {
  if (rawSpecStatus.value === "pending") {
    return "loading";
  }
  if (rawSpecError.value) {
    return toUiStateFromStatusCode(toErrorStatusCode(rawSpecError.value));
  }
  if (endpointCount.value === 0) {
    return "empty";
  }
  return "success";
});

const selectedEndpoint = ref<ApiEndpoint | null>(null);
const testerState = ref<ApiTesterState>("idle");
const testerErrorMessage = ref("");
const testerResponse = ref<FetchEndpointResultOk | null>(null);
const pathParameterValues = ref<Record<string, string>>({});
const queryParameterValues = ref<Record<string, string>>({});
const requestBodyValue = ref("");

const testerStateLabel = computed(() => {
  if (testerState.value === "idle") {
    return t("apiDocs.tester.steps.configure");
  }
  if (testerState.value === "success") {
    return t("apiDocs.tester.requestSuccessToast");
  }
  if (testerState.value === "loading") {
    return t("apiDocs.state.loading");
  }
  if (testerState.value === "empty") {
    return t("apiDocs.state.empty");
  }
  return t(`apiDocs.state.${testerState.value}`);
});
const activeEndpointId = computed(() => {
  if (activeSectionId.value.length > 0) {
    return activeSectionId.value;
  }
  const firstGroup = endpointGroups.value[0];
  if (!firstGroup) {
    return "";
  }
  return firstGroup.endpoints[0]?.id ?? "";
});

const methodBadgeClass = (method: ApiHttpMethod): string =>
  `badge badge-sm ${HTTP_METHOD_CLASSES[method]} font-semibold`;

const methodLabel = (method: ApiHttpMethod): string => method.toUpperCase();

const scrollToEndpoint = (sectionId: string): void => {
  scrollToSection(sectionId, {
    smooth: true,
    focus: true,
    updateHash: true,
  });
};

const syncScrollSpyFromCurrentHash = (): void => {
  if (!syncFromHash(route.hash)) {
    const firstGroup = endpointGroups.value[0];
    const firstEndpointId = firstGroup?.endpoints[0]?.id;
    if (firstEndpointId) {
      scrollToSection(firstEndpointId, {
        smooth: false,
        focus: false,
        updateHash: false,
      });
    }
  }
};

const resolvePathWithParameters = (
  endpoint: ApiEndpoint,
  values: Record<string, string>,
): string | null => {
  let outputPath = endpoint.path;
  for (const name of endpoint.pathParameters) {
    const value = values[name]?.trim() ?? "";
    if (value.length === 0) {
      return null;
    }
    outputPath = outputPath.replace(`{${name}}`, encodeURIComponent(value));
  }
  return outputPath;
};

const buildQueryString = (
  queryParameters: readonly OpenApiParameter[],
  values: Record<string, string>,
): string => {
  const urlSearch = new URLSearchParams();
  for (const parameter of queryParameters) {
    const value = values[parameter.name]?.trim();
    if (!value) {
      continue;
    }
    urlSearch.append(parameter.name, value);
  }
  const serialized = urlSearch.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
};

const isRetryableStatusCode = (statusCode: number): boolean =>
  statusCode === 429 || statusCode >= 500;

const openEndpointTester = (endpoint: ApiEndpoint, invoker: EventTarget | null): void => {
  selectedEndpoint.value = endpoint;
  testerState.value = "idle";
  testerErrorMessage.value = "";
  testerResponse.value = null;
  testerInvoker.value = invoker instanceof HTMLElement ? invoker : null;

  const initialPathValues: Record<string, string> = {};
  for (const name of endpoint.pathParameters) {
    initialPathValues[name] = "";
  }
  pathParameterValues.value = initialPathValues;

  const initialQueryValues: Record<string, string> = {};
  for (const parameter of endpoint.queryParameters) {
    initialQueryValues[parameter.name] = getParameterValueDefault(parameter.example);
  }
  queryParameterValues.value = initialQueryValues;
  requestBodyValue.value = endpoint.requestBodyTemplate;
  testerDialogOpen.value = true;
};

const closeEndpointTester = (): void => {
  testerDialogOpen.value = false;
};

const handleEndpointTesterClosed = (): void => {
  testerDialogOpen.value = false;
  const invoker = testerInvoker.value;
  testerInvoker.value = null;
  if (!invoker) {
    return;
  }
  void nextTick(() => {
    invoker.focus();
  });
};

const executeEndpointRequest = async (): Promise<void> => {
  const endpoint = selectedEndpoint.value;
  if (!endpoint) {
    return;
  }

  const resolvedPath = resolvePathWithParameters(endpoint, pathParameterValues.value);
  if (!resolvedPath) {
    testerState.value = "errorNonRetryable";
    testerErrorMessage.value = t("apiDocs.tester.invalidPath");
    toast.error(t("apiDocs.tester.requestErrorToast"));
    return;
  }

  const queryString = buildQueryString(endpoint.queryParameters, queryParameterValues.value);
  const requestPath = `${resolvedPath}${queryString}`;
  const endpointUrl = resolveApiEndpoint(apiBase, requestUrl, requestPath);
  const payloadText = requestBodyValue.value.trim();
  const shouldSendBody = endpoint.requestBodyRequired || payloadText.length > 0;
  const parsedBody = shouldSendBody
    ? safeParseJson(payloadText.length > 0 ? payloadText : "{}")
    : null;

  if (shouldSendBody && parsedBody === null) {
    testerState.value = "errorNonRetryable";
    testerErrorMessage.value = t("apiDocs.tester.requestFailure");
    toast.error(t("apiDocs.tester.requestErrorToast"));
    return;
  }

  testerState.value = "loading";
  testerErrorMessage.value = "";
  testerResponse.value = null;

  const startedAt = Date.now();
  const responseResult = await fetch(endpointUrl, {
    method: methodLabel(endpoint.method),
    headers: {
      Accept: "application/json",
      ...(shouldSendBody ? { "Content-Type": "application/json" } : {}),
    },
    ...(shouldSendBody ? { body: JSON.stringify(parsedBody) } : {}),
    credentials: "include",
  }).then(
    async (response) => {
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      const body = await response.text();
      return {
        ok: true as const,
        payload: {
          statusCode: response.status,
          statusText: response.statusText,
          headers,
          body,
          durationMs: Date.now() - startedAt,
          url: endpointUrl,
          method: methodLabel(endpoint.method),
        } satisfies FetchEndpointResultOk,
      };
    },
    (error: unknown) => ({
      ok: false as const,
      errorMessage: error instanceof Error ? error.message : t("apiDocs.tester.requestFailure"),
    }),
  );

  if (!responseResult.ok) {
    testerState.value = "errorRetryable";
    testerErrorMessage.value = responseResult.errorMessage;
    toast.error(t("apiDocs.tester.requestErrorToast"));
    return;
  }

  testerResponse.value = responseResult.payload;
  const isSuccessStatusCode =
    responseResult.payload.statusCode >= 200 && responseResult.payload.statusCode < 300;
  if (!isSuccessStatusCode) {
    testerState.value = toUiStateFromStatusCode(responseResult.payload.statusCode);
    if (testerState.value === "loading" || testerState.value === "success") {
      testerState.value = isRetryableStatusCode(responseResult.payload.statusCode)
        ? "errorRetryable"
        : "errorNonRetryable";
    }
    testerErrorMessage.value = responseResult.payload.body || t("apiDocs.tester.errorFallback");
    toast.error(t("apiDocs.tester.requestErrorToast"));
    return;
  }

  if (responseResult.payload.body.trim().length === 0) {
    testerState.value = "empty";
    toast.info(t("apiDocs.tester.emptyResponseToast"));
    return;
  }

  testerState.value = "success";
  toast.success(t("apiDocs.tester.requestSuccessToast"));
};

const formattedResponseBody = computed(() => {
  const body = testerResponse.value?.body ?? "";
  if (!body.trim()) {
    return "";
  }
  const parsedBody = safeParseJson(body);
  if (parsedBody === null) {
    return body;
  }
  return JSON.stringify(parsedBody, null, 2);
});

watch(
  [docsUiState, endpointGroups],
  async ([stateValue]) => {
    if (stateValue !== "success") {
      stopObserver();
      return;
    }

    await nextTick();
    startObserver();
    refreshObserver();
    syncScrollSpyFromCurrentHash();
  },
  { immediate: true },
);

watch(
  () => route.hash,
  (nextHash) => {
    if (docsUiState.value !== "success") {
      return;
    }
    syncFromHash(nextHash);
  },
);

onBeforeUnmount(() => {
  stopObserver();
});
</script>

<template>
  <div class="mx-auto max-w-[120rem] space-y-6">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold">{{ t("apiDocs.title") }}</h1>
      <p class="text-base-content/70">{{ t("apiDocs.intro") }}</p>
    </header>

    <div
      v-if="docsUiState === 'loading'"
      class="flex items-center gap-3"
      role="status"
      aria-live="polite"
      :aria-label="t('apiDocs.state.loading')"
    >
      <span class="loading loading-spinner loading-md"></span>
      <span>{{ t("apiDocs.state.loading") }}</span>
    </div>

    <div v-else-if="docsUiState === 'empty'" class="alert alert-info" role="status">
      <span>{{ t("apiDocs.state.empty") }}</span>
    </div>

    <div
      v-else-if="docsUiState === 'unauthorized' || docsUiState === 'errorRetryable' || docsUiState === 'errorNonRetryable'"
      class="alert alert-error items-center justify-between"
      role="alert"
      aria-live="assertive"
    >
      <span>{{ t(`apiDocs.state.${docsUiState}`) }}</span>
      <button
        v-if="docsUiState === 'errorRetryable'"
        type="button"
        class="btn btn-sm btn-outline"
        :aria-label="t('apiDocs.actions.retry')"
        @click="refreshSpec"
      >
        {{ t("apiDocs.actions.retry") }}
      </button>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <aside class="card bg-base-100 top-24 h-fit shadow-sm lg:sticky">
        <div class="card-body gap-4">
          <h2 class="card-title text-base">{{ t("apiDocs.endpointNavigator") }}</h2>
          <nav :aria-label="t('apiDocs.a11y.endpointNavigation')">
            <ul class="space-y-4">
              <li v-for="group in endpointGroups" :key="group.id" class="space-y-2">
                <p class="text-sm font-semibold uppercase tracking-wide text-base-content/60">
                  {{ group.label }}
                </p>
                <ul class="space-y-2">
                  <li v-for="endpoint in group.endpoints" :key="endpoint.id">
                    <button
                      type="button"
                      class="btn btn-sm h-auto w-full justify-start whitespace-normal py-2 text-left"
                      :class="{
                        'btn-primary': activeEndpointId === endpoint.id,
                        'btn-ghost': activeEndpointId !== endpoint.id,
                      }"
                      :aria-label="
                        t('apiDocs.endpoint.navigateAria', {
                          method: methodLabel(endpoint.method),
                          path: endpoint.path,
                        })
                      "
                      :aria-current="activeEndpointId === endpoint.id ? 'location' : undefined"
                      @click="scrollToEndpoint(endpoint.id)"
                    >
                      <span :class="methodBadgeClass(endpoint.method)" class="mr-2">
                        {{ methodLabel(endpoint.method) }}
                      </span>
                      <span class="font-mono text-xs">{{ endpoint.path }}</span>
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <main class="space-y-6">
        <section
          v-for="group in endpointGroups"
          :key="group.id"
          class="card bg-base-100 border border-base-200 shadow-sm"
        >
          <div class="card-body space-y-5">
            <h2 class="card-title">{{ group.label }}</h2>

            <article
              v-for="endpoint in group.endpoints"
              :id="endpoint.id"
              :key="endpoint.id"
              :ref="(element) => setSectionRef(endpoint.id, element)"
              tabindex="-1"
              class="scroll-mt-24 space-y-4 rounded-lg border border-base-200 bg-base-100 p-4"
            >
              <header class="flex flex-wrap items-start justify-between gap-3">
                <div class="space-y-2">
                  <p class="flex items-center gap-2">
                    <span :class="methodBadgeClass(endpoint.method)">
                      {{ methodLabel(endpoint.method) }}
                    </span>
                    <span class="font-mono text-sm">{{ endpoint.path }}</span>
                  </p>
                  <h3 class="text-lg font-semibold">
                    {{ endpoint.operation.summary || endpoint.operation.operationId || endpoint.path }}
                  </h3>
                  <p class="text-sm text-base-content/80">
                    {{ endpoint.operation.description || t("apiDocs.endpoint.noDescription") }}
                  </p>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-outline"
                  :aria-label="
                    t('apiDocs.endpoint.openTesterAria', {
                      method: methodLabel(endpoint.method),
                      path: endpoint.path,
                    })
                  "
                  @click="openEndpointTester(endpoint, $event.currentTarget)"
                >
                  {{ t("apiDocs.endpoint.openTester") }}
                </button>
              </header>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="rounded-lg border border-base-200 p-3">
                  <p class="text-xs font-semibold uppercase text-base-content/60">
                    {{ t("apiDocs.endpoint.methodLabel") }}
                  </p>
                  <p class="mt-1 font-mono text-sm">{{ methodLabel(endpoint.method) }}</p>
                </div>
                <div class="rounded-lg border border-base-200 p-3">
                  <p class="text-xs font-semibold uppercase text-base-content/60">
                    {{ t("apiDocs.endpoint.operationIdLabel") }}
                  </p>
                  <p class="mt-1 text-sm">
                    {{ endpoint.operation.operationId || t("apiDocs.endpoint.noDescription") }}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>

    <AppModalFrame
      v-model:open="testerDialogOpen"
      :title-id="API_TESTER_DIALOG_TITLE_ID"
      :described-by-id="selectedEndpoint ? API_TESTER_DIALOG_DESCRIPTION_ID : undefined"
      size-token="wide"
      :close-aria-label="t('apiDocs.tester.closeAria')"
      :close-backdrop-label="t('apiDocs.tester.close')"
      @close="handleEndpointTesterClosed"
    >
      <div class="space-y-4">
        <header class="space-y-2">
          <h2 :id="API_TESTER_DIALOG_TITLE_ID" class="text-xl font-semibold">
            {{ t("apiDocs.tester.title") }}
          </h2>
          <p
            v-if="selectedEndpoint"
            :id="API_TESTER_DIALOG_DESCRIPTION_ID"
            class="font-mono text-sm text-base-content/80"
          >
            <span :class="methodBadgeClass(selectedEndpoint.method)">
              {{ methodLabel(selectedEndpoint.method) }}
            </span>
            <span class="ml-2">{{ selectedEndpoint.path }}</span>
          </p>
        </header>

        <section :aria-label="t('apiDocs.tester.lifecycleTitle')" class="space-y-3">
          <h3 class="font-medium">{{ t("apiDocs.tester.lifecycleTitle") }}</h3>
          <ul class="steps steps-vertical w-full lg:steps-horizontal">
            <li class="step" :class="{ 'step-primary': testerState !== 'idle' }">
              {{ t("apiDocs.tester.steps.configure") }}
            </li>
            <li class="step" :class="{ 'step-primary': testerState !== 'idle' && testerState !== 'loading' }">
              {{ t("apiDocs.tester.steps.send") }}
            </li>
            <li
              class="step"
              :class="{
                'step-success': testerState === 'success' || testerState === 'empty',
                'step-error':
                  testerState === 'errorRetryable' ||
                  testerState === 'errorNonRetryable' ||
                  testerState === 'unauthorized',
              }"
            >
              {{ t("apiDocs.tester.steps.response") }}
            </li>
          </ul>
        </section>

        <section
          v-if="selectedEndpoint && selectedEndpoint.pathParameters.length > 0"
          :aria-label="t('apiDocs.tester.pathParametersIntro')"
          class="space-y-2"
        >
          <h3 class="font-medium">{{ t("apiDocs.tester.pathParametersIntro") }}</h3>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label
              v-for="parameterName in selectedEndpoint.pathParameters"
              :key="`path-${parameterName}`"
              class="form-control"
            >
              <span class="label-text">
                {{ t("apiDocs.tester.parameterLabel", { name: parameterName }) }}
              </span>
              <input
                v-model="pathParameterValues[parameterName]"
                type="text"
                class="input input-bordered"
                :aria-label="t('apiDocs.tester.parameterLabel', { name: parameterName })"
              />
            </label>
          </div>
        </section>

        <section
          v-if="selectedEndpoint && selectedEndpoint.queryParameters.length > 0"
          :aria-label="t('apiDocs.tester.queryParametersIntro')"
          class="space-y-2"
        >
          <h3 class="font-medium">{{ t("apiDocs.tester.queryParametersIntro") }}</h3>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label
              v-for="parameter in selectedEndpoint.queryParameters"
              :key="`query-${parameter.name}`"
              class="form-control"
            >
              <span class="label-text">
                {{ t("apiDocs.tester.parameterLabel", { name: parameter.name }) }}
              </span>
              <input
                v-model="queryParameterValues[parameter.name]"
                type="text"
                class="input input-bordered"
                :aria-label="t('apiDocs.tester.parameterLabel', { name: parameter.name })"
              />
            </label>
          </div>
        </section>

        <section
          v-if="selectedEndpoint"
          :aria-label="t('apiDocs.tester.requestBodyIntro')"
          class="space-y-2"
        >
          <h3 class="font-medium">{{ t("apiDocs.tester.requestBodyIntro") }}</h3>
          <textarea
            v-model="requestBodyValue"
            class="textarea textarea-bordered min-h-40 w-full font-mono text-sm"
            :placeholder="t('apiDocs.tester.bodyPlaceholder')"
            :aria-label="t('apiDocs.tester.requestBodyAria')"
          />
          <p
            v-if="!selectedEndpoint.requestBodyTemplate && !selectedEndpoint.requestBodyRequired"
            class="text-xs text-base-content/60"
          >
            {{ t("apiDocs.tester.noRequestBodyTemplate") }}
          </p>
        </section>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="testerState === 'loading'"
            :aria-label="t('apiDocs.tester.send')"
            @click="executeEndpointRequest"
          >
            <span v-if="testerState === 'loading'" class="loading loading-spinner loading-sm"></span>
            <span v-else>{{ t("apiDocs.tester.send") }}</span>
          </button>
          <button
            type="button"
            class="btn btn-ghost"
            :aria-label="t('apiDocs.tester.closeAria')"
            @click="closeEndpointTester"
          >
            {{ t("apiDocs.tester.close") }}
          </button>
        </div>

        <section class="space-y-3" :aria-label="t('apiDocs.tester.responseTitle')">
          <h3 class="font-medium">{{ t("apiDocs.tester.responseTitle") }}</h3>
          <p class="text-sm text-base-content/70">{{ testerStateLabel }}</p>

          <div
            v-if="testerState === 'errorRetryable' || testerState === 'errorNonRetryable' || testerState === 'unauthorized'"
            class="alert alert-error"
            role="alert"
          >
            <span>{{ testerErrorMessage || t("apiDocs.tester.errorFallback") }}</span>
          </div>

          <div v-if="testerState === 'empty'" class="alert alert-info" role="status">
            <span>{{ t("apiDocs.tester.emptyResponse") }}</span>
          </div>

          <div v-if="testerResponse" class="space-y-3">
            <div class="overflow-x-auto">
              <table class="table table-zebra table-sm">
                <caption class="sr-only">{{ t("apiDocs.tester.metadataTitle") }}</caption>
                <thead>
                  <tr>
                    <th>{{ t("apiDocs.tester.metadata.columns.label") }}</th>
                    <th>{{ t("apiDocs.tester.metadata.columns.value") }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{{ t("apiDocs.tester.metadata.responseStatus") }}</td>
                    <td>
                      {{
                        t("apiDocs.tester.responseStatusLabel", {
                          status: testerResponse.statusCode,
                          text: testerResponse.statusText,
                        })
                      }}
                    </td>
                  </tr>
                  <tr>
                    <td>{{ t("apiDocs.tester.metadata.duration") }}</td>
                    <td>
                      {{ t("apiDocs.tester.durationLabel", { duration: testerResponse.durationMs }) }}
                    </td>
                  </tr>
                  <tr>
                    <td>{{ t("apiDocs.tester.requestMethodLabel") }}</td>
                    <td class="font-mono">{{ testerResponse.method }}</td>
                  </tr>
                  <tr>
                    <td>{{ t("apiDocs.tester.requestUrlLabel") }}</td>
                    <td class="font-mono break-all">{{ testerResponse.url }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="space-y-1">
              <h4 class="font-medium">{{ t("apiDocs.tester.responseHeadersLabel") }}</h4>
              <pre class="rounded-lg bg-base-200 p-3 text-xs whitespace-pre-wrap">{{
                Object.keys(testerResponse.headers).length > 0
                  ? JSON.stringify(testerResponse.headers, null, 2)
                  : t("apiDocs.tester.noResponseHeaders")
              }}</pre>
            </div>

            <div class="space-y-1">
              <h4 class="font-medium">{{ t("apiDocs.tester.responseTitle") }}</h4>
              <pre class="rounded-lg bg-base-200 p-3 text-xs whitespace-pre-wrap">{{
                formattedResponseBody || t("apiDocs.tester.emptyResponse")
              }}</pre>
            </div>
          </div>
        </section>
      </div>
    </AppModalFrame>
  </div>
</template>
