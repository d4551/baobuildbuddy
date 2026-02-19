import type { AutocompleteResult, SearchResult, SearchResults } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";

/**
 * Unified search composable for searching across jobs, studios, skills, and resumes.
 */
export function useSearch() {
  const api = useApi();
  const query = useState(STATE_KEYS.SEARCH_QUERY, () => "");
  const results = useState<SearchResults | null>(STATE_KEYS.SEARCH_RESULTS, () => null);
  const suggestions = useState<AutocompleteResult[]>(STATE_KEYS.SEARCH_SUGGESTIONS, () => []);
  const loading = useState(STATE_KEYS.SEARCH_LOADING, () => false);

  const searchAll = useDebounceFn(async (q: string, types?: string[]) => {
    if (q.length < 2) {
      results.value = null;
      return;
    }
    loading.value = true;
    try {
      const queryParams: Record<string, string> = { q };
      if (types?.length) queryParams.types = types.join(",");
      const { data, error } = await api.search.get({ query: queryParams });
      if (error) throw new Error("Failed to search");
      results.value = data as SearchResults;
    } finally {
      loading.value = false;
    }
  }, 300);

  const autocomplete = useDebounceFn(async (prefix: string) => {
    if (prefix.length < 2) {
      suggestions.value = [];
      return;
    }
    try {
      const { data, error } = await api.search.autocomplete.get({ query: { prefix } });
      if (error) return;
      suggestions.value = (data as AutocompleteResult[]) ?? [];
    } catch {
      suggestions.value = [];
    }
  }, 150);

  function clearSearch() {
    query.value = "";
    results.value = null;
    suggestions.value = [];
  }

  const resultCount = computed(() => {
    if (!results.value) return 0;
    return results.value.results?.length || 0;
  });

  const resultsByType = computed(() => {
    if (!results.value?.results) return {};
    const grouped: Record<string, SearchResult[]> = {};
    for (const result of results.value.results) {
      if (!grouped[result.type]) grouped[result.type] = [];
      grouped[result.type].push(result);
    }
    return grouped;
  });

  return {
    query,
    results: readonly(results),
    suggestions: readonly(suggestions),
    loading: readonly(loading),
    resultCount,
    resultsByType,
    searchAll,
    autocomplete,
    clearSearch,
  };
}
