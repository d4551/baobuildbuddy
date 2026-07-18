<script setup lang="ts">
import {
  CARD_BODY_COMFORTABLE_CLASS,
  FLUID_HEIGHT_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CHEVRON_CLASS,
  ICON_SIZE_CLASS,
  STAT_CARD_CTA_ROW_CLASS,
  STAT_CARD_HEADER_ROW_CLASS,
  STAT_CARD_ICON_BADGE_CLASS,
  STAT_CARD_TITLE_BLOCK_CLASS,
  STAT_CARD_VALUE_CLASS,
  SURFACE_GLASS_CARD_CLASS,
} from "~/constants/layout";
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
      :class="[SURFACE_GLASS_CARD_CLASS, '', FLUID_HEIGHT_CLASS]"
      :aria-label="statCard.ariaLabel"
    >
      <div :class="CARD_BODY_COMFORTABLE_CLASS">
        <div :class="STAT_CARD_HEADER_ROW_CLASS">
          <div>
            <div :class="STAT_CARD_TITLE_BLOCK_CLASS">{{ statCard.title }}</div>
            <div :class="STAT_CARD_VALUE_CLASS">{{ statCard.value }}</div>
          </div>
          <div :class="[STAT_CARD_ICON_BADGE_CLASS, statCard.accentClass]">
            <svg :class="ICON_SIZE_CLASS.md" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" :d="statCard.iconPath" />
            </svg>
          </div>
        </div>
        <div :class="[STAT_CARD_CTA_ROW_CLASS, statCard.accentClass]">
          <span>{{ statCard.ctaLabel }}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            :stroke-width="ICON_DECORATIVE_STROKE_WIDTH"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            :class="ICON_SIZE_CHEVRON_CLASS"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>
    </NuxtLink>
  </SectionGrid>
</template>
