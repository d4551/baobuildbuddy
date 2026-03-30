import { API_ENDPOINTS, safeParseJson } from "@bao/shared";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import type { ComponentPublicInstance } from "vue";
import { useI18n } from "vue-i18n";
import type {
  ApiDocsUiState,
  ApiEndpoint,
  ApiHttpMethod,
  ApiTesterState,
  FetchEndpointResult,
  FetchEndpointResultOk,
} from "~/types/api-docs";
import { useScrollSpy } from "~/composables/useScrollSpy";
import { useToast } from "~/composables/useToast";
import { resolveApiEndpoint } from "~/utils/endpoints";
import {
  buildApiDocsQueryString,
  buildApiEndpointGroups,
  getApiDocsParameterValueDefault,
  readOpenApiSpec,
  resolveApiDocsPathWithParameters,
  toApiDocsUiStateFromStatusCode,
  toErrorStatusCode,
} from "~/utils/api-docs";

const API_DOCS_ASYNC_DATA_KEY = "api-docs-json";
const UNKNOWN_TAG_LABEL_KEY = "apiDocs.groups.untagged";
const API_TESTER_DIALOG_TITLE_ID = "api-endpoint-tester-title";
const API_TESTER_DIALOG_DESCRIPTION_ID = "api-endpoint-tester-description";

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

export async function useApiDocsPage() {
  const { t } = useI18n();
  const toast = useToast();

  if (import.meta.server) {
    useServerSeoMeta({
      title: t("apiDocs.seoTitle"),
      description: t("apiDocs.seoDescription"),
    });
  }

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
  const endpointGroups = computed(() =>
    buildApiEndpointGroups(parsedSpec.value, t(UNKNOWN_TAG_LABEL_KEY)),
  );
  const endpointCount = computed(() =>
    endpointGroups.value.reduce((count, group) => count + group.endpoints.length, 0),
  );
  const docsUiState = computed<ApiDocsUiState>(() => {
    if (rawSpecStatus.value === "pending") {
      return "loading";
    }
    if (rawSpecError.value) {
      return toApiDocsUiStateFromStatusCode(toErrorStatusCode(rawSpecError.value));
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
    if (activeSectionId.value && activeSectionId.value.length > 0) {
      return activeSectionId.value;
    }
    const firstGroup = endpointGroups.value[0];
    return firstGroup?.endpoints[0]?.id ?? "";
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
      const firstEndpointId = endpointGroups.value[0]?.endpoints[0]?.id;
      if (firstEndpointId) {
        scrollToSection(firstEndpointId, {
          smooth: false,
          focus: false,
          updateHash: false,
        });
      }
    }
  };

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
      initialQueryValues[parameter.name] = getApiDocsParameterValueDefault(parameter.example);
    }
    queryParameterValues.value = initialQueryValues;
    requestBodyValue.value = endpoint.requestBodyTemplate;
    testerDialogOpen.value = true;
  };

  const registerEndpointSectionRef = (endpointId: string) => {
    return (element: Element | ComponentPublicInstance | null) => {
      setSectionRef(endpointId, element instanceof Element ? element : null);
    };
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

    const resolvedPath = resolveApiDocsPathWithParameters(endpoint, pathParameterValues.value);
    if (!resolvedPath) {
      testerState.value = "errorNonRetryable";
      testerErrorMessage.value = t("apiDocs.tester.invalidPath");
      toast.error(t("apiDocs.tester.requestErrorToast"));
      return;
    }

    const queryString = buildApiDocsQueryString(endpoint.queryParameters, queryParameterValues.value);
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
    const responseResultPromise: Promise<FetchEndpointResult> = fetch(endpointUrl, {
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
          ok: true,
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
      () => ({
        ok: false,
        errorMessage: t("apiDocs.tester.requestFailure"),
      }),
    );
    const responseResult = await responseResultPromise;

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
      testerState.value = toApiDocsUiStateFromStatusCode(responseResult.payload.statusCode);
      if (testerState.value === "loading" || testerState.value === "success") {
        testerState.value =
          responseResult.payload.statusCode === 429 || responseResult.payload.statusCode >= 500
            ? "errorRetryable"
            : "errorNonRetryable";
      }
      testerErrorMessage.value = t("apiDocs.tester.errorFallback");
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

  return {
    t,
    docsUiState,
    endpointGroups,
    activeEndpointId,
    testerDialogOpen,
    selectedEndpoint,
    testerState,
    testerStateLabel,
    pathParameterValues,
    queryParameterValues,
    requestBodyValue,
    testerErrorMessage,
    testerResponse,
    formattedResponseBody,
    rawSpecError,
    refreshSpec,
    methodLabel,
    methodBadgeClass,
    scrollToEndpoint,
    openEndpointTester,
    registerEndpointSectionRef,
    handleEndpointTesterClosed,
    executeEndpointRequest,
    API_TESTER_DIALOG_TITLE_ID,
    API_TESTER_DIALOG_DESCRIPTION_ID,
  };
}
