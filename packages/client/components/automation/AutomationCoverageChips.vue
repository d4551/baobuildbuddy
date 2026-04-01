<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { resolveAppIconComponent } from "~/components/icons/icon-registry";
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
    : "border-base-300 bg-base-100 text-base-content/55";
}
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-2"
    :aria-label="t('automation.hub.audit.coverageAria')"
  >
    <span
      v-for="item in AUTOMATION_COVERAGE_ITEMS"
      :key="item.id"
      class="tooltip tooltip-bottom"
      :data-tip="t(item.labelKey)"
    >
      <span
        class="inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-sm"
        :class="resolveCoverageClass(item)"
      >
        <component :is="resolveAppIconComponent(item.iconName)" class="h-4 w-4" aria-hidden="true" />
        <span class="sr-only">{{ t(item.labelKey) }}</span>
      </span>
    </span>
  </div>
</template>
