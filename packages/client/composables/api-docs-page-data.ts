import { computed } from "vue";
import {
  API_DOCS_ASYNC_DATA_KEY,
  type ApiDocsTranslate,
  UNKNOWN_TAG_LABEL_KEY,
} from "~/composables/api-docs-page-contracts";
import { useApi } from "~/composables/useApi";
import type { ApiDocsUiState, ApiEndpointGroup, OpenApiSpec } from "~/types/api-docs";
import { buildApiEndpointGroups } from "~/utils/api-docs-endpoints";
import { readOpenApiSpec } from "~/utils/api-docs-openapi";
import { toApiDocsUiStateFromStatusCode, toErrorStatusCode } from "~/utils/api-docs-status";
import { requireApiResponsePayload } from "~/utils/api-response";

interface ApiDocsPageDataOptions {
  readonly t: ApiDocsTranslate;
}

export const useApiDocsPageData = ({ t }: ApiDocsPageDataOptions) => {
  const api = useApi();

  const fetchOpenApiSpec = async (): Promise<OpenApiSpec | null> => {
    const raw = requireApiResponsePayload(
      await api.docs.api.json.get(),
      t("apiDocs.state.errorNonRetryable"),
    );
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
  const endpointCount = computed(() => {
    let total = 0;
    for (const endpointGroup of endpointGroups.value) {
      total += endpointGroup.endpoints.length;
    }
    return total;
  });
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
