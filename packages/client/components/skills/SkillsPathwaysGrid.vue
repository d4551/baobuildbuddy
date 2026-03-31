<script setup lang="ts">
import type { CareerPathway } from "@bao/shared";
import { useI18n } from "vue-i18n";

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
    <div class="card-body gap-4">
      <h2 class="card-title">{{ t("skillsPathwaysPage.pathways.title") }}</h2>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="pathway in pathways"
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
              <p class="mb-1 text-xs font-semibold">{{ t("skillsPathwaysPage.pathways.requiredSkillsTitle") }}</p>
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
                :max="readinessMax"
                :aria-label="t('skillsPathwaysPage.pathways.matchScoreAria', { score: pathway.matchScore, title: pathway.title })"
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

      <EmptyState
        v-if="pathways.length === 0"
        title-key="skillsPathwaysPage.pathways.emptyStateTitle"
        description-key="skillsPathwaysPage.pathways.emptyStateDescription"
      />
    </div>
  </section>
</template>
