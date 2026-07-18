<script setup lang="ts">
import { FLEX_GAP_TOKEN_CLASS, SHADOW_TOKEN_CLASS, STACK_SPACE_Y_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { SkillMapping } from "@bao/shared/types/skill-mapping";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";

defineProps<{
  mappingMetrics: {
    total: number;
    averageConfidence: number;
    aiGeneratedCount: number;
    categoriesUsed: number;
  };
  topMappings: SkillMapping[];
}>();

const { t } = useI18n();
</script>

<template>
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
    <StatsRow
      background-class="bg-base-200"
      :stats="[
        { titleKey: 'skillsPage.stats.totalMappingsTitle', value: mappingMetrics.total, valueClass: 'text-primary', descKey: 'skillsPage.stats.totalMappingsDesc' },
        { titleKey: 'skillsPage.stats.averageConfidenceTitle', value: `${mappingMetrics.averageConfidence}%`, valueClass: 'text-success', descKey: 'skillsPage.stats.averageConfidenceDesc' },
        { titleKey: 'skillsPage.stats.aiGeneratedTitle', value: mappingMetrics.aiGeneratedCount, valueClass: 'text-info', descKey: 'skillsPage.stats.aiGeneratedDesc' },
        { titleKey: 'skillsPage.stats.categoriesUsedTitle', value: mappingMetrics.categoriesUsed, valueClass: 'text-warning', descKey: 'skillsPage.stats.categoriesUsedDesc' },
      ]"
    />

    <div class="card card-border bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]">
      <div class="card-body">
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("skillsPage.description") }}
        </p>
      </div>
    </div>

    <SectionGrid tag="section" grid-token="twoColumnXlGap4">
      <article class="card card-border bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]">
        <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
          <div class="space-y-1">
            <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t("skillsPage.insights.pathwaysTitle") }}</h2>
            <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("skillsPage.insights.pathwaysDescription") }}
            </p>
          </div>

          <ul class="list rounded-box glass-subtle">
            <li class="list-row">
              <span class="font-medium">{{ t("skillsPage.insights.totalMappingsLabel") }}</span>
              <span class="list-col-grow"></span>
              <span class="badge badge-neutral">{{ mappingMetrics.total }}</span>
            </li>
            <li class="list-row">
              <span class="font-medium">{{ t("skillsPage.insights.avgConfidenceLabel") }}</span>
              <span class="list-col-grow"></span>
              <span class="badge badge-primary">{{ mappingMetrics.averageConfidence }}%</span>
            </li>
            <li class="list-row">
              <span class="font-medium">{{ t("skillsPage.insights.categoriesCoverageLabel") }}</span>
              <span class="list-col-grow"></span>
              <span class="badge badge-secondary">{{ mappingMetrics.categoriesUsed }}</span>
            </li>
          </ul>

          <div class="card-actions justify-end">
            <NuxtLink
              :to="APP_ROUTES.skillsPathways"
              class="btn btn-primary btn-sm"
              :aria-label="t('skillsPage.insights.pathwaysButtonAria')"
            >
              {{ t("skillsPage.insights.pathwaysButton") }}
            </NuxtLink>
          </div>
        </div>
      </article>

      <article class="card card-border bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]">
        <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
          <div class="space-y-1">
            <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t("skillsPage.insights.topMappingsTitle") }}</h2>
            <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("skillsPage.insights.topMappingsDescription") }}
            </p>
          </div>

          <ul
            v-if="topMappings.length > 0"
            class="list rounded-box glass-subtle"
            :aria-label="t('skillsPage.insights.topMappingsAria')"
          >
            <li
              v-for="mapping in topMappings"
              :key="mapping.id"
              class="list-row items-center"
            >
              <div class="list-col-grow">
                <p class="font-medium">{{ mapping.transferableSkill }}</p>
                <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ mapping.gameExpression }}</p>
              </div>
              <span class="badge badge-primary badge-sm">{{ mapping.confidence }}%</span>
            </li>
          </ul>

          <EmptyState
            v-else
            title-key="skillsPage.insights.topMappingsEmptyTitle"
            description-key="skillsPage.insights.topMappingsEmptyDescription"
          />
        </div>
      </article>
    </SectionGrid>
  </div>
</template>
