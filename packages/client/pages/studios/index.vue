<script setup lang="ts">
import { APP_ROUTE_BUILDERS, APP_ROUTE_QUERY_KEYS } from "@bao/shared";
import { useI18n } from "vue-i18n";
import {
  STUDIO_INDEX_FILTER_DEBOUNCE_MS,
  STUDIO_INDEX_INITIAL_VISIBLE_COUNT,
  STUDIO_INDEX_VISIBLE_INCREMENT,
} from "~/constants/studios";
import { useDebouncedValue } from "~/composables/useDebouncedValue";
import { buildInterviewStudioNavigation } from "~/utils/interview-navigation";
import { getErrorMessage } from "~/utils/errors";

const { $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { studios, loading: studioLoading, fetchStudios } = useStudio();

const pageError = ref<string | null>(null);
const searchQuery = ref("");
const debouncedSearchQuery = useDebouncedValue(
  searchQuery,
  STUDIO_INDEX_FILTER_DEBOUNCE_MS,
);
const previewDialogRef = ref<HTMLDialogElement | null>(null);
useFocusTrap(previewDialogRef, () => showPreviewModal.value);
const showPreviewModal = ref(false);
const previewStudioId = ref("");
const visibleStudioCount = ref(STUDIO_INDEX_INITIAL_VISIBLE_COUNT);
const filters = reactive({
  type: "",
  size: "",
  remoteWork: false,
});

function showErrorToast(message: string) {
  if (import.meta.client) {
    $toast.error(message);
  }
}

async function loadStudios() {
  pageError.value = null;
  try {
    await fetchStudios();
  } catch (error) {
    pageError.value = getErrorMessage(error, t("studiosIndex.errors.loadFailed"));
    showErrorToast(pageError.value);
  }
}

const { pending: bootstrapPending, refresh: refreshStudios } = await useAsyncData(
  "studios-index",
  async () => {
    await loadStudios();
    return true;
  },
);

const loading = computed(() => bootstrapPending.value || studioLoading.value);

const studioTypeOptions = computed(() =>
  [...new Set(studios.value.map((studio) => studio.type).filter((value) => value.trim().length > 0))]
    .sort((left, right) => left.localeCompare(right)),
);

const studioSizeOptions = computed(() =>
  [...new Set(studios.value.map((studio) => studio.size).filter((value) => value.trim().length > 0))]
    .sort((left, right) => left.localeCompare(right)),
);

const totalStudios = computed(() => studios.value.length);
const remoteFriendlyStudios = computed(
  () => studios.value.filter((studio) => studio.remoteWork).length,
);
const previewStudio = computed(() =>
  studios.value.find((studio) => studio.id === previewStudioId.value) ?? null,
);
const routeStudioId = computed(() =>
  queryValueToString(route.query[APP_ROUTE_QUERY_KEYS.studioId]),
);
const searchableStudios = computed(() =>
  studios.value.map((studio) => ({
    studio,
    searchableText:
      `${studio.name} ${studio.description ?? ""} ${studio.location}`.toLowerCase(),
  })),
);

const filteredStudios = computed(() => {
  let result = searchableStudios.value;

  const query = debouncedSearchQuery.value.trim().toLowerCase();
  if (query.length > 0) {
    result = result.filter((entry) => entry.searchableText.includes(query));
  }

  if (filters.type.length > 0) {
    result = result.filter((entry) => entry.studio.type === filters.type);
  }

  if (filters.size.length > 0) {
    result = result.filter((entry) => entry.studio.size === filters.size);
  }

  if (filters.remoteWork) {
    result = result.filter((entry) => entry.studio.remoteWork);
  }

  return result.map((entry) => entry.studio);
});

const visibleStudios = computed(() =>
  filteredStudios.value.slice(0, visibleStudioCount.value),
);
const hasAdditionalStudios = computed(
  () => visibleStudios.value.length < filteredStudios.value.length,
);

function studioInitial(name: string): string {
  const normalized = name.trim();
  if (normalized.length === 0) return "?";
  return normalized[0]?.toUpperCase() ?? "?";
}

function studioDescription(description: string | undefined): string {
  return description?.trim() || t("studiosIndex.card.noDescription");
}

function studioLocation(location: string): string {
  return location.trim() || t("studiosIndex.card.unknownLocation");
}

function studioType(type: string): string {
  return type.trim() || t("studiosIndex.card.unknownType");
}

function studioSize(size: string): string {
  return size.trim() || t("studiosIndex.card.unknownSize");
}

function clearFilters() {
  searchQuery.value = "";
  filters.type = "";
  filters.size = "";
  filters.remoteWork = false;
  visibleStudioCount.value = STUDIO_INDEX_INITIAL_VISIBLE_COUNT;
}

function showMoreStudios() {
  visibleStudioCount.value = Math.min(
    filteredStudios.value.length,
    visibleStudioCount.value + STUDIO_INDEX_VISIBLE_INCREMENT,
  );
}

function queryValueToString(
  value: string | string[] | null | undefined,
): string {
  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string" ? firstValue : "";
  }
  return typeof value === "string" ? value : "";
}

function syncPreviewDialog() {
  const dialog = previewDialogRef.value;
  if (!dialog) return;

  if (showPreviewModal.value && !dialog.open) {
    dialog.showModal();
    return;
  }

  if (!showPreviewModal.value && dialog.open) {
    dialog.close();
  }
}

async function setPreviewRouteStudioId(id: string | null): Promise<void> {
  const nextQuery = { ...route.query };
  if (id) {
    nextQuery[APP_ROUTE_QUERY_KEYS.studioId] = id;
  } else {
    delete nextQuery[APP_ROUTE_QUERY_KEYS.studioId];
  }
  await router.replace({ query: nextQuery });
}

function openStudioPreview(id: string) {
  previewStudioId.value = id;
  showPreviewModal.value = true;
  void setPreviewRouteStudioId(id);
}

function handlePreviewDialogClose() {
  showPreviewModal.value = false;
  previewStudioId.value = "";
  if (routeStudioId.value) {
    void setPreviewRouteStudioId(null);
  }
}

function closeStudioPreview() {
  showPreviewModal.value = false;
  previewStudioId.value = "";
  if (routeStudioId.value) {
    void setPreviewRouteStudioId(null);
  }
}

function viewStudio(id: string) {
  closeStudioPreview();
  router.push(APP_ROUTE_BUILDERS.studioDetail(id));
}

function startInterview(studioId: string) {
  closeStudioPreview();
  router.push(buildInterviewStudioNavigation(studioId));
}

watch(showPreviewModal, syncPreviewDialog);

watch(
  () => ({
    search: debouncedSearchQuery.value,
    type: filters.type,
    size: filters.size,
    remoteWork: filters.remoteWork,
  }),
  () => {
    visibleStudioCount.value = STUDIO_INDEX_INITIAL_VISIBLE_COUNT;
  },
);

watch(filteredStudios, (nextStudios) => {
  if (nextStudios.length < visibleStudioCount.value) {
    visibleStudioCount.value = nextStudios.length;
  }
});

watch(
  routeStudioId,
  (studioId) => {
    if (!studioId) {
      showPreviewModal.value = false;
      previewStudioId.value = "";
      return;
    }

    previewStudioId.value = studioId;
    showPreviewModal.value = true;
  },
  { immediate: true },
);

onMounted(syncPreviewDialog);
</script>

<template>
  <div class="space-y-6">
    <section class="hero rounded-box bg-base-200 border border-base-300">
      <div class="hero-content w-full flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-2xl space-y-3">
          <h1 class="text-3xl font-bold md:text-4xl">{{ t("studiosIndex.title") }}</h1>
          <p class="text-base-content/70">{{ t("studiosIndex.subtitle") }}</p>
        </div>
      </div>
    </section>

    <div class="stats stats-vertical lg:stats-horizontal w-full border border-base-300 bg-base-100 shadow-sm">
      <div class="stat">
        <div class="stat-title">{{ t("studiosIndex.stats.totalTitle") }}</div>
        <div class="stat-value text-primary">{{ totalStudios }}</div>
        <div class="stat-desc">{{ t("studiosIndex.stats.totalDesc") }}</div>
      </div>

      <div class="stat">
        <div class="stat-title">{{ t("studiosIndex.stats.filteredTitle") }}</div>
        <div class="stat-value text-secondary">{{ filteredStudios.length }}</div>
        <div class="stat-desc">{{ t("studiosIndex.stats.filteredDesc") }}</div>
      </div>

      <div class="stat">
        <div class="stat-title">{{ t("studiosIndex.stats.remoteTitle") }}</div>
        <div class="stat-value text-accent">{{ remoteFriendlyStudios }}</div>
        <div class="stat-desc">{{ t("studiosIndex.stats.remoteDesc") }}</div>
      </div>
    </div>

    <div v-if="pageError" class="alert alert-error" role="alert" :aria-label="t('studiosIndex.errorBannerAria')">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ pageError }}</span>
      <button class="btn btn-sm" :aria-label="t('studiosIndex.retryAria')" @click="refreshStudios()">
        {{ t("studiosIndex.retryButton") }}
      </button>
    </div>

    <div class="card card-border bg-base-100">
      <div class="card-body gap-4">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <fieldset class="fieldset lg:col-span-2">
            <legend class="fieldset-legend">{{ t("studiosIndex.filters.searchLegend") }}</legend>
            <input
              v-model="searchQuery"
              type="search"
              class="input w-full"
              :placeholder="t('studiosIndex.filters.searchPlaceholder')"
              :aria-label="t('studiosIndex.filters.searchAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("studiosIndex.filters.typeLegend") }}</legend>
            <select
              v-model="filters.type"
              class="select w-full"
              :aria-label="t('studiosIndex.filters.typeAria')"
            >
              <option value="">{{ t("studiosIndex.filters.allTypesOption") }}</option>
              <option v-for="type in studioTypeOptions" :key="type" :value="type">{{ type }}</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("studiosIndex.filters.sizeLegend") }}</legend>
            <select
              v-model="filters.size"
              class="select w-full"
              :aria-label="t('studiosIndex.filters.sizeAria')"
            >
              <option value="">{{ t("studiosIndex.filters.allSizesOption") }}</option>
              <option v-for="size in studioSizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
          </fieldset>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <label class="label cursor-pointer justify-start gap-2 py-0">
            <input
              v-model="filters.remoteWork"
              type="checkbox"
              class="toggle toggle-primary toggle-sm"
              :aria-label="t('studiosIndex.filters.remoteAria')"
            />
            <span class="label-text">{{ t("studiosIndex.filters.remoteLabel") }}</span>
          </label>

          <button class="btn btn-ghost btn-sm" :aria-label="t('studiosIndex.filters.clearAria')" @click="clearFilters">
            {{ t("studiosIndex.filters.clearButton") }}
          </button>
        </div>
      </div>
    </div>

    <LoadingSkeleton v-if="loading && studios.length === 0" :lines="6" />

    <div v-else-if="filteredStudios.length === 0" class="alert alert-info alert-soft" role="status" aria-live="polite">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ t("studiosIndex.emptyState") }}</span>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <article
        v-for="studio in visibleStudios"
        :key="studio.id"
        class="card card-border bg-base-100 hover:shadow-md transition-shadow"
      >
        <div class="card-body gap-3">
          <div class="flex items-center gap-3">
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-12">
                <span class="text-xl">{{ studioInitial(studio.name) }}</span>
              </div>
            </div>
            <div class="min-w-0">
              <h2 class="card-title text-lg truncate">{{ studio.name }}</h2>
              <p class="text-xs text-base-content/60 truncate">{{ studioLocation(studio.location) }}</p>
            </div>
          </div>

          <p class="text-sm text-base-content/70 min-h-14">
            {{ studioDescription(studio.description) }}
          </p>

          <div class="flex flex-wrap gap-2">
            <span class="badge badge-primary badge-sm">{{ studioType(studio.type) }}</span>
            <span class="badge badge-outline badge-sm">{{ studioSize(studio.size) }}</span>
            <span v-if="studio.remoteWork" class="badge badge-success badge-sm">
              {{ t("studiosIndex.card.remoteBadge") }}
            </span>
          </div>

          <div class="card-actions justify-end mt-1">
            <button
              class="btn btn-ghost btn-sm"
              :aria-label="t('studiosIndex.card.previewAria', { studio: studio.name })"
              @click="openStudioPreview(studio.id)"
            >
              {{ t("studiosIndex.card.previewButton") }}
            </button>
            <button
              class="btn btn-primary btn-sm"
              :aria-label="t('studiosIndex.card.viewAria', { studio: studio.name })"
              @click="viewStudio(studio.id)"
            >
              {{ t("studiosIndex.card.viewButton") }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <div
      v-if="hasAdditionalStudios"
      class="flex justify-center"
    >
      <button
        type="button"
        class="btn btn-outline"
        :aria-label="t('studiosIndex.list.loadMoreAria')"
        @click="showMoreStudios"
      >
        {{ t("studiosIndex.list.loadMoreButton") }}
      </button>
    </div>

    <dialog
      ref="previewDialogRef"
      class="modal modal-bottom sm:modal-middle"
      :aria-label="t('studiosIndex.preview.dialogAria')"
      @close="handlePreviewDialogClose"
    >
      <div class="modal-box w-11/12 max-w-4xl">
        <form method="dialog">
          <button
            type="button"
            class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            :aria-label="t('studiosIndex.preview.closeButtonAria')"
            @click="closeStudioPreview"
          >
            ✕
          </button>
        </form>

        <template v-if="previewStudio">
          <h3 class="text-xl font-bold">{{ previewStudio.name }}</h3>
          <p class="mt-2 text-sm text-base-content/70">
            {{ studioDescription(previewStudio.description) }}
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <span class="badge badge-primary">{{ studioType(previewStudio.type) }}</span>
            <span class="badge badge-outline">{{ studioSize(previewStudio.size) }}</span>
            <span class="badge badge-ghost">{{ studioLocation(previewStudio.location) }}</span>
            <span v-if="previewStudio.remoteWork" class="badge badge-success">
              {{ t("studiosIndex.card.remoteBadge") }}
            </span>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="stat rounded-box border border-base-300 bg-base-100">
              <div class="stat-title">{{ t("studiosIndex.preview.stats.interviewReadyTitle") }}</div>
              <div class="stat-value text-primary text-2xl">{{ t("studiosIndex.preview.stats.interviewReadyValue") }}</div>
              <div class="stat-desc">{{ t("studiosIndex.preview.stats.interviewReadyDesc") }}</div>
            </div>
            <div class="stat rounded-box border border-base-300 bg-base-100">
              <div class="stat-title">{{ t("studiosIndex.preview.stats.locationTitle") }}</div>
              <div class="stat-value text-secondary text-lg">
                {{ studioLocation(previewStudio.location) }}
              </div>
              <div class="stat-desc">{{ t("studiosIndex.preview.stats.locationDesc") }}</div>
            </div>
            <div class="stat rounded-box border border-base-300 bg-base-100">
              <div class="stat-title">{{ t("studiosIndex.preview.stats.remoteTitle") }}</div>
              <div class="stat-value text-accent text-lg">
                {{ previewStudio.remoteWork ? t("studiosIndex.preview.remoteYes") : t("studiosIndex.preview.remoteNo") }}
              </div>
              <div class="stat-desc">{{ t("studiosIndex.preview.stats.remoteDesc") }}</div>
            </div>
          </div>

          <div class="modal-action">
            <button
              type="button"
              class="btn btn-primary"
              :aria-label="t('studiosIndex.preview.startInterviewAria', { studio: previewStudio.name })"
              @click="startInterview(previewStudio.id)"
            >
              {{ t("studiosIndex.preview.startInterviewButton") }}
            </button>
            <button
              type="button"
              class="btn btn-outline"
              :aria-label="t('studiosIndex.preview.openDetailAria', { studio: previewStudio.name })"
              @click="viewStudio(previewStudio.id)"
            >
              {{ t("studiosIndex.preview.openDetailButton") }}
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              :aria-label="t('studiosIndex.preview.closeButtonAria')"
              @click="closeStudioPreview"
            >
              {{ t("studiosIndex.preview.closeButton") }}
            </button>
          </div>
        </template>

        <template v-else>
          <h3 class="text-xl font-bold">{{ t("studiosIndex.preview.missingTitle") }}</h3>
          <p class="mt-2 text-sm text-base-content/70">
            {{ t("studiosIndex.preview.missingDescription") }}
          </p>
          <div class="modal-action">
            <button
              type="button"
              class="btn btn-primary"
              :aria-label="t('studiosIndex.preview.closeButtonAria')"
              @click="closeStudioPreview"
            >
              {{ t("studiosIndex.preview.closeButton") }}
            </button>
          </div>
        </template>
      </div>

      <form method="dialog" class="modal-backdrop">
        <button
          type="button"
          :aria-label="t('studiosIndex.preview.closeBackdropAria')"
          @click="closeStudioPreview"
        >
          {{ t("studiosIndex.preview.closeBackdropButton") }}
        </button>
      </form>
    </dialog>
  </div>
</template>
