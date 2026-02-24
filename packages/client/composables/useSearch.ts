import type { AutocompleteResult, SearchResult, SearchResults } from "@bao/shared";
import { asNumber, asString, isRecord, STATE_KEYS } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { assertApiResponse, settlePromise, withLoadingState } from "./async-flow";

const SEARCH_RESULT_TYPE_MAP: Record<string, SearchResult["type"]> = {
  jobs: "job",
  studios: "studio",
  skills: "skill",
  resumes: "resume",
  "cover-letters": "cover-letter",
};

interface SearchContext {
  api: ReturnType<typeof useApi>;
  t: ReturnType<typeof useI18n>["t"];
  query: ReturnType<typeof useState<string>>;
  results: ReturnType<typeof useState<SearchResults | null>>;
  suggestions: ReturnType<typeof useState<AutocompleteResult[]>>;
  loading: ReturnType<typeof useState<boolean>>;
}

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
      fn(...args).then(
        () => undefined,
        () => undefined,
      );
    }, delayMs);
  };
};

function toSearchFilters(types?: string[]): SearchResults["filters"] {
  return types?.length ? { types: types.join(",") } : undefined;
}

function toSearchResult(entry: unknown): SearchResult | null {
  if (!isRecord(entry)) {
    return null;
  }
  const id = asString(entry.id);
  const title = asString(entry.title);
  const rawType = asString(entry.type);
  if (!(id && title && rawType)) {
    return null;
  }

  const mappedType = SEARCH_RESULT_TYPE_MAP[rawType];
  if (!mappedType) {
    return null;
  }

  const subtitle = asString(entry.subtitle);
  const snippet = asString(entry.snippet);
  const description = subtitle && snippet ? `${subtitle} • ${snippet}` : subtitle || snippet;

  return {
    id,
    type: mappedType,
    title,
    matchScore: asNumber(entry.relevance),
    ...(description ? { description } : {}),
  };
}

const toSearchResults = (value: unknown, query: string, types?: string[]): SearchResults => {
  const filters = toSearchFilters(types);
  if (!(isRecord(value) && Array.isArray(value.results))) {
    return {
      query,
      results: [],
      total: 0,
      filters,
    };
  }

  const results = value.results
    .map((entry) => toSearchResult(entry))
    .filter((entry): entry is SearchResult => entry !== null);

  return {
    query: asString(value.query) ?? query,
    results,
    total: results.length,
    filters,
  };
};

const toAutocompleteResults = (value: unknown): AutocompleteResult[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const suggestions: AutocompleteResult[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }
    const text = asString(entry.text);
    const type = asString(entry.type);
    if (text && type) {
      suggestions.push({ value: text, type, label: text });
    }
  }
  return suggestions;
};

function createSearchActions(context: SearchContext) {
  const searchAll = debounceAsync(async (q: string, types?: string[]) => {
    if (q.length < 2) {
      context.results.value = null;
      return;
    }

    await withLoadingState(context.loading, async () => {
      const queryParams: Record<string, string> = { q };
      if (types?.length) {
        queryParams.types = types.join(",");
      }
      const { data, error } = await context.api.search.get({ query: queryParams });
      assertApiResponse(error, context.t("apiErrors.search.searchFailed"));
      context.results.value = toSearchResults(data, q, types);
    });
  }, 300);

  const autocomplete = debounceAsync(async (prefix: string) => {
    if (prefix.length < 2) {
      context.suggestions.value = [];
      return;
    }

    const settled = await settlePromise(
      context.api.search.autocomplete.get({ query: { prefix } }),
      context.t("apiErrors.search.autocompleteFailed"),
    );
    if (!settled.ok || settled.value.error) {
      context.suggestions.value = [];
      return;
    }

    context.suggestions.value = toAutocompleteResults(settled.value.data);
  }, 150);

  const clearSearch = (): void => {
    context.query.value = "";
    context.results.value = null;
    context.suggestions.value = [];
  };

  return {
    searchAll,
    autocomplete,
    clearSearch,
  };
}

function createSearchComputed(context: SearchContext) {
  const resultCount = computed(() => context.results.value?.results?.length || 0);
  const resultsByType = computed(() => {
    if (!context.results.value?.results) {
      return {};
    }

    const grouped: Record<string, SearchResult[]> = {};
    for (const result of context.results.value.results) {
      grouped[result.type] = [...(grouped[result.type] ?? []), result];
    }
    return grouped;
  });

  return {
    resultCount,
    resultsByType,
  };
}

/**
 * Unified search composable for searching across jobs, studios, skills, and resumes.
 */
export function useSearch() {
  const context: SearchContext = {
    api: useApi(),
    t: useI18n().t,
    query: useState(STATE_KEYS.SEARCH_QUERY, () => ""),
    results: useState<SearchResults | null>(STATE_KEYS.SEARCH_RESULTS, () => null),
    suggestions: useState<AutocompleteResult[]>(STATE_KEYS.SEARCH_SUGGESTIONS, () => []),
    loading: useState(STATE_KEYS.SEARCH_LOADING, () => false),
  };

  const actions = createSearchActions(context);
  const computedState = createSearchComputed(context);

  return {
    query: context.query,
    results: readonly(context.results),
    suggestions: readonly(context.suggestions),
    loading: readonly(context.loading),
    resultCount: computedState.resultCount,
    resultsByType: computedState.resultsByType,
    ...actions,
  };
}
