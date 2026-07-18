<script setup lang="ts">
/**
 * Canonical search + filter bar primitive. Single source for all list pages.
 * All pages with list filtering MUST use this component — bespoke search bars
 * are forbidden.
 */
import {
  FLEX_GAP_TOKEN_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
} from "~/constants/layout";

withDefaults(
  defineProps<{
    /** Search query v-model */
    modelValue: string;
    /** Placeholder for the search input */
    placeholder: string;
    /** Search input aria label */
    ariaLabel: string;
    /** Search button aria label */
    buttonAriaLabel: string;
    /** Whether to show a mobile filter toggle button */
    showMobileFilterToggle?: boolean;
    /** Mobile filter toggle aria label */
    mobileToggleAriaLabel?: string;
    /** Mobile toggle text (visible on small screens) */
    mobileToggleText?: string;
    /** Whether the filter sidebar is currently shown */
    filtersVisible?: boolean;
    /** Extra class on the outer card */
    extraClass?: string;
  }>(),
  {
    showMobileFilterToggle: false,
    mobileToggleAriaLabel: "",
    mobileToggleText: "",
    filtersVisible: false,
    extraClass: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  search: [];
  "toggle-filters": [];
}>();

function onSearchKeydown(event: KeyboardEvent): void {
  if (event.key === "Enter") {
    emit("search");
  }
}
</script>

<template>
  <div :class="[SURFACE_GLASS_CARD_CLASS, extraClass]">
    <div class="card-body">
      <div class="flex flex-col sm:flex-row" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <input
          :value="modelValue"
          type="text"
          :placeholder="placeholder"
          class="input flex-1"
          :aria-label="ariaLabel"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @keydown="onSearchKeydown"
        />
        <button
          class="btn btn-primary"
          :aria-label="buttonAriaLabel"
          @click="emit('search')"
        >
          <slot name="search-icon">
            <svg :class="ICON_SIZE_CLASS.sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </slot>
          <slot name="search-text" />
        </button>
        <button
          v-if="showMobileFilterToggle"
          class="btn btn-outline sm:hidden"
          :aria-label="mobileToggleAriaLabel"
          @click="emit('toggle-filters')"
        >
          <slot name="filter-icon">
            <svg :class="ICON_SIZE_CLASS.sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </slot>
          {{ mobileToggleText }}
        </button>
      </div>
      <!-- Optional slot for extra filter chips / controls below the search bar -->
      <div v-if="$slots.extra" :class="[MARGIN_TOKEN_CLASS.mt2]">
        <slot name="extra" />
      </div>
    </div>
  </div>
</template>
