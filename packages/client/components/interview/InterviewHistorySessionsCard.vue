<script setup lang="ts">
import type { InterviewSession } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import UiRadialMeter from "~/components/ui/UiRadialMeter.vue";
import type { InterviewHistoryView } from "~/composables/useInterviewHistoryPage";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const props = defineProps<{
  filteredSessions: InterviewSession[];
  studios: string[];
  historyView: InterviewHistoryView;
  studioFilter: string;
  formatDate: (value: string | undefined) => string;
  formatDuration: (value: number | string | null) => string;
  formatScore: (value: number | undefined) => string;
  scoreBadgeClass: (value: number | undefined) => string;
  getScoreColorClass: (value: number | undefined) => string;
  getTimelineLineClass: (value: number | undefined) => string;
}>();

const emit = defineEmits<{
  "update:historyView": [value: InterviewHistoryView];
  "update:studioFilter": [value: string];
  view: [id: string];
}>();

const { t } = useI18n();

const selectHistoryView = (value: InterviewHistoryView): void => {
  emit("update:historyView", value);
};

const updateStudioFilter = (event: Event): void => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  emit("update:studioFilter", target.value);
};

const viewSession = (id: string): void => {
  emit("view", id);
};
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3, MARGIN_TOKEN_CLASS.mb4]">
        <h2 class="card-title">{{ t("interviewHistory.allSessionsTitle") }}</h2>
        <div class="flex flex-col sm:flex-row sm:items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <div class="join">
            <button 
              class="join-item btn btn-sm btn-ghost"
              :class="{ 'btn-active': historyView === 'table' }"
              :aria-label="t('interviewHistory.tableAriaLabel')"
              @click="selectHistoryView('table')"
            >
              {{ t("interviewHistory.viewModes.table") }}
            </button>
            <button 
              class="join-item btn btn-sm btn-ghost"
              :class="{ 'btn-active': historyView === 'timeline' }"
              :aria-label="t('interviewHistory.timelineAriaLabel')"
              @click="selectHistoryView('timeline')"
            >
              {{ t("interviewHistory.viewModes.timeline") }}
            </button>
          </div>
          <select 
            :value="studioFilter"
            class="select select-sm"
            :aria-label="t('interviewHistory.studioFilterAria')"
            @change="updateStudioFilter"
          >
            <option value="">{{ t("interviewHistory.allStudiosOption") }}</option>
            <option v-for="studio in studios" :key="studio" :value="studio">
              {{ studio }}
            </option>
          </select>
        </div>
      </div>

      <EmptyState
        v-if="filteredSessions.length === 0"
        title-key="interviewHistory.emptyStateTitle"
        description-key="interviewHistory.emptyStateDescription"
      />

      <div v-else-if="historyView === 'table'" class="overflow-x-auto">
        <table class="table table-zebra" :aria-label="t('interviewHistory.tableAriaLabel')">
          <thead>
            <tr>
              <th scope="col">{{ t("interviewHistory.columns.date") }}</th>
              <th scope="col">{{ t("interviewHistory.columns.studio") }}</th>
              <th scope="col">{{ t("interviewHistory.columns.role") }}</th>
              <th scope="col">{{ t("interviewHistory.columns.score") }}</th>
              <th scope="col">{{ t("interviewHistory.columns.duration") }}</th>
              <th scope="col">{{ t("interviewHistory.columns.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in filteredSessions" :key="session.id">
              <td>{{ props.formatDate(session.createdAt) }}</td>
              <td>{{ session.studioName }}</td>
              <td>{{ session.role }}</td>
              <td>
                <span class="badge" :class="props.scoreBadgeClass(session.score)">
                  {{ props.formatScore(session.score) }}
                </span>
              </td>
              <td>{{ props.formatDuration(session.duration ?? 0) }}</td>
              <td>
                <button 
                  class="btn btn-ghost btn-xs"
                  :aria-label="t('interviewHistory.viewSessionAria', { id: session.id })"
                  @click="viewSession(session.id)"
                >
                  {{ t("interviewHistory.viewButton") }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="overflow-x-auto" :class="[PADDING_TOKEN_CLASS.py2]" v-else>
        <ul class="timeline timeline-vertical timeline-compact" :class="[FLUID_WIDTH_CLASS]">
          <li v-for="(session, index) in filteredSessions" :key="session.id">
            <hr v-if="index !== 0" :class="props.getTimelineLineClass(session.score)" />
            <div class="timeline-start text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ props.formatDate(session.createdAt) }}
            </div>
            <div class="timeline-middle">
              <UiRadialMeter :class="[ICON_SIZE_CLASS[12]]" :value="session.score ?? 0" size- fill-class="stroke-primary" :aria-label="t('interviewHistory.timelineScoreAria', { score: session.score ?? 0 })">
                <span class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ props.formatScore(session.score) }}</span>
              </UiRadialMeter>
            </div>
            <div class="timeline-end timeline-box">
              <p class="font-semibold">{{ session.studioName }}</p>
              <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ session.role }}</p>
              <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ props.formatDuration(session.duration ?? 0) }}</p>
              <button 
                class="btn btn-ghost btn-xs" :class="[MARGIN_TOKEN_CLASS.mt2]"
                :aria-label="t('interviewHistory.viewSessionAria', { id: session.id })"
                @click="viewSession(session.id)"
              >
                {{ t("interviewHistory.viewButton") }}
              </button>
            </div>
            <hr 
              v-if="index !== filteredSessions.length - 1"
              :class="props.getTimelineLineClass(session.score)"
            />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
