<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { resolveAppIconComponent } from "~/components/icons/icon-registry";
import {
  ICON_SIZE_CLASS,
  SHADOW_TOKEN_CLASS,
  STATS_SHELL_VARIANT_CLASS,
  SURFACE_GLASS_SUBTLE_CLASS,
} from "~/constants/layout";

import type { StatItem } from "~/types/ui-components";

defineProps<{
  stats: readonly StatItem[];
  backgroundClass?: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div
    :class="[STATS_SHELL_VARIANT_CLASS.sm, SHADOW_TOKEN_CLASS.sm, backgroundClass ?? `border border-base-300 ${SURFACE_GLASS_SUBTLE_CLASS} glass-card-enter glass-card-enter-0`]"
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
