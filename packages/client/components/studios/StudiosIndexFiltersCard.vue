<script setup lang="ts">
import {  SURFACE_GLASS_CARD_CLASS, PADDING_TOKEN_CLASS, FLEX_GAP_TOKEN_CLASS, FLUID_WIDTH_CLASS } from "~/constants/layout";
import {  SURFACE_GLASS_CARD_CLASS, PADDING_TOKEN_CLASS, useI18n } from "vue-i18n";
import {  SURFACE_GLASS_CARD_CLASS, PADDING_TOKEN_CLASS, studioSizeLabel, studioTypeLabel } from "~/utils/labels";

defineProps<{
  studioSizeOptions: string[];
  studioTypeOptions: string[];
}>();

defineEmits<{
  clear: [];
}>();

const searchQuery = defineModel<string>("searchQuery", { required: true });
const selectedType = defineModel<string>("selectedType", { required: true });
const selectedSize = defineModel<string>("selectedSize", { required: true });
const remoteWork = defineModel<boolean>("remoteWork", { required: true });

const { t } = useI18n();
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <SectionGrid grid-token="fourColumnLg">
        <fieldset class="fieldset lg:col-span-2">
          <legend class="fieldset-legend">{{ t("studiosIndex.filters.searchLegend") }}</legend>
          <input
            v-model="searchQuery"
            type="search"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :placeholder="t('studiosIndex.filters.searchPlaceholder')"
            :aria-label="t('studiosIndex.filters.searchAria')"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("studiosIndex.filters.typeLegend") }}</legend>
          <select
            v-model="selectedType"
            class="select" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('studiosIndex.filters.typeAria')"
          >
            <option value="">{{ t("studiosIndex.filters.allTypesOption") }}</option>
            <option v-for="type in studioTypeOptions" :key="type" :value="type">
              {{ studioTypeLabel(t, type) }}
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("studiosIndex.filters.sizeLegend") }}</legend>
          <select
            v-model="selectedSize"
            class="select" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('studiosIndex.filters.sizeAria')"
          >
            <option value="">{{ t("studiosIndex.filters.allSizesOption") }}</option>
            <option v-for="size in studioSizeOptions" :key="size" :value="size">
              {{ studioSizeLabel(t, size) }}
            </option>
          </select>
        </fieldset>
      </SectionGrid>

      <div class="flex flex-wrap items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <label class="label cursor-pointer justify-start" :class="[PADDING_TOKEN_CLASS.py0, FLEX_GAP_TOKEN_CLASS.gap2]">
          <input
            v-model="remoteWork"
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            :aria-label="t('studiosIndex.filters.remoteAria')"
          />
          <span class="label">{{ t("studiosIndex.filters.remoteLabel") }}</span>
        </label>

        <button class="btn btn-ghost btn-sm" :aria-label="t('studiosIndex.filters.clearAria')" @click="$emit('clear')">
          {{ t("studiosIndex.filters.clearButton") }}
        </button>
      </div>
    </div>
  </div>
</template>
