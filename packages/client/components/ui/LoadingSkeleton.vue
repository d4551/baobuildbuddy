<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  HEIGHT_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  WIDTH_TOKEN_CLASS,
} from "~/constants/layout";
import { LOADING_SKELETON_LINES } from "~/constants/numeric-ui";
import { UI_GRID_CLASS_BY_TOKEN } from "~/constants/ui-layout";

type LoadingSkeletonVariant = "text" | "cards" | "stats";

const props = withDefaults(
  defineProps<{
    lines?: number;
    width?: string;
    variant?: LoadingSkeletonVariant;
    /** Accessible name for the busy region; defaults to the shared loading string. */
    label?: string;
  }>(),
  {
    lines: 3,
    width: "w-full",
    variant: "text",
    label: "",
  },
);

const { t } = useI18n();

/**
 * Every variant is a `role="status"` live region, and a status region with no
 * accessible name is announced as an empty update — so assistive tech reported
 * nothing at all while content loaded. Named by default rather than per call site,
 * because all 32 call sites previously passed nothing.
 */
const accessibleLabel = computed(() => (props.label.length > 0 ? props.label : t("common.loading")));

const cardsGridClass = UI_GRID_CLASS_BY_TOKEN.threeColumn;
</script>

<template>
  <div v-if="variant === 'cards'" :class="cardsGridClass" role="status" aria-live="polite" aria-busy="true">
    <span class="sr-only">{{ accessibleLabel }}</span>
    <div v-for="index in LOADING_SKELETON_LINES.long" :key="index" :class="[SURFACE_GLASS_CARD_CLASS, 'h-full']">
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
    </div>
  </div>

  <div 
    v-else-if="variant === 'stats'"
    :class="['stats stats-vertical w-full border border-base-300 bg-base-200 sm:stats-horizontal', SHADOW_TOKEN_CLASS.sm]"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <span class="sr-only">{{ accessibleLabel }}</span>
    <div v-for="index in LOADING_SKELETON_LINES.compact" :key="index" class="stat">
      <div class="skeleton" :class="[MARGIN_TOKEN_CLASS.mb2, HEIGHT_TOKEN_CLASS.h4, WIDTH_TOKEN_CLASS.w20]"></div>
      <div class="skeleton" :class="[HEIGHT_TOKEN_CLASS.h8, WIDTH_TOKEN_CLASS.w16]"></div>
      <div class="skeleton w-24" :class="[MARGIN_TOKEN_CLASS.mt2, HEIGHT_TOKEN_CLASS.h3]"></div>
    </div>
  </div>

  <div class="flex flex-col" :class="[FLEX_GAP_TOKEN_CLASS.gap3]" v-else role="status" aria-live="polite" aria-busy="true">
    <span class="sr-only">{{ accessibleLabel }}</span>
    <div class="skeleton" v-for="i in lines" :key="i" :class="[i === lines ? 'w-3/4' : width, HEIGHT_TOKEN_CLASS.h4]"/>
  </div>
</template>
