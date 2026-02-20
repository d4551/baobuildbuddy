import type { AutocompleteResult, SearchResult, SearchResults } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";

const SEARCH_RESULT_TYPE_MAP: Record<string, SearchResult["type"]> = {
  jobs: "job",
  studios: "studio",
  skills: "skill",
  resumes: "resume",
  "cover-letters": "cover-letter",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const debounceAsync = <TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<void>,
  delayMs: number,
) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs): void => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      void fn(...args);
    }, delayMs);
  };
};

const toSearchResults = (value: unknown, query: string, types?: string[]): SearchResults => {
  if (!isRecord(value) || !Array.isArray(value.results)) {
    return {
      query,
      results: [],
      total: 0,
      filters: types?.length ? { types: types.join(",") } : undefined,
    };
  }

  const results: SearchResult[] = [];
  for (const entry of value.results) {
    if (!isRecord(entry)) continue;
    const id = asString(entry.id);
    const title = asString(entry.title);
    const rawType = asString(entry.type);
    if (!id || !title || !rawType) continue;

    const mappedType = SEARCH_RESULT_TYPE_MAP[rawType];
    if (!mappedType) continue;

    const subtitle = asString(entry.subtitle);
    const snippet = asString(entry.snippet);
    const result: SearchResult = {
      id,
      type: mappedType,
      title,
      matchScore: asNumber(entry.relevance),
    };
    if (subtitle && snippet) {
      result.description = `${subtitle} • ${snippet}`;
    } else if (subtitle) {
      result.description = subtitle;
    } else if (snippet) {
      result.description = snippet;
    }
    results.push(result);
  }

  return {
    query: asString(value.query) ?? query,
    results,
    total: results.length,
    filters: types?.length ? { types: types.join(",") } : undefined,
  };
};

const toAutocompleteResults = (value: unknown): AutocompleteResult[] => {
  if (!Array.isArray(value)) return [];
  const suggestions: AutocompleteResult[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const text = asString(entry.text);
    const type = asString(entry.type);
    if (!text || !type) continue;
    suggestions.push({
      value: text,
      type,
      label: text,
    });
  }
  return suggestions;
};

/**
 * Unified search composable for searching across jobs, studios, skills, and resumes.
 */
export function useSearch() {
  const api = useApi();
  const query = useState(STATE_KEYS.SEARCH_QUERY, () => "");
  const results = useState<SearchResults | null>(STATE_KEYS.SEARCH_RESULTS, () => null);
  const suggestions = useState<AutocompleteResult[]>(STATE_KEYS.SEARCH_SUGGESTIONS, () => []);
  const loading = useState(STATE_KEYS.SEARCH_LOADING, () => false);

  const searchAll = debounceAsync(async (q: string, types?: string[]) => {
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
      results.value = toSearchResults(data, q, types);
    } finally {
      loading.value = false;
    }
  }, 300);

  const autocomplete = debounceAsync(async (prefix: string) => {
    if (prefix.length < 2) {
      suggestions.value = [];
      return;
    }
    try {
      const { data, error } = await api.search.autocomplete.get({ query: { prefix } });
      if (error) return;
      suggestions.value = toAutocompleteResults(data);
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
      let group = grouped[result.type];
      if (!group) {
        group = [];
        grouped[result.type] = group;
      }
      group.push(result);
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
