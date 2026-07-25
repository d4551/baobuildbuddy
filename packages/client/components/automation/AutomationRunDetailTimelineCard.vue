<script setup lang="ts">
import { useI18n } from "vue-i18n";
import ResponsiveDataSurface from "~/components/ui/ResponsiveDataSurface.vue";
import type { TimelineEntry } from "~/composables/automation-run-detail-page-contracts";
import {
  BADGE_OUTLINE_SM_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  INSET_PANEL_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  timelineEntries: readonly TimelineEntry[];
  toLocalizedDateTime: (value: string) => string;
}>();

const { t } = useI18n();
</script>

<template>
  <section :class="SURFACE_GLASS_CARD_CLASS" :aria-label="t('automation.runDetail.timeline.aria')">
    <div class="card-body">
      <h2 class="card-title">{{ t("automation.runDetail.timeline.title") }}</h2>
      <p
        v-if="timelineEntries.length === 0"
        class="text-center text-muted"
        :class="[TYPOGRAPHY_SCALE_CLASS.sm]"
      >
        {{ t("automation.runDetail.timeline.empty") }}
      </p>
      <ResponsiveDataSurface v-else>
        <template #cards>
          <ul
            class="list-none"
            :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]"
            :aria-label="t('automation.runDetail.timeline.aria')"
          >
            <li
              v-for="entry in timelineEntries"
              :key="entry.id"
 
 :class="[INSET_PANEL_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack2, PADDING_TOKEN_CLASS.p3]"
 >
              <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                <div>
                  <p class="font-semibold">{{ entry.stage }}</p>
                  <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                    {{ toLocalizedDateTime(entry.timestamp) }}
                  </p>
                </div>
                <span :class="BADGE_OUTLINE_SM_CLASS">
                  {{ t(`automation.runs.statusOptions.${entry.status}`) }}
                </span>
              </div>
              <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ entry.message }}</p>
            </li>
          </ul>
        </template>
        <template #table>
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
            </tbody>
          </table>
        </template>
      </ResponsiveDataSurface>
    </div>
  </section>
</template>
