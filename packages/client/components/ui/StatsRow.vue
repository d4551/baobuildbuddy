<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { AppIconName } from "~/components/icons/icon-registry";
import { resolveAppIconComponent } from "~/components/icons/icon-registry";
import {
  FLUID_WIDTH_CLASS,
  ICON_SIZE_CLASS,
  SHADOW_TOKEN_CLASS,
  STATS_ROW_SHELL_CLASS,
  SURFACE_GLASS_SUBTLE_CLASS,
} from "~/constants/layout";

interface StatItem {
  titleKey: string;
  value: string | number;
  valueClass?: string;
  descKey: string;
  descInterpolation?: Record<string, string | number>;
  figure?: AppIconName;
}

defineProps<{
  stats: readonly StatItem[];
  backgroundClass?: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div
    :class="[
      STATS_ROW_SHELL_CLASS,
      FLUID_WIDTH_CLASS,
      SHADOW_TOKEN_CLASS.sm,
      backgroundClass ?? `${SURFACE_GLASS_SUBTLE_CLASS} glass-card-enter glass-card-enter-0`,
    ]"
  >
    <div v-for="(stat, index) in stats" :key="index" class="stat">
      <div v-if="stat.figure" class="stat-figure text-primary" aria-hidden="true">
        <component :is="resolveAppIconComponent(stat.figure)" :class="[ICON_SIZE_CLASS['8']]" />
      </div>
      <div class="stat-title">{{ t(stat.titleKey) }}</div>
      <div class="stat-value" :class="stat.valueClass">{{ stat.value }}</div>
      <div class="stat-desc">
        {{ stat.descInterpolation ? t(stat.descKey, stat.descInterpolation) : t(stat.descKey) }}
      </div>
    </div>
  </div>
</template>
