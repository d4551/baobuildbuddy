import {
  API_TESTER_DIALOG_DESCRIPTION_ID,
  API_TESTER_DIALOG_TITLE_ID,
  type ApiDocsTranslate,
} from "~/composables/api-docs-page-contracts";
import { useApiDocsPageData } from "~/composables/api-docs-page-data";
import { useApiDocsPageNavigation } from "~/composables/api-docs-page-navigation";
import { createApiDocsMethodPresentation } from "~/composables/api-docs-page-presentation";
import { useApiDocsPageTester } from "~/composables/api-docs-page-tester";
import { useToast } from "~/composables/useToast";
import type { ApiHttpMethod } from "~/types/api-docs";

const createApiDocsPageRuntime = () => {
  const config = useRuntimeConfig();
  return {
    toast: useToast(),
    route: useRoute(),
    requestUrl: useRequestURL(),
    apiBase: String(config.public.apiBase || "/"),
  };
};

const createApiDocsPageState = (input: {
  readonly t: ApiDocsTranslate;
  readonly runtime: ReturnType<typeof createApiDocsPageRuntime>;
}) => {
  const docsData = useApiDocsPageData({
    t: input.t,
  });
  const navigation = useApiDocsPageNavigation({
    route: input.runtime.route,
    docsUiState: docsData.docsUiState,
    endpointGroups: docsData.endpointGroups,
  });
  const tester = useApiDocsPageTester({
    t: input.t,
    apiBase: input.runtime.apiBase,
    requestUrl: input.runtime.requestUrl,
    toast: input.runtime.toast,
  });

  return {
    docsData,
    navigation,
    tester,
    methodPresentation: createApiDocsMethodPresentation(),
  };
};

export function useApiDocsPage(t: ApiDocsTranslate) {
  const runtime = createApiDocsPageRuntime();
  const pageState = createApiDocsPageState({ t, runtime });

  return {
    docsUiState: pageState.docsData.docsUiState,
    endpointGroups: pageState.docsData.endpointGroups,
    activeEndpointId: pageState.navigation.activeEndpointId,
    testerDialogOpen: pageState.tester.testerDialogOpen,
    selectedEndpoint: pageState.tester.selectedEndpoint,
    testerState: pageState.tester.testerState,
    testerStateLabel: pageState.tester.testerStateLabel,
    pathParameterValues: pageState.tester.pathParameterValues,
    queryParameterValues: pageState.tester.queryParameterValues,
    requestBodyValue: pageState.tester.requestBodyValue,
    testerErrorMessage: pageState.tester.testerErrorMessage,
    testerResponse: pageState.tester.testerResponse,
    formattedResponseBody: pageState.tester.formattedResponseBody,
    rawSpecError: pageState.docsData.rawSpecError,
    refreshSpec: pageState.docsData.refreshSpec,
    methodLabel: (method: ApiHttpMethod) => pageState.methodPresentation.methodLabel(method),
    methodBadgeClass: (method: ApiHttpMethod) =>
      pageState.methodPresentation.methodBadgeClass(method),
    scrollToEndpoint: pageState.navigation.scrollToEndpoint,
    openEndpointTester: pageState.tester.openEndpointTester,
    registerEndpointSectionRef: pageState.navigation.registerEndpointSectionRef,
    handleEndpointTesterClosed: pageState.tester.handleEndpointTesterClosed,
    executeEndpointRequest: pageState.tester.executeEndpointRequest,
    API_TESTER_DIALOG_TITLE_ID,
    API_TESTER_DIALOG_DESCRIPTION_ID,
  };
}
