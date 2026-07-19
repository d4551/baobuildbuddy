<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { resolveAppIconComponent } from "~/components/icons/icon-registry";
import {
  FLEX_GAP_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  RADIUS_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
} from "~/constants/layout";
import { AUTOMATION_COVERAGE_ITEMS, type AutomationCoverageItem } from "./automation-visuals";

const props = defineProps<{
  manualRunAvailable: boolean;
  scheduledRunAvailable: boolean;
  runHistoryAvailable: boolean;
  liveUpdatesAvailable: boolean;
}>();

const { t } = useI18n();

const coverageEnabledById = computed<Record<AutomationCoverageItem["id"], boolean>>(() => ({
  manual: props.manualRunAvailable,
  scheduled: props.scheduledRunAvailable,
  history: props.runHistoryAvailable,
  live: props.liveUpdatesAvailable,
}));

function resolveCoverageClass(item: AutomationCoverageItem): string {
  return coverageEnabledById.value[item.id]
    ? "border-success/40 bg-success/10 text-success"
    : "border-base-300 bg-base-100 text-muted";
}
</script>

<template>
  <div
    class="flex flex-wrap items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]"
    :aria-label="t('automation.hub.audit.coverageAria')"
  >
    <span
      v-for="item in AUTOMATION_COVERAGE_ITEMS"
      :key="item.id"
      class="tooltip tooltip-bottom"
      :data-tip="t(item.labelKey)"
    >
      <span
 class="inline-flex items-center justify-center border" 
      >
        <component :is="resolveAppIconComponent(item.iconName)" :class="[ICON_SIZE_CLASS['4']]" aria-hidden="true" />
        <span class="sr-only">{{ t(item.labelKey) }}</span>
      </span>
    </span>
  </div>
</template>
