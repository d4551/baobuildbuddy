<script setup lang="ts">
import { SHADOW_TOKEN_CLASS, SURFACE_GLASS_CARD_CLASS } from "~/constants/layout";
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
    width: "w-full",
    variant: "text",
  },
);

const cardsGridClass = UI_GRID_CLASS_BY_TOKEN.threeColumn;
</script>

<template>
  <div v-if="variant === 'cards'" :class="cardsGridClass" role="status" aria-live="polite" aria-busy="true">
    <div v-for="index in 6" :key="index" :class="[SURFACE_GLASS_CARD_CLASS, 'h-full']">
      <div class="card-body gap-3">
        <div class="skeleton h-5 w-2/3"></div>
        <div class="skeleton h-4 w-1/2"></div>
        <div class="skeleton h-4 w-full"></div>
        <div class="skeleton h-4 w-5/6"></div>
        <div class="mt-2 flex gap-2">
          <div class="skeleton h-6 w-16"></div>
          <div class="skeleton h-6 w-20"></div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-else-if="variant === 'stats'"
    :class="['stats stats-vertical w-full border border-base-300 bg-base-200 sm:stats-horizontal', SHADOW_TOKEN_CLASS.sm]"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div v-for="index in 3" :key="index" class="stat">
      <div class="skeleton mb-2 h-4 w-20"></div>
      <div class="skeleton h-8 w-16"></div>
      <div class="skeleton mt-2 h-3 w-24"></div>
    </div>
  </div>

  <div v-else class="flex flex-col gap-3" role="status" aria-live="polite" aria-busy="true">
    <div
      v-for="i in lines"
      :key="i"
      class="skeleton h-4"
      :class="[i === lines ? 'w-3/4' : width]"
    />
  </div>
</template>
