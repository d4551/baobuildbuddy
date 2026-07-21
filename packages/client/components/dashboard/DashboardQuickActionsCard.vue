<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { DashboardQuickAction } from "~/constants/dashboard-contracts";
import {
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  actions: readonly DashboardQuickAction[];
}>();

const { t } = useI18n();
</script>

<template>
  <UiGlassCard>
    <div class="card-body">
      <h2 class="card-title" :class="[MARGIN_TOKEN_CLASS.mb4, TYPOGRAPHY_SCALE_CLASS.lg]">{{ t("dashboard.quickActionsTitle") }}</h2>
      <SectionGrid grid-token="bento">
        <NuxtLink 
          v-for="action in actions"
          :key="action.id"
          :to="action.to"
          :class="[OUTLINE_ACTION_CLASS, 'justify-start sm:justify-center']"
          :aria-label="t(action.labelKey)"
        >
          <svg :class="ICON_SIZE_CLASS['5']" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" :d="action.iconPath" />
          </svg>
          {{ t(action.labelKey) }}
        </NuxtLink>
      </SectionGrid>
    </div>
  </UiGlassCard>
</template>
