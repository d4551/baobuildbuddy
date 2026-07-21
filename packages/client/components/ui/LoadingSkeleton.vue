<script setup lang="ts">
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  HEIGHT_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  STATS_ROW_SHELL_CLASS,
  WIDTH_TOKEN_CLASS,
} from "~/constants/layout";
import { UI_GRID_CLASS_BY_TOKEN } from "~/constants/ui-layout";

type LoadingSkeletonVariant = "text" | "cards" | "stats";

withDefaults(
  defineProps<{
    lines?: number;
    width?: string;
    variant?: LoadingSkeletonVariant;
  }>(),
  {
    lines: 3,
    width: FLUID_WIDTH_CLASS,
    variant: "text",
  },
);

/** Skeleton card count for list loading surfaces (matches threeColumn density). */
const LOADING_SKELETON_CARD_COUNT = 6;
/** Skeleton stat columns for dashboard/hub loading. */
const LOADING_SKELETON_STAT_COUNT = 3;

const cardsGridClass = UI_GRID_CLASS_BY_TOKEN.threeColumn;
</script>

<template>
  <div v-if="variant === 'cards'" :class="cardsGridClass" role="status" aria-live="polite" aria-busy="true">
    <UiGlassCard v-for="index in LOADING_SKELETON_CARD_COUNT" :key="index" extra-class="h-full" :stagger-index="index - 1">
      <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <div class="skeleton w-2/3" :class="[HEIGHT_TOKEN_CLASS.h5]"></div>
        <div class="skeleton w-1/2" :class="[HEIGHT_TOKEN_CLASS.h4]"></div>
        <div class="skeleton w-full" :class="[HEIGHT_TOKEN_CLASS.h4]"></div>
        <div class="skeleton w-5/6" :class="[HEIGHT_TOKEN_CLASS.h4]"></div>
        <div class="flex" :class="[MARGIN_TOKEN_CLASS.mt2, FLEX_GAP_TOKEN_CLASS.gap2]">
          <div class="skeleton" :class="[HEIGHT_TOKEN_CLASS.h6, WIDTH_TOKEN_CLASS.w16]"></div>
          <div class="skeleton" :class="[HEIGHT_TOKEN_CLASS.h6, WIDTH_TOKEN_CLASS.w20]"></div>
        </div>
      </div>
    </UiGlassCard>
  </div>

  <div
    v-else-if="variant === 'stats'"
    :class="[STATS_ROW_SHELL_CLASS, SHADOW_TOKEN_CLASS.sm]"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div v-for="index in LOADING_SKELETON_STAT_COUNT" :key="index" class="stat">
      <div class="skeleton" :class="[MARGIN_TOKEN_CLASS.mb2, HEIGHT_TOKEN_CLASS.h4, WIDTH_TOKEN_CLASS.w20]"></div>
      <div class="skeleton" :class="[HEIGHT_TOKEN_CLASS.h8, WIDTH_TOKEN_CLASS.w16]"></div>
      <div class="skeleton w-24" :class="[MARGIN_TOKEN_CLASS.mt2, HEIGHT_TOKEN_CLASS.h3]"></div>
    </div>
  </div>

  <div class="flex flex-col" :class="[FLEX_GAP_TOKEN_CLASS.gap3]" v-else role="status" aria-live="polite" aria-busy="true">
    <div class="skeleton" v-for="i in lines" :key="i" :class="[i === lines ? 'w-3/4' : width, HEIGHT_TOKEN_CLASS.h4]"/>
  </div>
</template>
