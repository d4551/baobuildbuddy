<script setup lang="ts">
import { FLUID_WIDTH_CLASS, SHADOW_TOKEN_CLASS } from "~/constants/layout";
import { useI18n } from "vue-i18n";

interface StatItem {
  titleKey: string;
  value: string | number;
  valueClass?: string;
  descKey: string;
  descInterpolation?: Record<string, string | number>;
  figure?: string;
}

defineProps<{
  stats: readonly StatItem[];
  backgroundClass?: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div
    class="stats stats-vertical sm:stats-horizontal" :class="[FLUID_WIDTH_CLASS, SHADOW_TOKEN_CLASS.sm, backgroundClass ?? 'border border-base-300 bg-base-100']"
  >
    <div v-for="(stat, index) in stats" :key="index" class="stat">
      <div v-if="stat.figure" class="stat-figure text-4xl" aria-hidden="true">
        {{ stat.figure }}
      </div>
      <div class="stat-title">{{ t(stat.titleKey) }}</div>
      <div class="stat-value" :class="stat.valueClass">{{ stat.value }}</div>
      <div class="stat-desc">
        {{ stat.descInterpolation ? t(stat.descKey, stat.descInterpolation) : t(stat.descKey) }}
      </div>
    </div>
  </div>
</template>
