import { APP_ROUTE_BUILDERS, APP_ROUTES } from "@bao/shared/constants/routes";
import {
  SEARCH_RESULT_TYPES,
  type SearchResultType,
} from "@bao/shared/constants/search";
import { isRecord } from "@bao/shared/utils/type-guards";
import { settle } from "@bao/shared/utils/promise";
import { useI18n } from "vue-i18n";
import { assertApiResponse, withLoadingState } from "~/composables/async-flow";
import { useApi } from "~/composables/useApi";

export type WorkspaceSearchResult = {
  type: SearchResultType;
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

/** SSOT route map — keys MUST equal SEARCH_RESULT_TYPES (validate:search-type-parity). */
export const SEARCH_TYPE_ROUTE: Record<SearchResultType, (id: string) => string> = {
  jobs: (id) => APP_ROUTE_BUILDERS.jobDetail(id),
  studios: (id) => APP_ROUTE_BUILDERS.studioDetail(id),
  resumes: (id) => APP_ROUTE_BUILDERS.resumeEditor(id),
  skills: () => APP_ROUTES.skills,
  "cover-letters": (id) => APP_ROUTE_BUILDERS.coverLetterDetail(id),
  "portfolio-projects": () => APP_ROUTES.portfolio,
  "interview-sessions": (id) => APP_ROUTE_BUILDERS.interviewSession(id),
  "automation-runs": (id) => APP_ROUTE_BUILDERS.automationRunDetail(id),
};

const AUTOCOMPLETE_MIN_PREFIX = 2;
const AUTOCOMPLETE_DEBOUNCE_MS = 180;

export const WORKSPACE_OMNI_SEARCH_OPEN_EVENT = "bao:open-omni-search";

export function resolveWorkspaceSearchResultRoute(result: WorkspaceSearchResult): string {
  const builder = SEARCH_TYPE_ROUTE[result.type];
  return builder(result.id);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asSearchResultType(value: unknown): SearchResultType | null {
  if (typeof value !== "string") {
    return null;
  }
  return (SEARCH_RESULT_TYPES as readonly string[]).includes(value)
    ? (value as SearchResultType)
    : null;
}

function mapSearchResults(data: unknown): WorkspaceSearchResult[] {
  const resultsValue = isRecord(data) ? data.results : undefined;
  const nextResults: readonly unknown[] = Array.isArray(resultsValue) ? resultsValue : [];
  const mapped: WorkspaceSearchResult[] = [];
  for (const entry of nextResults) {
    if (!isRecord(entry)) {
      continue;
    }
    const type = asSearchResultType(entry.type);
    if (!type) {
      continue;
    }
    mapped.push({
      type,
      id: asString(entry.id),
      title: asString(entry.title),
      subtitle: asString(entry.subtitle),
      snippet: asString(entry.snippet),
      relevance: typeof entry.relevance === "number" ? entry.relevance : 0,
    });
  }
  return mapped;
}

function mapSuggestions(data: unknown): WorkspaceSearchSuggestion[] {
  if (!Array.isArray(data)) {
    return [];
  }
  const entries: readonly unknown[] = data;
  const mapped: WorkspaceSearchSuggestion[] = [];
  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue;
    }
    mapped.push({
      text: asString(entry.text),
      type: asString(entry.type),
    });
  }
  return mapped;
}

function createWorkspaceSearchActions(input: {
  api: ReturnType<typeof useApi>;
  loading: Ref<boolean>;
  query: Ref<string>;
  results: Ref<WorkspaceSearchResult[]>;
  suggesting: Ref<boolean>;
  suggestions: Ref<WorkspaceSearchSuggestion[]>;
  t: ReturnType<typeof useI18n>["t"];
}) {
  let autocompleteTimer: ReturnType<typeof setTimeout> | undefined;

  const search = async (nextQuery = input.query.value): Promise<void> => {
    const trimmed = nextQuery.trim();
    input.query.value = trimmed;
    if (trimmed.length < AUTOCOMPLETE_MIN_PREFIX) {
      input.results.value = [];
      return;
    }
    await withLoadingState(input.loading, async () => {
      const { data, error } = await input.api.search.get({ query: { q: trimmed } });
      assertApiResponse(error, input.t("workspaceSearch.searchFailed"));
      input.results.value = mapSearchResults(data);
    });
  };

  const fetchAutocomplete = async (prefix = input.query.value): Promise<void> => {
    const trimmed = prefix.trim();
    if (trimmed.length < AUTOCOMPLETE_MIN_PREFIX) {
      input.suggestions.value = [];
      return;
    }
    input.suggesting.value = true;
    const settled = await settle(
      input.api.search.autocomplete.get({ query: { prefix: trimmed } }),
    );
    input.suggesting.value = false;
    if (settled.status !== "fulfilled") {
      return;
    }
    const { data, error } = settled.value;
    assertApiResponse(error, input.t("workspaceSearch.autocompleteFailed"));
    input.suggestions.value = mapSuggestions(data);
  };

  const scheduleAutocomplete = (prefix = input.query.value): void => {
    if (autocompleteTimer) {
      clearTimeout(autocompleteTimer);
    }
    autocompleteTimer = setTimeout(() => {
      settle(fetchAutocomplete(prefix)).then(
        () => undefined,
        () => undefined,
      );
    }, AUTOCOMPLETE_DEBOUNCE_MS);
  };

  const applySuggestion = async (suggestion: WorkspaceSearchSuggestion): Promise<void> => {
    input.query.value = suggestion.text;
    input.suggestions.value = [];
    await search(suggestion.text);
  };

  const clear = (): void => {
    if (autocompleteTimer) {
      clearTimeout(autocompleteTimer);
      autocompleteTimer = undefined;
    }
    input.query.value = "";
    input.results.value = [];
    input.suggestions.value = [];
  };

  return {
    applySuggestion,
    clear,
    scheduleAutocomplete,
    search,
  };
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
  const actions = createWorkspaceSearchActions({
    api,
    loading,
    query,
    results,
    suggesting,
    suggestions,
    t,
  });

  return {
    applySuggestion: actions.applySuggestion,
    clear: actions.clear,
    loading: readonly(loading),
    open,
    query,
    results: readonly(results),
    scheduleAutocomplete: actions.scheduleAutocomplete,
    suggesting: readonly(suggesting),
    suggestions: readonly(suggestions),
    search: actions.search,
  };
}
