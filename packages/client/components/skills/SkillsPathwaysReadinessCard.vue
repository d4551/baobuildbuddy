<script setup lang="ts">
import type { ReadinessAssessment } from "@bao/shared/types/skill-mapping";
import { useI18n } from "vue-i18n";
import type { ReadinessCategoryStat } from "~/composables/skills-pathways-page-contracts";
import SectionGrid from "~/components/ui/SectionGrid.vue";

defineProps<{
  readinessAssessment: ReadinessAssessment | null;
  readinessCategories: readonly ReadinessCategoryStat[];
  readinessMin: number;
  readinessMax: number;
  getCategoryLabel: (key: ReadinessCategoryStat["key"]) => string;
  getCategoryFeedbackLabel: (
    categoryKey: ReadinessCategoryStat["key"],
    feedbackId: ReadinessCategoryStat["feedbackId"],
  ) => string;
  getReadinessImprovementLabel: (
    item: ReadinessAssessment["improvementSuggestions"][number],
  ) => string;
  getReadinessNextStepLabel: (item: ReadinessAssessment["nextSteps"][number]) => string;
  getReadinessColor: (score: number) => string;
}>();

const { t } = useI18n();
</script>

<template>
  <section
    v-if="readinessAssessment"
    class="card bg-linear-to-br from-primary to-secondary text-primary-content"
  >
    <div class="card-body gap-4">
      <h2 class="card-title text-2xl">{{ t("skillsPathwaysPage.readiness.title") }}</h2>

      <SectionGrid grid-token="threeColumnXlGap6">
        <div class="space-y-2">
          <p class="text-sm opacity-85">{{ t("skillsPathwaysPage.readiness.overallReadinessLabel") }}</p>
          <UiRadialMeter
            :value="readinessAssessment.overallScore"
            :max="readinessMax"
            size-class="h-28 w-28"
            track-class="stroke-primary-content/30"
            fill-class="stroke-primary-content"
            :aria-label="t('skillsPathwaysPage.readiness.overallReadinessAria', { score: readinessAssessment.overallScore })"
          >
            <span class="text-2xl font-bold">{{ readinessAssessment.overallScore }}%</span>
          </UiRadialMeter>
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
              :max="readinessMax"
              :aria-label="t('skillsPathwaysPage.readiness.categoryScoreAria', { category: getCategoryLabel(category.key), score: category.score })"
            ></progress>
            <p class="text-xs opacity-85">
              {{ getCategoryFeedbackLabel(category.key, category.feedbackId) }}
            </p>
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
                <span>{{ getReadinessImprovementLabel(item) }}</span>
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
                <span>{{ getReadinessNextStepLabel(item) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </SectionGrid>
    </div>
  </section>

  <EmptyState
    v-else
    title-key="skillsPathwaysPage.readiness.emptyStateTitle"
    description-key="skillsPathwaysPage.readiness.emptyStateDescription"
  />
</template>
