import { APP_ROUTE_BUILDERS, APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { assertApiResponse, withLoadingState } from "~/composables/async-flow";
import { useApi } from "~/composables/useApi";

export type WorkspaceSearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  snippet: string;
  relevance: number;
};

const SEARCH_TYPE_ROUTE: Record<string, (id: string) => string> = {
  jobs: (id) => APP_ROUTE_BUILDERS.jobDetail(id),
  studios: (id) => APP_ROUTE_BUILDERS.studioDetail(id),
  resumes: (id) => APP_ROUTE_BUILDERS.resumeEditor(id),
  skills: () => APP_ROUTES.skills,
};

export function resolveWorkspaceSearchResultRoute(result: WorkspaceSearchResult): string {
  const builder = SEARCH_TYPE_ROUTE[result.type];
  if (!builder) {
    return APP_ROUTES.dashboard;
  }
  return builder(result.id);
}

export function useWorkspaceSearch() {
  const api = useApi();
  const { t } = useI18n();
  const query = ref("");
  const results = ref<WorkspaceSearchResult[]>([]);
  const loading = ref(false);
  const open = ref(false);

  const search = async (nextQuery = query.value): Promise<void> => {
    const trimmed = nextQuery.trim();
    query.value = trimmed;
    if (trimmed.length < 2) {
      results.value = [];
      return;
    }
    await withLoadingState(loading, async () => {
      const { data, error } = await api.search.get({ query: { q: trimmed } });
      assertApiResponse(error, t("workspaceSearch.searchFailed"));
      const nextResults = Array.isArray(data?.results) ? data.results : [];
      results.value = nextResults.map((entry) => ({
        type: String(entry.type ?? ""),
        id: String(entry.id ?? ""),
        title: String(entry.title ?? ""),
        subtitle: String(entry.subtitle ?? ""),
        snippet: String(entry.snippet ?? ""),
        relevance: typeof entry.relevance === "number" ? entry.relevance : 0,
      }));
    });
  };

  const clear = (): void => {
    query.value = "";
    results.value = [];
  };

  return {
    clear,
    loading: readonly(loading),
    open,
    query,
    results: readonly(results),
    search,
  };
}
