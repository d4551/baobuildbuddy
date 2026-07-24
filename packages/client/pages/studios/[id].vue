<script setup lang="ts">
defineOptions({ name: "PagesStudiosDetailPage" });

import {
  FLEX_GAP_TOKEN_CLASS,
  FORM_WIDTH_20_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  PRIMARY_ACTION_CLASS,
  RADIUS_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  STATS_SHELL_VARIANT_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_OUTLINE_SM_CLASS,
  BADGE_PRIMARY_CLASS,
  BADGE_PRIMARY_LG_CLASS,
  BADGE_SUCCESS_CLASS,
} from "~/constants/layout-badges";

definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";
import { buildInterviewStudioNavigation } from "~/utils/interview-navigation";
import { studioSizeLabel, studioTypeLabel } from "~/utils/labels";

const { $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { studio, loading: studioLoading, fetchStudioById } = useStudio();

useSeoMeta({
  title: t("studioDetail.breadcrumbs.detail"),
  description: t("studiosIndex.seoDescription"),
});

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
const cultureWorkStyle = computed(
  () => studio.value?.culture.workStyle?.trim() || t("studioDetail.noCultureWorkStyle"),
);
const cultureEnvironment = computed(() => studio.value?.culture.environment?.trim() || "");
const breadcrumbs = computed(() => [
  { label: t("studioDetail.breadcrumbs.dashboard"), to: APP_ROUTES.dashboard },
  { label: t("studioDetail.breadcrumbs.studios"), to: APP_ROUTES.studios },
  { label: studio.value?.name || t("studioDetail.breadcrumbs.detail") },
]);
const detailTitle = computed(() => studio.value?.name || t("studioDetail.breadcrumbs.detail"));
const detailDescription = computed(
  () => studio.value?.description?.trim() || t("studioDetail.noDescription"),
);
const studioSummaryTitle = computed(() => t("studioDetail.sections.info"));

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
  const studioResult = await settlePromise(
    fetchStudioById(studioId.value),
    t("studioDetail.errors.loadFailed"),
  );
  if (!studioResult.ok) {
    pageError.value = getErrorMessage(studioResult.error, t("studioDetail.errors.loadFailed"));
    showErrorToast(pageError.value);
    return;
  }

  if (!studio.value) {
    pageError.value = t("studioDetail.errors.notFound");
    showErrorToast(pageError.value);
  }
}

async function startPracticeInterview() {
  if (!studioId.value) return;
  await router.push(buildInterviewStudioNavigation(studioId.value));
}

function remoteWorkLabel(remoteWork: boolean | undefined): string {
  return remoteWork ? t("studioDetail.remoteLabels.yes") : t("studioDetail.remoteLabels.no");
}

function studioDetailLocation(location: string | undefined): string {
  return location?.trim() || t("studioDetail.unknownLocation");
}
</script>

<template>
  <PageScaffold
    tag="section"
    width-token="content"
    spacing-token="comfortable"
    labelled-by="studio-detail-title"
  >
    <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
      <AppBreadcrumbs :crumbs="breadcrumbs" />
      <PageHeroHeader
        title-id="studio-detail-title"
        :title="detailTitle"
        :description="detailDescription"
        density="comfortable"
      >
        <template #actions>
          <button type="button"
            :class="[PRIMARY_ACTION_CLASS]"
            :disabled="!studio"
            :aria-label="t('studioDetail.practiceInterviewAria')"
            @click="startPracticeInterview"
          >
            <svg :class="ICON_SIZE_CLASS.sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ t("studioDetail.practiceInterviewButton") }}
          </button>
          <a
            v-if="studio?.website"
            :href="studio.website"
            target="_blank"
            rel="noopener noreferrer"
            :class="[OUTLINE_ACTION_CLASS]"
            :aria-label="t('studioDetail.visitWebsiteAria', { studio: studio.name })"
          >
            <IconGlobe :class="ICON_SIZE_CLASS.sm" />
            {{ t("studioDetail.visitWebsiteButton") }}
          </a>
        </template>
        <template #aside>
          <UiGlassCard>
            <div class="card-body">
              <div class="flex items-start" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
                <div class="avatar placeholder">
                  <div class="bg-base-300 text-base-content" :class="[FORM_WIDTH_20_CLASS, RADIUS_TOKEN_CLASS.full]">
                    <span :class="[TYPOGRAPHY_SCALE_CLASS.xl3]">{{ studioInitial }}</span>
                  </div>
                </div>
                <div class="flex-1" :class="[TRUNCATE_FLEX_CHILD_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack3]">
                  <div>
                    <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ studioSummaryTitle }}</h2>
                  </div>
                  <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                    <span :class="[BADGE_PRIMARY_CLASS]">{{ studioTypeLabel(t, studio?.type) }}</span>
                    <span class="badge">{{ studioSizeLabel(t, studio?.size) }}</span>
                    <span v-if="studio?.remoteWork" :class="[BADGE_SUCCESS_CLASS]">
                      {{ t("studioDetail.remoteFriendlyBadge") }}
                    </span>
                  </div>
                  <div :class="[STATS_SHELL_VARIANT_CLASS.sm]">
                    <div class="stat">
                      <div class="stat-title">{{ t("studioDetail.info.locationLabel") }}</div>
                      <div class="stat-value text-base">
                        {{ studioDetailLocation(studio?.location) }}
                      </div>
                      <div class="stat-desc">{{ t("studioDetail.sections.info") }}</div>
                    </div>
                    <div class="stat">
                      <div class="stat-title">{{ t("studioDetail.info.companySizeLabel") }}</div>
                      <div class="stat-value text-base">
                        {{ studioSizeLabel(t, studio?.size) }}
                      </div>
                      <div class="stat-desc">{{ t("studioDetail.info.studioTypeLabel") }}</div>
                    </div>
                    <div class="stat">
                      <div class="stat-title">{{ t("studioDetail.info.remoteWorkLabel") }}</div>
                      <div class="stat-value text-base">
                        {{ remoteWorkLabel(studio?.remoteWork) }}
                      </div>
                      <div class="stat-desc">{{ studioTypeLabel(t, studio?.type) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UiGlassCard>
        </template>
      </PageHeroHeader>
    </div>

    <LoadingSkeleton v-if="loading" :lines="10" />

    <BootstrapErrorAlert
      v-else-if="pageError"
      :title="t('studioDetail.breadcrumbs.detail')"
      :message="pageError"
      :retry-label="t('studioDetail.retryButton')"
      :retry-aria-label="t('studioDetail.retryAria')"
      @retry="() => refreshStudio()"
    />

    <EmptyState
      v-else-if="!studio"
      title-key="studioDetail.emptyTitle"
      description-key="studioDetail.emptyDescription"
      cta-label-key="studioDetail.browseDirectoryButton"
      cta-aria-key="studioDetail.browseDirectoryAria"
      :cta-to="APP_ROUTES.studios"
    />

    <SectionGrid v-else grid-token="threeColumnLg">
      <div class="lg:col-span-2" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
        <UiGlassCard>
          <div class="card-body">
            <h2 class="card-title">{{ t("studioDetail.sections.culture") }}</h2>
            <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
              <div>
                <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("studioDetail.culture.workStyleLabel") }}</p>
                <p>{{ cultureWorkStyle }}</p>
              </div>
              <div v-if="cultureEnvironment">
                <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("studioDetail.culture.environmentLabel") }}</p>
                <p>{{ cultureEnvironment }}</p>
              </div>
              <div v-if="cultureValues.length > 0">
                <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("studioDetail.culture.valuesLabel") }}</p>
                <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt1]">
                  <span v-for="value in cultureValues" :key="value" :class="[BADGE_OUTLINE_SM_CLASS]">
                    {{ value }}
                  </span>
                </div>
              </div>
              <p v-else class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("studioDetail.culture.noValues") }}
              </p>
            </div>
          </div>
        </UiGlassCard>

        <UiGlassCard v-if="studio.interviewStyle">
          <div class="card-body">
            <h2 class="card-title">{{ t("studioDetail.sections.interviewProcess") }}</h2>
            <p>{{ studio.interviewStyle }}</p>
          </div>
        </UiGlassCard>

        <UiGlassCard v-if="studio.technologies?.length">
          <div class="card-body">
            <h2 class="card-title">{{ t("studioDetail.sections.technologies") }}</h2>
            <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span v-for="tech in studio.technologies" :key="tech" :class="[BADGE_PRIMARY_LG_CLASS]">
                {{ tech }}
              </span>
            </div>
          </div>
        </UiGlassCard>
      </div>

      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
        <UiGlassCard v-if="studio.games?.length">
          <div class="card-body">
            <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t("studioDetail.sections.notableGames") }}</h2>
            <ul :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
              <li v-for="game in studio.games" :key="game" class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                <svg :class="[ICON_SIZE_CLASS['4'], 'text-primary']" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {{ game }}
              </li>
            </ul>
          </div>
        </UiGlassCard>
      </div>
    </SectionGrid>
  </PageScaffold>
</template>
