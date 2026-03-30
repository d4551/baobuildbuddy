<script setup lang="ts">
import type { InterviewSession } from "@bao/shared";
import { useI18n } from "vue-i18n";
import type { InterviewHistoryView } from "~/composables/useInterviewHistoryPage";

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
  <div class="card bg-base-200">
    <div class="card-body">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="card-title">{{ t("interviewHistory.allSessionsTitle") }}</h2>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
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

      <div v-else class="overflow-x-auto py-2">
        <ul class="timeline timeline-vertical timeline-compact w-full">
          <li v-for="(session, index) in filteredSessions" :key="session.id">
            <hr v-if="index !== 0" :class="props.getTimelineLineClass(session.score)" />
            <div class="timeline-start text-sm text-base-content/70">
              {{ props.formatDate(session.createdAt) }}
            </div>
            <div class="timeline-middle">
              <div
                class="radial-progress text-xs font-semibold"
                :class="props.getScoreColorClass(session.score ?? 0)"
                :style="`--value:${session.score ?? 0}; --size:2.5rem; --thickness:0.18rem;`"
                role="progressbar"
                :aria-label="t('interviewHistory.timelineScoreAria', { score: session.score ?? 0 })"
                :aria-valuenow="session.score ?? 0"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {{ props.formatScore(session.score) }}
              </div>
            </div>
            <div class="timeline-end timeline-box">
              <p class="font-semibold">{{ session.studioName }}</p>
              <p class="text-sm text-base-content/70">{{ session.role }}</p>
              <p class="text-xs text-base-content/60">{{ props.formatDuration(session.duration ?? 0) }}</p>
              <button
                class="btn btn-ghost btn-xs mt-2"
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
