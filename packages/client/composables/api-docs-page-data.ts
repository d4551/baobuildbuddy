import { API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { computed } from "vue";
import type { ApiDocsUiState, ApiEndpointGroup } from "~/types/api-docs";
import {
  API_DOCS_ASYNC_DATA_KEY,
  type ApiDocsTranslate,
  UNKNOWN_TAG_LABEL_KEY,
} from "~/composables/api-docs-page-contracts";
import { resolveApiEndpoint } from "~/utils/endpoints";
import { buildApiEndpointGroups } from "~/utils/api-docs-endpoints";
import { readOpenApiSpec } from "~/utils/api-docs-openapi";
import { toApiDocsUiStateFromStatusCode, toErrorStatusCode } from "~/utils/api-docs-status";

interface ApiDocsPageDataOptions {
  readonly t: ApiDocsTranslate;
  readonly apiBase: string;
  readonly requestUrl: URL;
}

export const useApiDocsPageData = ({ t, apiBase, requestUrl }: ApiDocsPageDataOptions) => {
  const fetchOpenApiSpec = (): Promise<unknown> =>
    $fetch<unknown>(resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.apiDocsJson)).then(
      (value) => value,
      () =>
        $fetch<unknown>(resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.apiDocsJsonLegacy)),
    );

  const {
    data: rawSpec,
    status: rawSpecStatus,
    error: rawSpecError,
    refresh: refreshSpec,
  } = useAsyncData<unknown>(API_DOCS_ASYNC_DATA_KEY, fetchOpenApiSpec, {
    server: true,
    default: () => null,
  });

  const parsedSpec = computed(() => readOpenApiSpec(rawSpec.value));
  const endpointGroups = computed<readonly ApiEndpointGroup[]>(() =>
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

  return {
    docsUiState,
    endpointGroups,
    rawSpecError,
    refreshSpec,
  };
};
