<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { DashboardQuickAction } from "~/constants/dashboard-contracts";

defineProps<{
  actions: readonly DashboardQuickAction[];
}>();

const { t } = useI18n();
</script>

<template>
  <section class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title mb-4 text-lg">{{ t("dashboard.quickActionsTitle") }}</h2>
      <SectionGrid grid-token="bento">
        <NuxtLink
          v-for="action in actions"
          :key="action.id"
          :to="action.to"
          class="btn btn-primary btn-soft justify-start border-primary/20 bg-primary/5 text-primary hover:border-primary sm:justify-center"
          :aria-label="t(action.labelKey)"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="action.iconPath" />
          </svg>
          {{ t(action.labelKey) }}
        </NuxtLink>
      </SectionGrid>
    </div>
  </section>
</template>
