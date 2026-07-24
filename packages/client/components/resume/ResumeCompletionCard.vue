<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  OUTLINE_ACTION_DENSE_CLASS,
  PADDING_TOKEN_CLASS,
  PROGRESS_BAR_VARIANT_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_GHOST_SM_CLASS,
  BADGE_PRIMARY_OUTLINE_CLASS,
  BADGE_SUCCESS_SM_CLASS,
} from "~/constants/layout-badges";
import type {
  ResumeCompletionQuickAction,
  ResumeCompletionSection,
  ResumeTabId,
} from "./resume-page-contracts";

interface ResumeCompletionCardProps {
  readonly completionPercent: number;
  readonly completedSectionCount: number;
  readonly totalSections: number;
  readonly sections: readonly ResumeCompletionSection[];
  readonly nextRecommendedTab: ResumeTabId | null;
  readonly quickActions: readonly ResumeCompletionQuickAction[];
  readonly tabLabel: (tab: ResumeTabId) => string;
}

defineProps<ResumeCompletionCardProps>();

const emit = defineEmits<{
  selectTab: [tabId: ResumeTabId];
}>();

const { t } = useI18n();
</script>

<template>
  <UiGlassCard>
    <div class="card-body" :class="[PADDING_TOKEN_CLASS.py4]">
      <div class="flex flex-wrap items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <h3 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("resumePage.completion.title") }}</h3>
        <span :class="[BADGE_PRIMARY_OUTLINE_CLASS]">
          {{ t("resumePage.completion.percentLabel", { percent: completionPercent }) }}
        </span>
      </div>
      <progress 
        class="progress" :class="[PROGRESS_BAR_VARIANT_CLASS.primary, FLUID_WIDTH_CLASS]"
        :value="completionPercent"
        max="100"
        :aria-label="t('resumePage.completion.progressAria')"
      ></progress>
      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
        {{
          t("resumePage.completion.summary", {
            completed: completedSectionCount,
            total: totalSections,
          })
        }}
      </p>
      <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
        <button type="button"
          v-for="section in sections"
          :key="section.id"
          class="cursor-pointer"
          :class="[section.completed ? BADGE_SUCCESS_SM_CLASS : BADGE_GHOST_SM_CLASS]"
          :aria-label="t('resumePage.completion.jumpAria', { section: tabLabel(section.id) })"
          @click="emit('selectTab', section.id)"
        >
          {{ tabLabel(section.id) }}
        </button>
      </div>
      <div class="card-actions justify-between">
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
          {{
            nextRecommendedTab
              ? t("resumePage.completion.nextStep", { section: tabLabel(nextRecommendedTab) })
              : t("resumePage.completion.complete")
          }}
        </p>
        <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <NuxtLink 
            v-for="action in quickActions"
            :key="action.id"
            :to="action.to"
            :class="[OUTLINE_ACTION_DENSE_CLASS]"
            :aria-label="t(action.labelKey)"
          >
            {{ t(action.labelKey) }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </UiGlassCard>
</template>
