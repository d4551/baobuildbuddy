<script setup lang="ts">
import type { SkillCategory } from "@bao/shared/types/skill-mapping";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  ICON_SIZE_CLASS,
  PRIMARY_BUTTON_VARIANT_CLASS,
  SVG_STROKE_WIDTH_DEFAULT,
  TOUCH_TARGET_MIN_CLASS,
} from "~/constants/layout";
import { SKILLS_FILTER_ALL_VALUE } from "~/constants/skills";

const categoryFilter = defineModel<typeof SKILLS_FILTER_ALL_VALUE | SkillCategory>(
  "categoryFilter",
  {
    required: true,
  },
);

const searchFilter = defineModel<string>("searchFilter", { required: true });

defineProps<{
  categoryOptions: ReadonlyArray<{ value: SkillCategory; label: string }>;
  hasActiveFilters: boolean;
}>();

const emit = defineEmits<{
  clear: [];
}>();

const isAllCategorySelected = computed(() => categoryFilter.value === SKILLS_FILTER_ALL_VALUE);

const { t } = useI18n();

function setAllCategoryFilter(): void {
  categoryFilter.value = SKILLS_FILTER_ALL_VALUE;
}
</script>

<template>
  <UiGlassCard>
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <label class="input input-sm flex items-center" :class="[FLUID_WIDTH_CLASS, FLEX_GAP_TOKEN_CLASS.gap2]">
        <svg class="text-muted" :class="[ICON_SIZE_CLASS[4]]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="SVG_STROKE_WIDTH_DEFAULT" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
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
          :class="[TOUCH_TARGET_MIN_CLASS, GHOST_ACTION_DENSE_CLASS, isAllCategorySelected ? PRIMARY_BUTTON_VARIANT_CLASS : '']"
          :aria-label="t('skillsPage.filters.allAria')"
          :aria-pressed="isAllCategorySelected"
          @click="setAllCategoryFilter"
        >
          {{ t("skillsPage.filters.allButton") }}
        </button>
        <button 
          v-for="categoryOption in categoryOptions"
          :key="categoryOption.value"
          type="button"
          :class="[TOUCH_TARGET_MIN_CLASS, GHOST_ACTION_DENSE_CLASS, categoryFilter === categoryOption.value ? PRIMARY_BUTTON_VARIANT_CLASS : '']"
          :aria-label="t('skillsPage.filters.categoryAria', { category: categoryOption.label })"
          :aria-pressed="categoryFilter === categoryOption.value"
          @click="categoryFilter = categoryOption.value"
        >
          {{ categoryOption.label }}
        </button>
      </div>

      <div class="flex justify-end">
        <button 
          :class="[GHOST_ACTION_DENSE_CLASS]"
          :disabled="!hasActiveFilters"
          :aria-label="t('skillsPage.filters.clearAria')"
          @click.prevent="emit('clear')"
        >
          {{ t("skillsPage.filters.clearButton") }}
        </button>
      </div>
    </div>
  </UiGlassCard>
</template>
