<script setup lang="ts">
import type { ReadinessAssessment } from "@bao/shared";
import { APP_ROUTES } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { getGamificationPathwayIcon } from "@bao/shared";
import {
  SKILLS_READINESS_THRESHOLD_HIGH,
  SKILLS_READINESS_THRESHOLD_MEDIUM,
  SKILLS_READINESS_DIAL_SIZE_REM,
  SKILLS_READINESS_MAX,
  SKILLS_READINESS_MIN,
} from "~/constants/skills";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});

type ReadinessCategoryKey = "technical" | "softSkills" | "industryKnowledge" | "portfolio";

interface ReadinessCategoryStat {
  readonly key: ReadinessCategoryKey;
  readonly score: number;
  readonly feedback: string;
}

const READINESS_CATEGORY_LABEL_KEYS: Record<ReadinessCategoryKey, string> = {
  technical: "skillsPathwaysPage.categories.technical",
  softSkills: "skillsPathwaysPage.categories.softSkills",
  industryKnowledge: "skillsPathwaysPage.categories.industryKnowledge",
  portfolio: "skillsPathwaysPage.categories.portfolio",
};
const READINESS_CATEGORY_KEYS = [
  "technical",
  "softSkills",
  "industryKnowledge",
  "portfolio",
] as const satisfies readonly ReadinessCategoryKey[];

const api = useApi();
const { $toast } = useNuxtApp();
const { t } = useI18n();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("skillsPathwaysPage.seoTitle"),
    description: t("skillsPathwaysPage.seoDescription"),
  });
}

const { data, status, error, refresh } = await useAsyncData(
  "skills-pathways-bootstrap",
  async () => {
    const [pathwaysResponse, readinessResponse] = await Promise.all([
      api.skills.pathways.get(),
      api.skills.readiness.get(),
    ]);

    if (pathwaysResponse.error) {
      throw new Error(
        pathwaysResponse.error.value?.message ?? t("skillsPathwaysPage.errors.pathwaysLoadFailed"),
      );
    }
    if (readinessResponse.error) {
      throw new Error(
        readinessResponse.error.value?.message ??
          t("skillsPathwaysPage.errors.readinessLoadFailed"),
      );
    }

    return {
      pathways: pathwaysResponse.data,
      readiness: readinessResponse.data,
    };
  },
  {
    lazy: false,
    server: true,
  },
);

const { data: gamificationProgress } = await useAsyncData(
  "skills-pathways-gamification-progress",
  async () => {
    const progressResponse = await api.gamification.progress.get();
    if (progressResponse.error) {
      return null;
    }

    return progressResponse.data;
  },
  {
    lazy: false,
    server: true,
  },
);

const uiState = computed(() => {
  if (status.value === "pending") return "loading";
  if (status.value === "error") return "error";
  if (status.value === "idle") return "loading";
  return "success";
});

const breadcrumbs = computed(() => [
  { label: t("nav.skills"), to: APP_ROUTES.skills },
  { label: t("skillsPathwaysPage.title") },
]);

const gamificationLevel = computed(() => gamificationProgress.value?.level ?? 1);
const gamificationXP = computed(() => gamificationProgress.value?.xp ?? 0);

const readinessAssessment = computed<ReadinessAssessment | null>(
  () => data.value?.readiness ?? null,
);

const sortedPathways = computed(() =>
  [...(data.value?.pathways ?? [])].sort((left, right) => right.matchScore - left.matchScore),
);

const readinessCategories = computed<readonly ReadinessCategoryStat[]>(() => {
  if (!readinessAssessment.value) return [];

  return READINESS_CATEGORY_KEYS.map((key) => ({
    key,
    score: readinessAssessment.value?.categories[key].score ?? 0,
    feedback: readinessAssessment.value?.categories[key].feedback ?? "",
  }));
});

watch(
  () => error.value,
  (nextError) => {
    if (import.meta.client && nextError) {
      $toast.error(getErrorMessage(nextError, t("skillsPathwaysPage.errors.loadFailed")));
    }
  },
);

async function retryLoad(): Promise<void> {
  await refresh();
}

function getReadinessColor(percentage: number): string {
  if (percentage >= SKILLS_READINESS_THRESHOLD_HIGH) return "progress-success";
  if (percentage >= SKILLS_READINESS_THRESHOLD_MEDIUM) return "progress-warning";
  return "progress-error";
}

function getReadinessBadgeColor(percentage: number): string {
  if (percentage >= SKILLS_READINESS_THRESHOLD_HIGH) return "badge-success";
  if (percentage >= SKILLS_READINESS_THRESHOLD_MEDIUM) return "badge-warning";
  return "badge-error";
}

function getCategoryLabel(key: ReadinessCategoryKey): string {
  return t(READINESS_CATEGORY_LABEL_KEYS[key]);
}

function getPathwayIcon(pathwayId: string): string {
  return getGamificationPathwayIcon(pathwayId);
}

function getReadinessDialStyle(score: number): Record<string, string> {
  return {
    "--value": String(score),
    "--size": `${SKILLS_READINESS_DIAL_SIZE_REM}rem`,
  };
}
</script>

<template>
  <section class="space-y-6">
    <AppBreadcrumbs :crumbs="breadcrumbs" />

    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold">{{ t("skillsPathwaysPage.title") }}</h1>
        <p class="text-sm text-base-content/70">{{ t("skillsPathwaysPage.subtitle") }}</p>
      </div>
      <NuxtLink
        :to="APP_ROUTES.gamification"
        class="btn btn-ghost btn-sm gap-2"
        :aria-label="t('skillsPathwaysPage.gamification.openProgressAria')"
      >
        <span class="badge badge-primary badge-sm">
          {{ t("skillsPathwaysPage.gamification.levelLabel", { level: gamificationLevel }) }}
        </span>
        <span class="text-xs">{{ t("skillsPathwaysPage.gamification.xpLabel", { xp: gamificationXP }) }}</span>
      </NuxtLink>
    </header>

    <LoadingSkeleton v-if="uiState === 'loading'" variant="cards" :lines="8" />

    <div v-else-if="uiState === 'error'" class="alert alert-error" role="alert">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ getErrorMessage(error, t("skillsPathwaysPage.errors.loadFailed")) }}</span>
      <button
        type="button"
        class="btn btn-sm"
        :aria-label="t('skillsPathwaysPage.retryAria')"
        @click="retryLoad"
      >
        {{ t("skillsPathwaysPage.retryButtonLabel") }}
      </button>
    </div>

    <template v-else>
      <section
        v-if="readinessAssessment"
        class="card bg-gradient-to-br from-primary to-secondary text-primary-content"
      >
        <div class="card-body gap-4">
          <h2 class="card-title text-2xl">{{ t("skillsPathwaysPage.readiness.title") }}</h2>

          <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div class="space-y-2">
              <p class="text-sm opacity-85">{{ t("skillsPathwaysPage.readiness.overallReadinessLabel") }}</p>
              <div
                class="radial-progress bg-primary-content/20 text-primary-content border-4 border-primary-content/20"
                :style="getReadinessDialStyle(readinessAssessment.overallScore)"
                role="progressbar"
                :aria-valuenow="readinessAssessment.overallScore"
                :aria-valuemin="SKILLS_READINESS_MIN"
                :aria-valuemax="SKILLS_READINESS_MAX"
                :aria-label="t('skillsPathwaysPage.readiness.overallReadinessAria', { score: readinessAssessment.overallScore })"
              >
                <span class="text-2xl font-bold">{{ readinessAssessment.overallScore }}%</span>
              </div>
            </div>

            <div class="space-y-3">
              <p class="text-sm opacity-85">{{ t("skillsPathwaysPage.readiness.categoryScoresLabel") }}</p>
              <div
                v-for="category in readinessCategories"
                :key="category.key"
                class="space-y-1"
              >
                <p class="text-sm">
                  {{ getCategoryLabel(category.key) }}: {{ category.score }}%
                </p>
                <progress
                  class="progress w-full"
                  :class="getReadinessColor(category.score)"
                  :value="category.score"
                  :max="SKILLS_READINESS_MAX"
                  :aria-label="t('skillsPathwaysPage.readiness.categoryScoreAria', { category: getCategoryLabel(category.key), score: category.score })"
                ></progress>
                <p class="text-xs opacity-85">{{ category.feedback }}</p>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide">
                  {{ t("skillsPathwaysPage.readiness.topImprovementsTitle") }}
                </p>
                <ul class="list text-sm">
                  <li
                    v-for="item in readinessAssessment.improvementSuggestions"
                    :key="item"
                    class="list-row px-0 py-1"
                  >
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>

              <div>
                <p class="text-xs font-semibold uppercase tracking-wide">
                  {{ t("skillsPathwaysPage.readiness.nextStepsTitle") }}
                </p>
                <ul class="list text-sm">
                  <li
                    v-for="item in readinessAssessment.nextSteps"
                    :key="item"
                    class="list-row px-0 py-1"
                  >
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-else role="alert" class="alert alert-info alert-soft">
        <span>{{ t("skillsPathwaysPage.readiness.emptyState") }}</span>
      </section>

      <section class="card bg-base-200">
        <div class="card-body gap-4">
          <h2 class="card-title">{{ t("skillsPathwaysPage.pathways.title") }}</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <article
              v-for="pathway in sortedPathways"
              :key="pathway.id"
              class="card card-border bg-base-100"
            >
              <div class="card-body gap-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl" aria-hidden="true">{{ getPathwayIcon(pathway.id) }}</span>
                    <h3 class="card-title text-base">{{ pathway.title }}</h3>
                  </div>
                  <span class="badge badge-sm" :class="getReadinessBadgeColor(pathway.matchScore)">
                    {{ pathway.matchScore }}%
                  </span>
                </div>

                <p class="text-sm text-base-content/70">{{ pathway.description }}</p>
                <p v-if="pathway.detailedDescription" class="text-xs text-base-content/70">
                  {{ pathway.detailedDescription }}
                </p>

                <div>
                  <p class="text-xs font-semibold mb-1">{{ t("skillsPathwaysPage.pathways.requiredSkillsTitle") }}</p>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="skill in pathway.requiredSkills" :key="skill" class="badge badge-xs">
                      {{ skill }}
                    </span>
                  </div>
                </div>

                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span>{{ t("skillsPathwaysPage.pathways.matchScoreLabel") }}</span>
                    <span class="font-semibold">{{ pathway.matchScore }}%</span>
                  </div>
                  <progress
                    class="progress w-full"
                    :class="getReadinessColor(pathway.matchScore)"
                    :value="pathway.matchScore"
                    :max="SKILLS_READINESS_MAX"
                    :aria-label="
                      t('skillsPathwaysPage.pathways.matchScoreAria', { score: pathway.matchScore, title: pathway.title })
                    "
                  ></progress>
                </div>

                <p class="text-xs">
                  {{ t("skillsPathwaysPage.pathways.estimatedTimeLabel") }}
                  <span class="font-semibold">{{ pathway.estimatedTimeToEntry }}</span>
                </p>
                <p class="text-xs">
                  {{ t("skillsPathwaysPage.pathways.marketTrendLabel") }}
                  <span class="font-semibold capitalize">
                    {{ t(`skillsPathwaysPage.pathways.marketTrend.${pathway.jobMarketTrend}`) }}
                  </span>
                </p>
              </div>
            </article>
          </div>

          <div v-if="sortedPathways.length === 0" role="alert" class="alert alert-info alert-soft">
            <span>{{ t("skillsPathwaysPage.pathways.emptyState") }}</span>
          </div>
        </div>
      </section>
    </template>
  </section>
</template>
