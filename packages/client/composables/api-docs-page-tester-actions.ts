import { nextTick } from "vue";
import type { ApiDocsToast, ApiDocsTranslate } from "~/composables/api-docs-page-contracts";
import {
  createApiDocsEndpointRequest,
  createInitialTesterValues,
  fetchApiDocsEndpointResponse,
} from "~/composables/api-docs-page-tester-request";
import type { ApiEndpoint, ApiTesterState, FetchEndpointResultOk } from "~/types/api-docs";
import { toApiDocsUiStateFromStatusCode } from "~/utils/api-docs-status";

type MutableRef<T> = {
  value: T;
};

export interface ApiDocsEndpointTesterActionOptions {
  readonly t: ApiDocsTranslate;
  readonly apiBase: string;
  readonly requestUrl: URL;
  readonly toast: ApiDocsToast;
  readonly testerInvoker: MutableRef<{ focus?: () => void } | null>;
  readonly testerDialogOpen: MutableRef<boolean>;
  readonly selectedEndpoint: MutableRef<ApiEndpoint | null>;
  readonly testerState: MutableRef<ApiTesterState>;
  readonly testerErrorMessage: MutableRef<string>;
  readonly testerResponse: MutableRef<FetchEndpointResultOk | null>;
  readonly pathParameterValues: MutableRef<Record<string, string>>;
  readonly queryParameterValues: MutableRef<Record<string, string>>;
  readonly requestBodyValue: MutableRef<string>;
}

const applyApiDocsTesterFailure = (input: {
  testerState: MutableRef<ApiTesterState>;
  testerErrorMessage: MutableRef<string>;
  toast: ApiDocsToast;
  t: ApiDocsTranslate;
  message: string;
  state?: ApiTesterState;
}) => {
  input.testerState.value = input.state ?? "errorRetryable";
  input.testerErrorMessage.value = input.message;
  input.toast.error(input.t("apiDocs.tester.requestErrorToast"));
};

const applyApiDocsTesterSuccess = (input: {
  testerState: MutableRef<ApiTesterState>;
  testerErrorMessage: MutableRef<string>;
  testerResponse: MutableRef<FetchEndpointResultOk | null>;
  toast: ApiDocsToast;
  t: ApiDocsTranslate;
  responseResult: FetchEndpointResultOk;
}) => {
  input.testerResponse.value = input.responseResult;
  const isSuccessStatusCode =
    input.responseResult.statusCode >= 200 && input.responseResult.statusCode < 300;

  if (!isSuccessStatusCode) {
    input.testerState.value = toApiDocsUiStateFromStatusCode(input.responseResult.statusCode);
    if (input.testerState.value === "loading" || input.testerState.value === "success") {
      input.testerState.value =
        input.responseResult.statusCode === 429 || input.responseResult.statusCode >= 500
          ? "errorRetryable"
          : "errorNonRetryable";
    }
    input.testerErrorMessage.value = input.t("apiDocs.tester.errorFallback");
    input.toast.error(input.t("apiDocs.tester.requestErrorToast"));
    return;
  }

  if (input.responseResult.body.trim().length === 0) {
    input.testerState.value = "empty";
    input.toast.info(input.t("apiDocs.tester.emptyResponseToast"));
    return;
  }

  input.testerState.value = "success";
  input.toast.success(input.t("apiDocs.tester.requestSuccessToast"));
};

const openApiEndpointTester =
  (input: ApiDocsEndpointTesterActionOptions) =>
  (endpoint: ApiEndpoint, invoker: EventTarget | null): void => {
    const initialValues = createInitialTesterValues(endpoint);
    input.selectedEndpoint.value = endpoint;
    input.testerState.value = "idle";
    input.testerErrorMessage.value = "";
    input.testerResponse.value = null;
    input.testerInvoker.value = invoker instanceof HTMLElement ? invoker : null;
    input.pathParameterValues.value = initialValues.initialPathValues;
    input.queryParameterValues.value = initialValues.initialQueryValues;
    input.requestBodyValue.value = initialValues.requestBodyValue;
    input.testerDialogOpen.value = true;
  };

const closeApiEndpointTester = async (input: ApiDocsEndpointTesterActionOptions): Promise<void> => {
  input.testerDialogOpen.value = false;
  const invoker = input.testerInvoker.value;
  input.testerInvoker.value = null;
  if (!invoker) {
    return;
  }
  await nextTick();
  invoker.focus?.();
};

const executeApiEndpointTesterRequest = async (
  input: ApiDocsEndpointTesterActionOptions,
): Promise<void> => {
  const endpoint = input.selectedEndpoint.value;
  if (!endpoint) {
    return;
  }

  const request = createApiDocsEndpointRequest({
    endpoint,
    pathParameterValues: input.pathParameterValues.value,
    queryParameterValues: input.queryParameterValues.value,
    requestBodyValue: input.requestBodyValue.value,
    apiBase: input.apiBase,
    requestUrl: input.requestUrl,
    t: input.t,
  });

  if (!request.ok) {
    applyApiDocsTesterFailure({
      testerState: input.testerState,
      testerErrorMessage: input.testerErrorMessage,
      toast: input.toast,
      t: input.t,
      message: request.message,
      state: request.state,
    });
    return;
  }

  input.testerState.value = "loading";
  input.testerErrorMessage.value = "";
  input.testerResponse.value = null;

  const responseResult = await fetchApiDocsEndpointResponse({
    endpointUrl: request.endpointUrl,
    requestMethod: request.requestMethod,
    requestBody: request.requestBody,
    t: input.t,
  });

  if (!responseResult.ok) {
    applyApiDocsTesterFailure({
      testerState: input.testerState,
      testerErrorMessage: input.testerErrorMessage,
      toast: input.toast,
      t: input.t,
      message: responseResult.errorMessage,
    });
    return;
  }

  applyApiDocsTesterSuccess({
    testerState: input.testerState,
    testerErrorMessage: input.testerErrorMessage,
    testerResponse: input.testerResponse,
    toast: input.toast,
    t: input.t,
    responseResult: responseResult.payload,
  });
};

export const createEndpointTesterActions = (input: ApiDocsEndpointTesterActionOptions) => ({
  openEndpointTester: openApiEndpointTester(input),
  handleEndpointTesterClosed: () => closeApiEndpointTester(input),
  executeEndpointRequest: () => executeApiEndpointTesterRequest(input),
});
