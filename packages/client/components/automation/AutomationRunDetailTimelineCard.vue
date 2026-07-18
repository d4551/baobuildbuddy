<script setup lang="ts">
import { SHADOW_TOKEN_CLASS } from "~/constants/layout";
import { useI18n } from "vue-i18n";
import type { TimelineEntry } from "~/composables/automation-run-detail-page-contracts";

defineProps<{
  timelineEntries: readonly TimelineEntry[];
  toLocalizedDateTime: (value: string) => string;
}>();

const { t } = useI18n();
</script>

<template>
  <section class="card bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]" :aria-label="t('automation.runDetail.timeline.aria')">
    <div class="card-body">
      <h2 class="card-title">{{ t("automation.runDetail.timeline.title") }}</h2>
      <div class="overflow-x-auto">
        <table class="table table-zebra table-sm" :aria-label="t('automation.runDetail.timeline.aria')">
          <thead>
            <tr>
              <th scope="col">{{ t("automation.runDetail.timeline.columns.time") }}</th>
              <th scope="col">{{ t("automation.runDetail.timeline.columns.stage") }}</th>
              <th scope="col">{{ t("automation.runDetail.timeline.columns.status") }}</th>
              <th scope="col">{{ t("automation.runDetail.timeline.columns.message") }}</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            <tr v-for="entry in timelineEntries" :key="entry.id">
              <td>{{ toLocalizedDateTime(entry.timestamp) }}</td>
              <td>{{ entry.stage }}</td>
              <td>{{ t(`automation.runs.statusOptions.${entry.status}`) }}</td>
              <td>{{ entry.message }}</td>
            </tr>
            <tr v-if="timelineEntries.length === 0">
              <td colspan="4" class="text-center text-sm text-muted">
                {{ t("automation.runDetail.timeline.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
