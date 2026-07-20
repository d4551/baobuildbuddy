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

export type WorkspaceSearchSuggestion = {
  text: string;
  type: string;
};

const SEARCH_TYPE_ROUTE: Record<string, (id: string) => string> = {
  jobs: (id) => APP_ROUTE_BUILDERS.jobDetail(id),
  studios: (id) => APP_ROUTE_BUILDERS.studioDetail(id),
  resumes: (id) => APP_ROUTE_BUILDERS.resumeEditor(id),
  skills: () => APP_ROUTES.skills,
};

const AUTOCOMPLETE_MIN_PREFIX = 2;
const AUTOCOMPLETE_DEBOUNCE_MS = 180;

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
  const suggestions = ref<WorkspaceSearchSuggestion[]>([]);
  const loading = ref(false);
  const suggesting = ref(false);
  const open = ref(false);
  let autocompleteTimer: ReturnType<typeof setTimeout> | undefined;

  const search = async (nextQuery = query.value): Promise<void> => {
    const trimmed = nextQuery.trim();
    query.value = trimmed;
    if (trimmed.length < AUTOCOMPLETE_MIN_PREFIX) {
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

  const fetchAutocomplete = async (prefix = query.value): Promise<void> => {
    const trimmed = prefix.trim();
    if (trimmed.length < AUTOCOMPLETE_MIN_PREFIX) {
      suggestions.value = [];
      return;
    }
    suggesting.value = true;
    try {
      const { data, error } = await api.search.autocomplete.get({
        query: { prefix: trimmed },
      });
      assertApiResponse(error, t("workspaceSearch.autocompleteFailed"));
      const next = Array.isArray(data) ? data : [];
      suggestions.value = next.map((entry) => ({
        text: String(entry.text ?? ""),
        type: String(entry.type ?? ""),
      }));
    } finally {
      suggesting.value = false;
    }
  };

  const scheduleAutocomplete = (prefix = query.value): void => {
    if (autocompleteTimer) {
      clearTimeout(autocompleteTimer);
    }
    autocompleteTimer = setTimeout(() => {
      void fetchAutocomplete(prefix);
    }, AUTOCOMPLETE_DEBOUNCE_MS);
  };

  const applySuggestion = async (suggestion: WorkspaceSearchSuggestion): Promise<void> => {
    query.value = suggestion.text;
    suggestions.value = [];
    await search(suggestion.text);
  };

  const clear = (): void => {
    if (autocompleteTimer) {
      clearTimeout(autocompleteTimer);
      autocompleteTimer = undefined;
    }
    query.value = "";
    results.value = [];
    suggestions.value = [];
  };

  return {
    applySuggestion,
    clear,
    loading: readonly(loading),
    open,
    query,
    results: readonly(results),
    scheduleAutocomplete,
    suggesting: readonly(suggesting),
    suggestions: readonly(suggestions),
    search,
  };
}
