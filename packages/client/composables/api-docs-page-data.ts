import { API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import type { JsonValue } from "@bao/shared/utils/json";
import { computed } from "vue";
import {
  API_DOCS_ASYNC_DATA_KEY,
  type ApiDocsTranslate,
  UNKNOWN_TAG_LABEL_KEY,
} from "~/composables/api-docs-page-contracts";
import { requestApi } from "~/composables/api-request";
import type { ApiDocsUiState, ApiEndpointGroup, OpenApiSpec } from "~/types/api-docs";
import { buildApiEndpointGroups } from "~/utils/api-docs-endpoints";
import { readOpenApiSpec } from "~/utils/api-docs-openapi";
import { toApiDocsUiStateFromStatusCode, toErrorStatusCode } from "~/utils/api-docs-status";

interface ApiDocsPageDataOptions {
  readonly t: ApiDocsTranslate;
  readonly apiBase: string;
  readonly requestUrl: URL;
}

export const useApiDocsPageData = ({ t, apiBase, requestUrl }: ApiDocsPageDataOptions) => {
  const fetchOpenApiSpec = async (): Promise<OpenApiSpec | null> => {
    const raw = await requestApi<JsonValue>({ apiBase, requestUrl }, API_ENDPOINTS.apiDocsJson);
    return readOpenApiSpec(raw);
  };

  const {
    data: parsedSpec,
    status: rawSpecStatus,
    error: rawSpecError,
    refresh: refreshSpec,
  } = useAsyncData<OpenApiSpec | null>(API_DOCS_ASYNC_DATA_KEY, fetchOpenApiSpec, {
    server: true,
    default: () => null,
  });

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
