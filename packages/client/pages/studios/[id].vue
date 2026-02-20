<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { buildInterviewStudioNavigation } from "~/utils/interview-navigation";
import { getErrorMessage } from "~/utils/errors";

const { $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { studio, loading: studioLoading, fetchStudioById } = useStudio();

const pageError = ref<string | null>(null);
const studioId = computed(() => {
  const routeParam = route.params.id;
  if (typeof routeParam === "string") return routeParam;
  if (Array.isArray(routeParam)) {
    const [firstValue] = routeParam;
    return typeof firstValue === "string" ? firstValue : "";
  }
  return "";
});
const loading = computed(() => bootstrapPending.value || studioLoading.value);
const studioInitial = computed(() => studio.value?.name?.charAt(0) ?? "?");
const cultureValues = computed(() => studio.value?.culture.values ?? []);
const cultureWorkStyle = computed(() => studio.value?.culture.workStyle?.trim() || t("studioDetail.noCultureWorkStyle"));
const cultureEnvironment = computed(() => studio.value?.culture.environment?.trim() || "");
const breadcrumbs = computed(() => [
  { label: t("studioDetail.breadcrumbs.dashboard"), to: APP_ROUTES.dashboard },
  { label: t("studioDetail.breadcrumbs.studios"), to: APP_ROUTES.studios },
  { label: studio.value?.name || t("studioDetail.breadcrumbs.detail") },
]);

function showErrorToast(message: string) {
  if (import.meta.client) {
    $toast.error(message);
  }
}

const { pending: bootstrapPending, refresh: refreshStudio } = await useAsyncData(
  computed(() => `studio-detail-${studioId.value || "unknown"}`),
  async () => {
    if (!studioId.value) {
      pageError.value = t("studioDetail.errors.invalidStudioId");
      return null;
    }

    await loadStudio();
    return studio.value;
  },
);

async function loadStudio() {
  pageError.value = null;
  try {
    await fetchStudioById(studioId.value);
    if (!studio.value) {
      pageError.value = t("studioDetail.errors.notFound");
      showErrorToast(pageError.value);
    }
  } catch (error) {
    pageError.value = getErrorMessage(error, t("studioDetail.errors.loadFailed"));
    showErrorToast(pageError.value);
  }
}

function startPracticeInterview() {
  if (!studioId.value) return;
  router.push(buildInterviewStudioNavigation(studioId.value));
}

function remoteWorkLabel(remoteWork: boolean | undefined): string {
  return remoteWork ? t("studioDetail.remoteLabels.yes") : t("studioDetail.remoteLabels.no");
}

function studioField(value: string | undefined): string {
  return value?.trim() || t("studioDetail.unknownValue");
}
</script>

<template>
  <div>
    <AppBreadcrumbs :crumbs="breadcrumbs" class="mb-6" />

    <div v-if="pageError" class="alert alert-error mb-6" role="alert" :aria-label="t('studioDetail.errorBannerAria')">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ pageError }}</span>
      <button class="btn btn-sm" :aria-label="t('studioDetail.retryAria')" @click="refreshStudio()">
        {{ t("studioDetail.retryButton") }}
      </button>
    </div>

    <LoadingSkeleton v-else-if="loading" :lines="10" />

    <div v-else-if="studio" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Header -->
        <div class="card bg-base-200">
          <div class="card-body">
            <div class="flex items-start gap-4">
              <div class="avatar placeholder">
                <div class="bg-neutral text-neutral-content rounded-full w-20">
                  <span class="text-3xl">{{ studioInitial }}</span>
                </div>
              </div>
              <div class="flex-1">
                <h1 class="text-3xl font-bold mb-2">{{ studio.name }}</h1>
                <p class="text-base-content/70 mb-3">{{ studio.description || t("studioDetail.noDescription") }}</p>
                <div class="flex flex-wrap gap-2">
                  <span class="badge badge-primary">{{ studioField(studio.type) }}</span>
                  <span class="badge">{{ studioField(studio.size) }}</span>
                  <span v-if="studio.remoteWork" class="badge badge-success">
                    {{ t("studioDetail.remoteFriendlyBadge") }}
                  </span>
                </div>
              </div>
            </div>

            <div class="card-actions mt-4">
              <button class="btn btn-primary" :aria-label="t('studioDetail.practiceInterviewAria')" @click="startPracticeInterview">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ t("studioDetail.practiceInterviewButton") }}
              </button>

              <a
                v-if="studio.website"
                :href="studio.website"
                target="_blank"
                rel="noreferrer"
                class="btn btn-outline"
                :aria-label="t('studioDetail.visitWebsiteAria', { studio: studio.name })"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                {{ t("studioDetail.visitWebsiteButton") }}
              </a>
            </div>
          </div>
        </div>

        <!-- Culture -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">{{ t("studioDetail.sections.culture") }}</h2>
            <div class="space-y-3">
              <div>
                <p class="text-xs text-base-content/60">{{ t("studioDetail.culture.workStyleLabel") }}</p>
                <p>{{ cultureWorkStyle }}</p>
              </div>

              <div v-if="cultureEnvironment">
                <p class="text-xs text-base-content/60">{{ t("studioDetail.culture.environmentLabel") }}</p>
                <p>{{ cultureEnvironment }}</p>
              </div>

              <div v-if="cultureValues.length > 0">
                <p class="text-xs text-base-content/60">{{ t("studioDetail.culture.valuesLabel") }}</p>
                <div class="flex flex-wrap gap-2 mt-1">
                  <span v-for="value in cultureValues" :key="value" class="badge badge-outline badge-sm">
                    {{ value }}
                  </span>
                </div>
              </div>

              <p v-else class="text-sm text-base-content/70">
                {{ t("studioDetail.culture.noValues") }}
              </p>
            </div>
          </div>
        </div>

        <!-- Interview Style -->
        <div v-if="studio.interviewStyle" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">{{ t("studioDetail.sections.interviewProcess") }}</h2>
            <p>{{ studio.interviewStyle }}</p>
          </div>
        </div>

        <!-- Technologies -->
        <div v-if="studio.technologies?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">{{ t("studioDetail.sections.technologies") }}</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tech in studio.technologies"
                :key="tech"
                class="badge badge-lg badge-primary"
              >
                {{ tech }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Info -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">{{ t("studioDetail.sections.info") }}</h2>

            <div class="space-y-3">
              <div>
                <p class="text-xs text-base-content/60">{{ t("studioDetail.info.locationLabel") }}</p>
                <p class="font-medium">{{ studioField(studio.location) }}</p>
              </div>

              <div>
                <p class="text-xs text-base-content/60">{{ t("studioDetail.info.studioTypeLabel") }}</p>
                <p class="font-medium">{{ studioField(studio.type) }}</p>
              </div>

              <div>
                <p class="text-xs text-base-content/60">{{ t("studioDetail.info.companySizeLabel") }}</p>
                <p class="font-medium">{{ studioField(studio.size) }}</p>
              </div>

              <div>
                <p class="text-xs text-base-content/60">{{ t("studioDetail.info.remoteWorkLabel") }}</p>
                <p class="font-medium">{{ remoteWorkLabel(studio.remoteWork) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Notable Games -->
        <div v-if="studio.games?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">{{ t("studioDetail.sections.notableGames") }}</h2>
            <ul class="space-y-2">
              <li v-for="game in studio.games" :key="game" class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {{ game }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
