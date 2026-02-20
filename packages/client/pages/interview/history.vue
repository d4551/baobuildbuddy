<script setup lang="ts">
import { APP_ROUTE_QUERY_KEYS, type InterviewSession } from "@bao/shared";
import { useI18n } from "vue-i18n";
import type { LocationQueryValue } from "vue-router";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const { $toast } = useNuxtApp();
const { sessions, loading, fetchSessions, getSession } = useInterview();

const selectedSessionId = ref<string | null>(null);
const selectedSession = ref<InterviewSession | null>(null);
const studioFilter = ref("");
const historyView = ref<"table" | "timeline">("table");
const detailLoading = ref(false);
const detailError = ref("");

const normalizeQuerySession = (
  value: LocationQueryValue | readonly LocationQueryValue[] | undefined,
): string | null => {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" && first.trim().length > 0 ? first : null;
  }
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

onMounted(async () => {
  const sessionsResult = await settlePromise(
    fetchSessions(),
    t("interviewHistory.fetchErrorFallback"),
  );
  if (!sessionsResult.ok) {
    $toast.error(getErrorMessage(sessionsResult.error, t("interviewHistory.fetchErrorFallback")));
  }
});

watch(
  () => route.query[APP_ROUTE_QUERY_KEYS.sessionId],
  async (nextSessionQuery) => {
    const nextSessionId = normalizeQuerySession(nextSessionQuery);
    detailError.value = "";

    if (!nextSessionId) {
      selectedSessionId.value = null;
      selectedSession.value = null;
      return;
    }

    if (selectedSessionId.value === nextSessionId && selectedSession.value) {
      return;
    }

    selectedSessionId.value = nextSessionId;
    detailLoading.value = true;
    const sessionResult = await settlePromise(
      getSession(nextSessionId),
      t("interviewHistory.detailLoadErrorFallback"),
    );
    detailLoading.value = false;

    if (!sessionResult.ok) {
      detailError.value = getErrorMessage(
        sessionResult.error,
        t("interviewHistory.detailLoadErrorFallback"),
      );
      $toast.error(detailError.value);
      selectedSession.value = null;
      return;
    }

    selectedSession.value = sessionResult.value;
    if (!selectedSession.value) {
      detailError.value = t("interviewHistory.sessionNotFound");
    }
  },
  { immediate: true },
);

const filteredSessions = computed(() => {
  if (!studioFilter.value) {
    return sessions.value;
  }
  return sessions.value.filter((session) => session.studioName === studioFilter.value);
});

const studios = computed(() =>
  [...new Set(sessions.value.map((session) => session.studioName))].filter(Boolean),
);

async function viewSessionDetail(id: string): Promise<void> {
  await router.replace({
    query: {
      ...route.query,
      [APP_ROUTE_QUERY_KEYS.sessionId]: id,
    },
  });
}

async function closeDetail(): Promise<void> {
  const nextQuery = { ...route.query };
  delete nextQuery[APP_ROUTE_QUERY_KEYS.sessionId];
  await router.replace({ query: nextQuery });
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return t("interviewHistory.notAvailable");
  }

  if (value.length === 0) {
    return t("interviewHistory.notAvailable");
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return t("interviewHistory.notAvailable");
  }

  return parsedDate.toLocaleDateString(locale.value);
}

function parseDurationMinutes(value: string): number | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const durationParts = [...normalized.matchAll(/(\d+)\s*([hms])/gi)];
  if (durationParts.length === 0) {
    return null;
  }

  let totalMinutes = 0;
  for (const [, amountText, unitText] of durationParts) {
    if (amountText === undefined || unitText === undefined) {
      continue;
    }

    const amount = Number.parseInt(amountText, 10);
    if (!Number.isFinite(amount)) {
      continue;
    }

    if (unitText === "h") {
      totalMinutes += amount * 60;
      continue;
    }

    if (unitText === "m") {
      totalMinutes += amount;
      continue;
    }

    if (unitText === "s") {
      totalMinutes += amount / 60;
    }
  }

  return totalMinutes > 0 ? Math.round(totalMinutes) : null;
}

function formatDuration(value: number | string | null): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return t("interviewHistory.minutesLabel", { count: value });
  }
  if (typeof value === "string") {
    const parsedMinutes = parseDurationMinutes(value);
    if (parsedMinutes !== null) {
      return t("interviewHistory.minutesLabel", { count: parsedMinutes });
    }
  }
  return t("interviewHistory.notAvailable");
}

function formatScore(value: number | undefined): string {
  if (!Number.isFinite(value ?? NaN)) {
    return t("interviewHistory.notAvailable");
  }
  return `${value}%`;
}

function scoreBadgeClass(value: number | undefined): string {
  if (!Number.isFinite(value ?? NaN)) {
    return "badge-warning";
  }

  if (value >= 80) return "badge-success";
  if (value >= 60) return "badge-warning";
  return "badge-error";
}

function questionScoreText(score: number | undefined): number {
  if (!Number.isFinite(score ?? NaN)) {
    return 0;
  }
  return score;
}

function getScoreBadgeClass(score: number): string {
  if (score >= 80) return "badge-success";
  if (score >= 60) return "badge-warning";
  return "badge-error";
}

function getScoreColorClass(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
}

function getTimelineLineClass(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  return "bg-error";
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">{{ t("interviewHistory.title") }}</h1>

    <LoadingSkeleton v-if="loading && !sessions.length" :lines="8" />

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card bg-base-200">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title">{{ t("interviewHistory.allSessionsTitle") }}</h2>
              <div class="flex items-center gap-2">
                <div class="join">
                  <button
                    class="join-item btn btn-sm"
                    :class="{ 'btn-active': historyView === 'table' }"
                    :aria-label="t('interviewHistory.tableAriaLabel')"
                    @click="historyView = 'table'"
                  >
                    {{ t("interviewHistory.viewModes.table") }}
                  </button>
                  <button
                    class="join-item btn btn-sm"
                    :class="{ 'btn-active': historyView === 'timeline' }"
                    :aria-label="t('interviewHistory.timelineAriaLabel')"
                    @click="historyView = 'timeline'"
                  >
                    {{ t("interviewHistory.viewModes.timeline") }}
                  </button>
                </div>
                <select
                  v-model="studioFilter"
                  class="select select-sm"
                  :aria-label="t('interviewHistory.studioFilterAria')"
                >
                  <option value="">{{ t("interviewHistory.allStudiosOption") }}</option>
                  <option v-for="studio in studios" :key="studio" :value="studio">
                    {{ studio }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="filteredSessions.length === 0" class="alert" role="status" aria-live="polite">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{{ t("interviewHistory.emptyState") }}</span>
            </div>

            <div v-else-if="historyView === 'table'" class="overflow-x-auto">
              <table class="table" :aria-label="t('interviewHistory.tableAriaLabel')">
                <thead>
                  <tr>
                    <th>{{ t("interviewHistory.columns.date") }}</th>
                    <th>{{ t("interviewHistory.columns.studio") }}</th>
                    <th>{{ t("interviewHistory.columns.role") }}</th>
                    <th>{{ t("interviewHistory.columns.score") }}</th>
                    <th>{{ t("interviewHistory.columns.duration") }}</th>
                    <th>{{ t("interviewHistory.columns.actions") }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="session in filteredSessions" :key="session.id">
                    <td>{{ formatDate(session.createdAt) }}</td>
                    <td>{{ session.studioName }}</td>
                    <td>{{ session.role }}</td>
                    <td>
                      <span class="badge" :class="scoreBadgeClass(session.score)">
                        {{ formatScore(session.score) }}
                      </span>
                    </td>
                    <td>{{ formatDuration(session.duration) }}</td>
                    <td>
                      <button
                        class="btn btn-ghost btn-xs"
                        :aria-label="t('interviewHistory.viewSessionAria', { id: session.id })"
                        @click="viewSessionDetail(session.id)"
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
                  <hr v-if="index !== 0" :class="getTimelineLineClass(session.score)" />
                  <div class="timeline-start text-sm text-base-content/70">
                    {{ formatDate(session.createdAt) }}
                  </div>
                  <div class="timeline-middle">
                    <div
                      class="radial-progress text-xs font-semibold"
                      :class="getScoreColorClass(session.score ?? 0)"
                      :style="`--value:${session.score ?? 0}; --size:2.5rem; --thickness:0.18rem;`"
                      role="progressbar"
                      :aria-valuenow="session.score ?? 0"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {{ formatScore(session.score) }}
                    </div>
                  </div>
                  <div class="timeline-end timeline-box">
                    <p class="font-semibold">{{ session.studioName }}</p>
                    <p class="text-sm text-base-content/70">{{ session.role }}</p>
                    <p class="text-xs text-base-content/60">{{ formatDuration(session.duration) }}</p>
                    <button
                      class="btn btn-ghost btn-xs mt-2"
                      :aria-label="t('interviewHistory.viewSessionAria', { id: session.id })"
                      @click="viewSessionDetail(session.id)"
                    >
                      {{ t("interviewHistory.viewButton") }}
                    </button>
                  </div>
                  <hr v-if="index !== filteredSessions.length - 1" :class="getTimelineLineClass(session.score)" />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div v-if="detailError" class="alert alert-error mb-4" role="alert">
          <span>{{ detailError }}</span>
        </div>

        <div v-if="detailLoading" class="card bg-base-200">
          <div class="card-body">
            <p role="status" aria-live="polite">{{ t("interviewHistory.loadingDetails") }}</p>
          </div>
        </div>

        <div v-else-if="selectedSession" class="card bg-base-200 sticky top-6">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h3 class="card-title text-lg">{{ t("interviewHistory.detailsTitle") }}</h3>
              <button
                class="btn btn-ghost btn-xs btn-circle"
                :aria-label="t('interviewHistory.closeDetailsAria')"
                @click="closeDetail"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <p class="text-xs text-base-content/60">{{ t("interviewHistory.detailStudioLabel") }}</p>
                <p class="font-semibold">{{ selectedSession.studioName }}</p>
              </div>

              <div>
                <p class="text-xs text-base-content/60">{{ t("interviewHistory.detailRoleLabel") }}</p>
                <p class="font-semibold">{{ selectedSession.role }}</p>
              </div>

              <div>
                <p class="text-xs text-base-content/60">{{ t("interviewHistory.detailScoreLabel") }}</p>
                <div class="flex items-center gap-2">
                  <div
                    class="radial-progress"
                    :class="getScoreColorClass(selectedSession.score ?? 0)"
                    :style="{ '--value': selectedSession.score ?? 0, '--size': '3rem' }"
                  >
                    <span class="text-sm font-bold">{{ formatScore(selectedSession.score) }}</span>
                  </div>
                </div>
              </div>

              <div>
                <p class="text-xs text-base-content/60 mb-2">{{ t("interviewHistory.questionsLabel") }}</p>
                <div class="space-y-2">
                  <div
                    v-for="(question, idx) in selectedSession.questions"
                    :key="idx"
                    class="collapse collapse-arrow bg-base-100"
                  >
                    <input
                      type="radio"
                      :name="`question-${selectedSession.id}`"
                      :aria-label="t('interviewHistory.questionAria', { index: idx + 1 })"
                    />
                    <div class="collapse-title text-sm font-medium">
                      {{ t("interviewHistory.questionHeader", { index: idx + 1, score: questionScoreText(question.score) }) }}
                    </div>
                    <div class="collapse-content text-xs">
                      <p class="font-semibold mb-1">{{ question.question }}</p>
                      <p class="text-base-content/60 mb-2">{{ question.response }}</p>
                      <p class="text-base-content/80">{{ question.feedback }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="selectedSession.overallFeedback">
                <p class="text-xs text-base-content/60 mb-1">{{ t("interviewHistory.overallFeedbackLabel") }}</p>
                <p class="text-sm">{{ selectedSession.overallFeedback }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="card bg-base-200">
          <div class="card-body text-center text-base-content/60">
            <svg class="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>{{ t("interviewHistory.selectPrompt") }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
