<script setup lang="ts">
import type { CareerPathway } from "@bao/shared/types/skill-mapping";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  pathways: readonly CareerPathway[];
  readinessMax: number;
  getPathwayIcon: (pathwayId: string) => string;
  getReadinessBadgeColor: (score: number) => string;
  getReadinessColor: (score: number) => string;
}>();

const { t } = useI18n();
</script>

<template>
  <section class="card bg-base-200">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <h2 class="card-title">{{ t("skillsPathwaysPage.pathways.title") }}</h2>

      <SectionGrid grid-token="threeColumn">
        <article
          v-for="pathway in pathways"
          :key="pathway.id"
          :class="SURFACE_GLASS_CARD_CLASS"
        >
          <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                <span :class="[TYPOGRAPHY_SCALE_CLASS.xl2]" aria-hidden="true">{{ getPathwayIcon(pathway.id) }}</span>
                <h3 class="card-title text-base">{{ pathway.title }}</h3>
              </div>
              <span class="badge badge-sm" :class="getReadinessBadgeColor(pathway.matchScore)">
                {{ pathway.matchScore }}%
              </span>
            </div>

            <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ pathway.description }}</p>
            <p v-if="pathway.detailedDescription" class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
              {{ pathway.detailedDescription }}
            </p>

            <div>
              <p class="font-semibold" :class="[MARGIN_TOKEN_CLASS.mb1, TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("skillsPathwaysPage.pathways.requiredSkillsTitle") }}</p>
              <div class="flex flex-wrap gap-1">
                <span v-for="skill in pathway.requiredSkills" :key="skill" class="badge badge-xs">
                  {{ skill }}
                </span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                <span>{{ t("skillsPathwaysPage.pathways.matchScoreLabel") }}</span>
                <span class="font-semibold">{{ pathway.matchScore }}%</span>
              </div>
              <progress
                class="progress" :class="[FLUID_WIDTH_CLASS, getReadinessColor(pathway.matchScore)]"
                :value="pathway.matchScore"
                :max="readinessMax"
                :aria-label="t('skillsPathwaysPage.pathways.matchScoreAria', { score: pathway.matchScore, title: pathway.title })"
              ></progress>
            </div>

            <p :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
              {{ t("skillsPathwaysPage.pathways.estimatedTimeLabel") }}
              <span class="font-semibold">{{ pathway.estimatedTimeToEntry }}</span>
            </p>
            <p :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
              {{ t("skillsPathwaysPage.pathways.marketTrendLabel") }}
              <span class="font-semibold capitalize">
                {{ t(`skillsPathwaysPage.pathways.marketTrend.${pathway.jobMarketTrend}`) }}
              </span>
            </p>
          </div>
        </article>
      </SectionGrid>

      <EmptyState
        v-if="pathways.length === 0"
        title-key="skillsPathwaysPage.pathways.emptyStateTitle"
        description-key="skillsPathwaysPage.pathways.emptyStateDescription"
      />
    </div>
  </section>
</template>
