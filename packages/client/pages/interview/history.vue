<script setup lang="ts">
import {
  APP_ROUTE_QUERY_KEYS,
  DECIMAL_RADIX,
  type InterviewSession,
  SCORE_PASS_THRESHOLD,
  SCORE_WARNING_THRESHOLD,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import type { LocationQueryValue } from "vue-router";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";
import { formatDateWithLocale } from "~/utils/locale-format";

const route = useRoute();
const router = useRouter();
const { t, locale, fallbackLocale } = useI18n();
const { $toast } = useNuxtApp();
const { sessions, loading, fetchSessions, getSession } = useInterview();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("interviewHistory.title"),
    description: t("interviewHub.seoDescription"),
  });
}

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
    const [first] = value.filter((entry): entry is string => typeof entry === "string");
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

  const formattedDate = formatDateWithLocale(parsedDate, locale.value, fallbackLocale.value, {
    dateStyle: "medium",
  });
  return formattedDate ?? t("interviewHistory.notAvailable");
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

    const amount = Number.parseInt(amountText, DECIMAL_RADIX);
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

  const validScore = value ?? 0;
  if (validScore >= SCORE_PASS_THRESHOLD) return "badge-success";
  if (validScore >= SCORE_WARNING_THRESHOLD) return "badge-warning";
  return "badge-error";
}

function questionScoreText(score: number | undefined): number {
  if (!Number.isFinite(score ?? NaN)) {
    return 0;
  }
  return score ?? 0;
}

function getScoreColorClass(score: number | undefined): string {
  if (!Number.isFinite(score ?? NaN)) return "text-warning";
  const validScore = score ?? 0;
  if (validScore >= SCORE_PASS_THRESHOLD) return "text-success";
  if (validScore >= SCORE_WARNING_THRESHOLD) return "text-warning";
  return "text-error";
}

function getTimelineLineClass(score: number | undefined): string {
  if (!Number.isFinite(score ?? NaN)) return "bg-warning";
  const validScore = score ?? 0;
  if (validScore >= SCORE_PASS_THRESHOLD) return "bg-success";
  if (validScore >= SCORE_WARNING_THRESHOLD) return "bg-warning";
  return "bg-error";
}
</script>

<template>
  <PageScaffold tag="section" labelled-by="interview-history-title">
    <PageHeroHeader
      title-id="interview-history-title"
      :title="t('interviewHistory.title')"
      :description="t('interviewHistory.subtitle')"
    />

    <LoadingSkeleton v-if="loading && !sessions.length" :lines="8" />

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 space-y-6">
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
                    @click="historyView = 'table'"
                  >
                    {{ t("interviewHistory.viewModes.table") }}
                  </button>
                  <button
                    class="join-item btn btn-sm btn-ghost"
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
                    <td>{{ formatDate(session.createdAt) }}</td>
                    <td>{{ session.studioName }}</td>
                    <td>{{ session.role }}</td>
                    <td>
                      <span class="badge" :class="scoreBadgeClass(session.score)">
                        {{ formatScore(session.score) }}
                      </span>
                    </td>
                    <td>{{ formatDuration(session.duration ?? 0) }}</td>
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
                      :aria-label="t('interviewHistory.timelineScoreAria', { score: session.score ?? 0 })"
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
                    <p class="text-xs text-base-content/60">{{ formatDuration(session.duration ?? 0) }}</p>
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
        <BootstrapErrorAlert
          v-if="detailError"
          :message="detailError"
          :retry-label="t('interviewHistory.retryButtonLabel')"
          :retry-aria-label="t('interviewHistory.retryAria')"
          @retry="() => selectedSessionId && viewSessionDetail(selectedSessionId)"
        />

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
                type="button"
                class="btn btn-ghost btn-xs btn-circle"
                :aria-label="t('interviewHistory.closeDetailsAria')"
                @click="closeDetail"
              >
                <CloseIcon class="h-4 w-4" />
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
                    role="progressbar"
                    :aria-label="t('interviewHistory.detailScoreAria', { score: selectedSession.score ?? 0 })"
                    :aria-valuenow="selectedSession.score ?? 0"
                    aria-valuemin="0"
                    aria-valuemax="100"
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
          <div class="card-body">
            <EmptyState
              title-key="interviewHistory.selectPromptTitle"
              description-key="interviewHistory.selectPromptDescription"
            />
          </div>
        </div>
      </div>
    </div>
  </PageScaffold>
</template>
