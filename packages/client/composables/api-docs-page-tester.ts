import { safeParseJson } from "@bao/shared";
import { computed, ref } from "vue";
import type { ApiDocsToast, ApiDocsTranslate } from "~/composables/api-docs-page-contracts";
import { createEndpointTesterActions } from "~/composables/api-docs-page-tester-actions";
import type { ApiEndpoint, ApiTesterState, FetchEndpointResultOk } from "~/types/api-docs";

interface ApiDocsPageTesterOptions {
  readonly t: ApiDocsTranslate;
  readonly apiBase: string;
  readonly requestUrl: URL;
  readonly toast: ApiDocsToast;
}

const createTesterStateLabel = (testerState: Readonly<Ref<ApiTesterState>>, t: ApiDocsTranslate) =>
  computed(() => {
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

const createFormattedResponseBody = (testerResponse: Readonly<Ref<FetchEndpointResultOk | null>>) =>
  computed(() => {
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

export const useApiDocsPageTester = ({
  t,
  apiBase,
  requestUrl,
  toast,
}: ApiDocsPageTesterOptions) => {
  const testerInvoker = ref<HTMLElement | null>(null);
  const testerDialogOpen = ref(false);
  const selectedEndpoint = ref<ApiEndpoint | null>(null);
  const testerState = ref<ApiTesterState>("idle");
  const testerErrorMessage = ref("");
  const testerResponse = ref<FetchEndpointResultOk | null>(null);
  const pathParameterValues = ref<Record<string, string>>({});
  const queryParameterValues = ref<Record<string, string>>({});
  const requestBodyValue = ref("");
  const actions = createEndpointTesterActions({
    t,
    apiBase,
    requestUrl,
    toast,
    testerInvoker,
    testerDialogOpen,
    selectedEndpoint,
    testerState,
    testerErrorMessage,
    testerResponse,
    pathParameterValues,
    queryParameterValues,
    requestBodyValue,
  });

  return {
    testerDialogOpen,
    selectedEndpoint,
    testerState,
    testerStateLabel: createTesterStateLabel(testerState, t),
    pathParameterValues,
    queryParameterValues,
    requestBodyValue,
    testerErrorMessage,
    testerResponse,
    formattedResponseBody: createFormattedResponseBody(testerResponse),
    openEndpointTester: (endpoint: ApiEndpoint, invoker: EventTarget | null) =>
      actions.openEndpointTester(endpoint, invoker),
    handleEndpointTesterClosed: () => actions.handleEndpointTesterClosed(),
    executeEndpointRequest: () => actions.executeEndpointRequest(),
  };
};
