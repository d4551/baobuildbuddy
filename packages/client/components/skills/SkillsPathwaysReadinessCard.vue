<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { ReadinessAssessment } from "@bao/shared/types/skill-mapping";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import type { ReadinessCategoryStat } from "~/composables/skills-pathways-page-contracts";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  RADIAL_METER_GEOMETRY,
  STACK_SPACE_Y_TOKEN_CLASS,
  TRACKING_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

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
    class="card card-border bg-linear-to-br from-primary to-secondary text-on-primary"
  >
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ t("skillsPathwaysPage.readiness.title") }}</h2>

      <SectionGrid grid-token="threeColumnXlGap6">
        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
          <p class="text-on-primary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("skillsPathwaysPage.readiness.overallReadinessLabel") }}</p>
          <UiRadialMeter 
            :value="readinessAssessment.overallScore"
            :max="readinessMax"
            :size-class="RADIAL_METER_GEOMETRY.readinessSizeClass"
            track-class="stroke-primary-content/30"
            fill-class="stroke-primary-content"
            :aria-label="t('skillsPathwaysPage.readiness.overallReadinessAria', { score: readinessAssessment.overallScore })"
          >
            <span :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.xl2]">{{ readinessAssessment.overallScore }}%</span>
          </UiRadialMeter>
        </div>

        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
          <p class="text-on-primary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("skillsPathwaysPage.readiness.categoryScoresLabel") }}</p>
          <div 
            v-for="category in readinessCategories"
            :key="category.key"
            :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]"
          >
            <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ getCategoryLabel(category.key) }}: {{ category.score }}%
            </p>
            <progress 
              class="progress" :class="[FLUID_WIDTH_CLASS, getReadinessColor(category.score)]"
              :value="category.score"
              :max="readinessMax"
              :aria-label="t('skillsPathwaysPage.readiness.categoryScoreAria', { category: getCategoryLabel(category.key), score: category.score })"
            ></progress>
            <p class="text-on-primary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
              {{ getCategoryFeedbackLabel(category.key, category.feedbackId) }}
            </p>
          </div>
        </div>

        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
          <div>
            <p class="font-semibold uppercase" :class="[TRACKING_TOKEN_CLASS.wide, TYPOGRAPHY_SCALE_CLASS.xs]">
              {{ t("skillsPathwaysPage.readiness.topImprovementsTitle") }}
            </p>
            <ul class="list" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              <li class="list-row" :class="[PADDING_TOKEN_CLASS.px0, PADDING_TOKEN_CLASS.py1]" v-for="item in readinessAssessment.improvementSuggestions" :key="item">
                <span>{{ getReadinessImprovementLabel(item) }}</span>
              </li>
            </ul>
          </div>

          <div>
            <p class="font-semibold uppercase" :class="[TRACKING_TOKEN_CLASS.wide, TYPOGRAPHY_SCALE_CLASS.xs]">
              {{ t("skillsPathwaysPage.readiness.nextStepsTitle") }}
            </p>
            <ul class="list" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              <li class="list-row" :class="[PADDING_TOKEN_CLASS.px0, PADDING_TOKEN_CLASS.py1]" v-for="item in readinessAssessment.nextSteps" :key="item">
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
    cta-label-key="nav.skills"
    :cta-to="APP_ROUTES.skills"
  />
</template>
