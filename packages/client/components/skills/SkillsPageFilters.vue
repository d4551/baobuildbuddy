<script setup lang="ts">
import {  ICON_DECORATIVE_STROKE_WIDTH, SURFACE_GLASS_CARD_CLASS, FLEX_GAP_TOKEN_CLASS, FLUID_WIDTH_CLASS, SHADOW_TOKEN_CLASS } from "~/constants/layout";
import type { SkillCategory } from "@bao/shared/types/skill-mapping";
import {  ICON_DECORATIVE_STROKE_WIDTH, SURFACE_GLASS_CARD_CLASS, SKILLS_FILTER_ALL_VALUE } from "~/constants/skills";
import {  ICON_DECORATIVE_STROKE_WIDTH, SURFACE_GLASS_CARD_CLASS, useI18n } from "vue-i18n";

defineProps<{
  categoryOptions: ReadonlyArray<{ value: SkillCategory; label: string }>;
  hasActiveFilters: boolean;
}>();

const categoryFilter = defineModel<typeof SKILLS_FILTER_ALL_VALUE | SkillCategory>(
  "categoryFilter",
  {
    required: true,
  },
);
const searchFilter = defineModel<string>("searchFilter", { required: true });

const emit = defineEmits<{
  clear: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div :class="[SURFACE_GLASS_CARD_CLASS, 'glass-card-hover']">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <label class="input input-sm flex items-center" :class="[FLUID_WIDTH_CLASS, FLEX_GAP_TOKEN_CLASS.gap2]">
        <svg class="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchFilter"
          class="grow"
          type="text"
          :placeholder="t('skillsPage.filters.searchPlaceholder')"
          :aria-label="t('skillsPage.filters.searchAria')"
        />
      </label>

      <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]" role="radiogroup" :aria-label="t('skillsPage.filters.categoryGroupAria')">
        <button
          type="button"
          class="btn btn-sm btn-ghost"
          :class="categoryFilter === SKILLS_FILTER_ALL_VALUE ? 'btn-primary' : 'btn-ghost'"
          :aria-label="t('skillsPage.filters.allAria')"
          :aria-pressed="categoryFilter === SKILLS_FILTER_ALL_VALUE"
          @click="categoryFilter = SKILLS_FILTER_ALL_VALUE"
        >
          {{ t("skillsPage.filters.allButton") }}
        </button>
        <button
          v-for="categoryOption in categoryOptions"
          :key="categoryOption.value"
          type="button"
          class="btn btn-sm btn-ghost"
          :class="categoryFilter === categoryOption.value ? 'btn-primary' : 'btn-ghost'"
          :aria-label="t('skillsPage.filters.categoryAria', { category: categoryOption.label })"
          :aria-pressed="categoryFilter === categoryOption.value"
          @click="categoryFilter = categoryOption.value"
        >
          {{ categoryOption.label }}
        </button>
      </div>

      <div class="flex justify-end">
        <button
          class="btn btn-ghost btn-sm"
          :disabled="!hasActiveFilters"
          :aria-label="t('skillsPage.filters.clearAria')"
          @click.prevent="emit('clear')"
        >
          {{ t("skillsPage.filters.clearButton") }}
        </button>
      </div>
    </div>
  </div>
</template>
