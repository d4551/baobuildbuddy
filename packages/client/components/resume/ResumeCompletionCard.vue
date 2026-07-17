<script setup lang="ts">
import { useI18n } from "vue-i18n";
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
  <div class="card card-border bg-base-100">
    <div class="card-body py-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-sm font-semibold">{{ t("resumePage.completion.title") }}</h3>
        <span class="badge badge-primary badge-outline">
          {{ t("resumePage.completion.percentLabel", { percent: completionPercent }) }}
        </span>
      </div>
      <progress
        class="progress progress-primary w-full"
        :value="completionPercent"
        max="100"
        :aria-label="t('resumePage.completion.progressAria')"
      ></progress>
      <p class="text-xs text-secondary">
        {{
          t("resumePage.completion.summary", {
            completed: completedSectionCount,
            total: totalSections,
          })
        }}
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="section in sections"
          :key="section.id"
          class="badge badge-sm cursor-pointer"
          :class="section.completed ? 'badge-success' : 'badge-ghost'"
          :aria-label="t('resumePage.completion.jumpAria', { section: tabLabel(section.id) })"
          @click="emit('selectTab', section.id)"
        >
          {{ tabLabel(section.id) }}
        </button>
      </div>
      <div class="card-actions justify-between">
        <p class="text-xs text-secondary">
          {{
            nextRecommendedTab
              ? t("resumePage.completion.nextStep", { section: tabLabel(nextRecommendedTab) })
              : t("resumePage.completion.complete")
          }}
        </p>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.id"
            :to="action.to"
            class="btn btn-xs btn-outline"
            :aria-label="t(action.labelKey)"
          >
            {{ t(action.labelKey) }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
