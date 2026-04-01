import { APP_ROUTE_BUILDERS, APP_ROUTE_QUERY_KEYS } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { useDebouncedValue } from "~/composables/useDebouncedValue";
import {
  STUDIO_INDEX_FILTER_DEBOUNCE_MS,
  STUDIO_INDEX_INITIAL_VISIBLE_COUNT,
  STUDIO_INDEX_VISIBLE_INCREMENT,
} from "~/constants/studios";
import { getErrorMessage } from "~/utils/errors";
import { buildInterviewStudioNavigation } from "~/utils/interview-navigation";

function queryValueToString(value: string | null | Array<string | null> | undefined): string {
  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string" ? firstValue : "";
  }
  return typeof value === "string" ? value : "";
}

function sortUniqueOptions(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function createStudiosIndexRuntime() {
  const { $toast } = useNuxtApp();
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();
  const { studios, loading: studioLoading, fetchStudios } = useStudio();

  const pageError = ref<string | null>(null);
  const searchQuery = ref("");
  const showPreviewModal = ref(false);
  const previewStudioId = ref("");
  const visibleStudioCount = ref(STUDIO_INDEX_INITIAL_VISIBLE_COUNT);
  const filters = reactive({
    remoteWork: false,
    size: "",
    type: "",
  });

  return {
    fetchStudios,
    filters,
    pageError,
    previewStudioId,
    route,
    router,
    searchQuery,
    showPreviewModal,
    studioLoading,
    studios,
    t,
    toast: $toast,
    visibleStudioCount,
  };
}

function createStudiosIndexActions(input: ReturnType<typeof createStudiosIndexRuntime>) {
  const previewActions = createStudiosPreviewActions(input);

  function showErrorToast(message: string) {
    if (import.meta.client) {
      input.toast.error(message);
    }
  }

  async function loadStudios() {
    input.pageError.value = null;
    const studiosResult = await settlePromise(
      input.fetchStudios(),
      input.t("studiosIndex.errors.loadFailed"),
    );
    if (!studiosResult.ok) {
      input.pageError.value = getErrorMessage(
        studiosResult.error,
        input.t("studiosIndex.errors.loadFailed"),
      );
      showErrorToast(input.pageError.value);
    }
  }

  function clearFilters() {
    input.searchQuery.value = "";
    input.filters.type = "";
    input.filters.size = "";
    input.filters.remoteWork = false;
    input.visibleStudioCount.value = STUDIO_INDEX_INITIAL_VISIBLE_COUNT;
  }

  function showMoreStudios(filteredCount: number) {
    input.visibleStudioCount.value = Math.min(
      filteredCount,
      input.visibleStudioCount.value + STUDIO_INDEX_VISIBLE_INCREMENT,
    );
  }

  return {
    clearFilters,
    closeStudioPreview: previewActions.closeStudioPreview,
    loadStudios,
    openStudioPreview: previewActions.openStudioPreview,
    showMoreStudios,
    startInterview: previewActions.startInterview,
    viewStudio: previewActions.viewStudio,
  };
}

function createStudiosPreviewActions(input: ReturnType<typeof createStudiosIndexRuntime>) {
  async function setPreviewRouteStudioId(id: string | null): Promise<void> {
    const nextQuery = { ...input.route.query };
    if (id) {
      nextQuery[APP_ROUTE_QUERY_KEYS.studioId] = id;
    } else {
      delete nextQuery[APP_ROUTE_QUERY_KEYS.studioId];
    }
    await input.router.replace({ query: nextQuery });
  }

  async function openStudioPreview(id: string) {
    input.previewStudioId.value = id;
    input.showPreviewModal.value = true;
    await setPreviewRouteStudioId(id);
  }

  async function closeStudioPreview(routeStudioId: string) {
    input.showPreviewModal.value = false;
    input.previewStudioId.value = "";
    if (routeStudioId) {
      await setPreviewRouteStudioId(null);
    }
  }

  async function viewStudio(id: string, routeStudioId: string) {
    await closeStudioPreview(routeStudioId);
    await input.router.push(APP_ROUTE_BUILDERS.studioDetail(id));
  }

  async function startInterview(studioId: string, routeStudioId: string) {
    await closeStudioPreview(routeStudioId);
    await input.router.push(buildInterviewStudioNavigation(studioId));
  }

  return {
    closeStudioPreview,
    openStudioPreview,
    startInterview,
    viewStudio,
  };
}

function createStudiosIndexDerivedState(input: ReturnType<typeof createStudiosIndexRuntime>) {
  const debouncedSearchQuery = useDebouncedValue(
    input.searchQuery,
    STUDIO_INDEX_FILTER_DEBOUNCE_MS,
  );
  const filterOptions = createStudiosIndexFilterOptions(input.studios);
  const filterResults = createStudiosFilteredResults({
    debouncedSearchQuery,
    filters: input.filters,
    studios: input.studios,
  });
  const loading = computed(() => input.studioLoading.value);
  const totalStudios = computed(() => input.studios.value.length);
  const remoteFriendlyStudios = computed(
    () => input.studios.value.filter((studio) => studio.remoteWork).length,
  );
  const previewStudio = computed(
    () => input.studios.value.find((studio) => studio.id === input.previewStudioId.value) ?? null,
  );
  const routeStudioId = computed(() =>
    queryValueToString(input.route.query[APP_ROUTE_QUERY_KEYS.studioId]),
  );
  const visibleStudios = computed(() =>
    filterResults.filteredStudios.value.slice(0, input.visibleStudioCount.value),
  );
  const hasAdditionalStudios = computed(
    () => visibleStudios.value.length < filterResults.filteredStudios.value.length,
  );

  return {
    debouncedSearchQuery,
    filteredStudios: filterResults.filteredStudios,
    hasAdditionalStudios,
    loading,
    previewStudio,
    remoteFriendlyStudios,
    routeStudioId,
    studioSizeOptions: filterOptions.studioSizeOptions,
    studioTypeOptions: filterOptions.studioTypeOptions,
    totalStudios,
    visibleStudios,
  };
}

function createStudiosIndexFilterOptions(studios: ReturnType<typeof useStudio>["studios"]) {
  const studioTypeOptions = computed(() =>
    sortUniqueOptions(studios.value.map((studio) => studio.type)),
  );
  const studioSizeOptions = computed(() =>
    sortUniqueOptions(studios.value.map((studio) => studio.size)),
  );

  return {
    studioSizeOptions,
    studioTypeOptions,
  };
}

function createStudiosFilteredResults(input: {
  debouncedSearchQuery: Ref<string>;
  filters: {
    remoteWork: boolean;
    size: string;
    type: string;
  };
  studios: ReturnType<typeof useStudio>["studios"];
}) {
  const searchableStudios = computed(() =>
    input.studios.value.map((studio) => ({
      searchableText: `${studio.name} ${studio.description ?? ""} ${studio.location}`.toLowerCase(),
      studio,
    })),
  );
  const filteredStudios = computed(() =>
    filterStudios({
      entries: searchableStudios.value,
      filters: input.filters,
      query: input.debouncedSearchQuery.value,
    }),
  );

  return {
    filteredStudios,
  };
}

function filterStudios(input: {
  entries: Array<{
    searchableText: string;
    studio: ReturnType<typeof useStudio>["studios"]["value"][number];
  }>;
  filters: {
    remoteWork: boolean;
    size: string;
    type: string;
  };
  query: string;
}) {
  let result = input.entries;

  const query = input.query.trim().toLowerCase();
  if (query.length > 0) {
    result = result.filter((entry) => entry.searchableText.includes(query));
  }
  if (input.filters.type.length > 0) {
    result = result.filter((entry) => entry.studio.type === input.filters.type);
  }
  if (input.filters.size.length > 0) {
    result = result.filter((entry) => entry.studio.size === input.filters.size);
  }
  if (input.filters.remoteWork) {
    result = result.filter((entry) => entry.studio.remoteWork);
  }

  return result.map((entry) => entry.studio);
}

function registerStudiosIndexEffects(input: {
  derived: ReturnType<typeof createStudiosIndexDerivedState>;
  runtime: ReturnType<typeof createStudiosIndexRuntime>;
}) {
  watch(
    () => ({
      remoteWork: input.runtime.filters.remoteWork,
      search: input.derived.debouncedSearchQuery.value,
      size: input.runtime.filters.size,
      type: input.runtime.filters.type,
    }),
    () => {
      input.runtime.visibleStudioCount.value = STUDIO_INDEX_INITIAL_VISIBLE_COUNT;
    },
  );

  watch(input.derived.filteredStudios, (nextStudios) => {
    if (nextStudios.length < input.runtime.visibleStudioCount.value) {
      input.runtime.visibleStudioCount.value = nextStudios.length;
    }
  });

  watch(
    input.derived.routeStudioId,
    (studioId) => {
      if (!studioId) {
        input.runtime.showPreviewModal.value = false;
        input.runtime.previewStudioId.value = "";
        return;
      }

      input.runtime.previewStudioId.value = studioId;
      input.runtime.showPreviewModal.value = true;
    },
    { immediate: true },
  );
}

export function useStudiosIndexPage() {
  const runtime = createStudiosIndexRuntime();
  const actions = createStudiosIndexActions(runtime);
  const derived = createStudiosIndexDerivedState(runtime);
  registerStudiosIndexEffects({
    derived,
    runtime,
  });

  return {
    clearFilters: actions.clearFilters,
    closeStudioPreview: () => actions.closeStudioPreview(derived.routeStudioId.value),
    filteredStudios: derived.filteredStudios,
    filters: runtime.filters,
    hasAdditionalStudios: derived.hasAdditionalStudios,
    loadStudios: actions.loadStudios,
    loading: derived.loading,
    openStudioPreview: actions.openStudioPreview,
    pageError: runtime.pageError,
    previewStudio: derived.previewStudio,
    remoteFriendlyStudios: derived.remoteFriendlyStudios,
    searchQuery: runtime.searchQuery,
    showMoreStudios: () => actions.showMoreStudios(derived.filteredStudios.value.length),
    showPreviewModal: runtime.showPreviewModal,
    startInterview: (studioId: string) =>
      actions.startInterview(studioId, derived.routeStudioId.value),
    studioSizeOptions: derived.studioSizeOptions,
    studioTypeOptions: derived.studioTypeOptions,
    totalStudios: derived.totalStudios,
    viewStudio: (id: string) => actions.viewStudio(id, derived.routeStudioId.value),
    visibleStudios: derived.visibleStudios,
  };
}
