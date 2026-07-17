<script setup lang="ts">
import type { DashboardStatCardViewModel } from "./dashboard-page-contracts";

defineProps<{
  statCards: readonly DashboardStatCardViewModel[];
}>();
</script>

<template>
  <SectionGrid grid-token="bento">
    <NuxtLink
      v-for="statCard in statCards"
      :key="statCard.id"
      :to="statCard.to"
      class="card h-full bg-base-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
      :aria-label="statCard.ariaLabel"
    >
      <div class="card-body flex flex-col justify-between p-5 md:p-6">
        <div class="mb-4 flex items-start justify-between">
          <div>
            <div class="mb-1 text-sm font-medium text-muted">{{ statCard.title }}</div>
            <div class="text-3xl font-bold">{{ statCard.value }}</div>
          </div>
          <div class="rounded-2xl glass-subtle p-3" :class="statCard.accentClass">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="statCard.iconPath" />
            </svg>
          </div>
        </div>
        <div class="mt-auto flex items-center gap-1 text-xs font-semibold" :class="statCard.accentClass">
          <span>{{ statCard.ctaLabel }}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>
    </NuxtLink>
  </SectionGrid>
</template>
