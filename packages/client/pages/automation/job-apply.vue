<script setup lang="ts">
import {
  API_ENDPOINTS,
  APP_ROUTE_BUILDERS,
  AUTOMATION_RUN_STATUSES,
  type RpaRunEvent,
  type RpaRunExecutionEnvelope,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { useAutomationRunStream } from "~/composables/useAutomationRunStream";
import { resolveApiEndpoint } from "~/utils/endpoints";
import { getErrorMessage } from "~/utils/errors";
import { formatDateWithLocale } from "~/utils/locale-format";

const [RUN_STATUS_PENDING, RUN_STATUS_RUNNING, RUN_STATUS_SUCCESS, RUN_STATUS_ERROR] =
  AUTOMATION_RUN_STATUSES;

const TERMINAL_RUN_STATUSES = new Set([RUN_STATUS_SUCCESS, RUN_STATUS_ERROR]);
const DATE_FORMAT_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
} as const satisfies Intl.DateTimeFormatOptions;

const { t, locale, fallbackLocale } = useI18n();
const { triggerJobApply, scheduleJobApply } = useAutomation();
const requestUrl = useRequestURL();
const apiBase = String(useRuntimeConfig().public.apiBase || "/");
const runStream = useAutomationRunStream();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("automation.jobApply.title"),
    description: t("automation.hub.cards.jobApply.description"),
  });
}

interface FormState {
  jobUrl: string;
  resumeId: string;
  coverLetterId: string;
  jobId: string;
  runAt: string;
}

const { data: resumesData } = await useFetch<{ id: string; name?: string }[]>(
  resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.resumes),
  {
    method: "GET",
  },
);

const { data: coverLettersData } = await useFetch<
  { id: string; company?: string; position?: string }[]
>(resolveApiEndpoint(apiBase, requestUrl, API_ENDPOINTS.coverLetters), { method: "GET" });

const form = reactive<FormState>({
  jobUrl: "",
  resumeId: "",
  coverLetterId: "",
  jobId: "",
  runAt: "",
});

const pending = ref(false);
const submitError = ref("");
const startedRunId = ref("");
const scheduledRun = ref<RpaRunExecutionEnvelope | null>(null);

const streamRun = computed(() => runStream.run.value);
const streamState = computed(() => runStream.state.value);
const streamEvents = computed<readonly RpaRunEvent[]>(() => runStream.events.value);
const streamError = computed(() => runStream.streamError.value);
const activeRunId = computed<string>(() => streamRun.value?.id ?? startedRunId.value);
const hasActiveRun = computed<boolean>(() => activeRunId.value.length > 0);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStreamLoading = computed<boolean>(() => streamState.value === "loading");
const streamStatusLabel = computed<string>(() => {
  const currentStatus = streamRun.value?.status ?? RUN_STATUS_PENDING;
  return t(`automation.runs.statusOptions.${currentStatus}`);
});
const streamProgressValue = computed<number>(() => {
  const progress = streamRun.value?.progress;
  if (typeof progress === "number" && Number.isFinite(progress)) {
    return Math.max(0, Math.min(100, progress));
  }
  return 0;
});
const streamCurrentStep = computed<number | null>(() => streamRun.value?.currentStep ?? null);
const streamTotalSteps = computed<number | null>(() => streamRun.value?.totalSteps ?? null);
const streamStateLabelKey = computed<string>(
  () => `automation.jobApply.stream.states.${streamState.value}`,
);
const streamTimelineRows = computed<RpaRunEvent[]>(() =>
  [...streamEvents.value].slice(-12).reverse(),
);

const lifecycleStepClasses = computed<[string, string, string]>(() => {
  const runStatus = streamRun.value?.status ?? RUN_STATUS_PENDING;
  const queueStep = "step step-primary";
  const runningStep =
    runStatus === RUN_STATUS_RUNNING || TERMINAL_RUN_STATUSES.has(runStatus)
      ? "step step-primary"
      : "step";
  const completionStep =
    runStatus === RUN_STATUS_SUCCESS
      ? "step step-success"
      : runStatus === RUN_STATUS_ERROR
        ? "step step-error"
        : "step";
  return [queueStep, runningStep, completionStep];
});

const toLocalizedDateTime = (value: string): string => {
  const formatted = formatDateWithLocale(
    value,
    locale.value,
    fallbackLocale.value,
    DATE_FORMAT_OPTIONS,
  );
  return formatted ?? value;
};

const resolveScheduledRunAt = (run: RpaRunExecutionEnvelope): string => {
  const runInput = run.input;
  if (!runInput || !isRecord(runInput)) {
    return run.createdAt;
  }
  const scheduleValue = runInput.schedule;
  if (!isRecord(scheduleValue)) {
    return run.createdAt;
  }
  return typeof scheduleValue.runAt === "string" && scheduleValue.runAt.length > 0
    ? scheduleValue.runAt
    : run.createdAt;
};

const resolveStreamEventStageLabel = (event: RpaRunEvent): string =>
  t(`automation.jobApply.stream.eventType.${event.eventType}`);

const resolveStreamEventStatusLabel = (event: RpaRunEvent): string => {
  if (event.eventType === "progress") {
    return t(`automation.runs.statusOptions.${event.status}`);
  }
  if (event.eventType === "result") {
    return event.result.success
      ? t(`automation.runs.statusOptions.${RUN_STATUS_SUCCESS}`)
      : t(`automation.runs.statusOptions.${RUN_STATUS_ERROR}`);
  }
  return t(`automation.runs.statusOptions.${RUN_STATUS_ERROR}`);
};

const resolveStreamEventMessage = (event: RpaRunEvent): string => {
  if (event.eventType === "progress") {
    return event.message?.trim() || event.action.trim();
  }
  if (event.eventType === "result") {
    if (event.result.success) {
      return t("automation.jobApply.stream.eventMessages.resultSuccess");
    }
    return event.result.error || t("automation.jobApply.stream.eventMessages.resultError");
  }
  return event.error.message || t("automation.jobApply.stream.eventMessages.protocolError");
};

async function submitJobApply(): Promise<void> {
  submitError.value = "";
  startedRunId.value = "";
  scheduledRun.value = null;
  pending.value = true;

  const coverLetterId = form.coverLetterId.trim();
  const jobId = form.jobId.trim();
  const body = {
    jobUrl: form.jobUrl.trim(),
    resumeId: form.resumeId,
    ...(coverLetterId ? { coverLetterId } : {}),
    ...(jobId ? { jobId } : {}),
  };

  const submitResult = await settlePromise(
    triggerJobApply(body),
    t("automation.jobApply.submitErrorFallback"),
  );
  pending.value = false;

  if (!submitResult.ok) {
    submitError.value = getErrorMessage(
      submitResult.error,
      t("automation.jobApply.submitErrorFallback"),
    );
    return;
  }

  const startedRun = submitResult.value;
  startedRunId.value = startedRun.id;
  const streamStartResult = await settlePromise(
    runStream.start(startedRun.id),
    t("automation.jobApply.stream.startErrorFallback"),
  );
  if (!streamStartResult.ok) {
    submitError.value = getErrorMessage(
      streamStartResult.error,
      t("automation.jobApply.stream.startErrorFallback"),
    );
  }
}

function toIsoTimestamp(dateTimeLocal: string): string | null {
  const parsed = new Date(dateTimeLocal);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  if (parsed.getTime() <= Date.now()) {
    return null;
  }
  return parsed.toISOString();
}

async function submitScheduledJobApply(): Promise<void> {
  submitError.value = "";
  startedRunId.value = "";
  scheduledRun.value = null;
  runStream.cancel();
  pending.value = true;

  const runAt = toIsoTimestamp(form.runAt);
  if (!runAt) {
    submitError.value = t("automation.jobApply.schedule.invalidRunAt");
    pending.value = false;
    return;
  }

  const coverLetterId = form.coverLetterId.trim();
  const jobId = form.jobId.trim();
  const body = {
    jobUrl: form.jobUrl.trim(),
    resumeId: form.resumeId,
    ...(coverLetterId ? { coverLetterId } : {}),
    ...(jobId ? { jobId } : {}),
    runAt,
  };

  const scheduledResult = await settlePromise(
    scheduleJobApply(body),
    t("automation.jobApply.submitErrorFallback"),
  );
  pending.value = false;

  if (!scheduledResult.ok) {
    submitError.value = getErrorMessage(
      scheduledResult.error,
      t("automation.jobApply.submitErrorFallback"),
    );
    return;
  }

  scheduledRun.value = scheduledResult.value;
}
</script>

<template>
  <PageScaffold tag="section" width-token="content" labelled-by="automation-job-apply-title">
    <PageHeaderBlock
      title-id="automation-job-apply-title"
      :title="t('automation.jobApply.title')"
      :description="t('automation.hub.cards.jobApply.description')"
    />

    <div class="card card-border bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.jobApply.jobUrlLegend") }}</legend>
            <input
              v-model="form.jobUrl"
              type="url"
              class="input w-full"
              :placeholder="t('automation.jobApply.jobUrlPlaceholder')"
              :aria-label="t('automation.jobApply.jobUrlAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.jobApply.resumeLegend") }}</legend>
            <select
              v-model="form.resumeId"
              class="select w-full"
              :aria-label="t('automation.jobApply.resumeAria')"
            >
              <option value="" disabled>{{ t("automation.jobApply.selectResumeOption") }}</option>
              <option v-for="resume in resumesData || []" :key="resume.id" :value="resume.id">
                {{ resume.name || t("automation.jobApply.resumeFallbackName", { id: resume.id }) }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.jobApply.coverLetterLegend") }}</legend>
            <select
              v-model="form.coverLetterId"
              class="select w-full"
              :aria-label="t('automation.jobApply.coverLetterAria')"
            >
              <option value="">{{ t("automation.jobApply.noCoverLetterOption") }}</option>
              <option v-for="letter in coverLettersData || []" :key="letter.id" :value="letter.id">
                {{
                  t("automation.jobApply.coverLetterOption", {
                    company: letter.company || t("automation.jobApply.unknownCompany"),
                    position: letter.position || t("automation.jobApply.unknownPosition"),
                  })
                }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.jobApply.jobIdLegend") }}</legend>
            <input
              v-model="form.jobId"
              class="input w-full"
              :placeholder="t('automation.jobApply.jobIdPlaceholder')"
              :aria-label="t('automation.jobApply.jobIdAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.jobApply.schedule.legend") }}</legend>
            <input
              v-model="form.runAt"
              type="datetime-local"
              class="input w-full"
              :aria-label="t('automation.jobApply.schedule.aria')"
            />
            <p class="validator-hint">{{ t("automation.jobApply.schedule.hint") }}</p>
          </fieldset>
        </div>

        <div class="mt-6 join">
          <button
            class="btn btn-primary join-item"
            :disabled="pending || !form.jobUrl || !form.resumeId"
            :aria-label="t('automation.jobApply.runButtonAria')"
            @click="submitJobApply"
          >
            <span v-if="pending" class="loading loading-spinner loading-sm"></span>
            <span v-else>{{ t("automation.jobApply.runButton") }}</span>
          </button>
          <button
            class="btn btn-outline join-item"
            :disabled="pending || !form.jobUrl || !form.resumeId || !form.runAt"
            :aria-label="t('automation.jobApply.schedule.buttonAria')"
            @click="submitScheduledJobApply"
          >
            <span v-if="pending" class="loading loading-spinner loading-sm"></span>
            <span v-else>{{ t("automation.jobApply.schedule.button") }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="submitError" role="alert" class="alert alert-error" aria-live="assertive">
      <h3 class="font-semibold">{{ t("automation.jobApply.submitErrorTitle") }}</h3>
      <p>{{ submitError }}</p>
    </div>

    <div v-if="hasActiveRun" class="card card-border bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">{{ t("automation.jobApply.stream.title") }}</h2>
        <p class="text-sm text-base-content/70">{{ t("automation.jobApply.stream.subtitle") }}</p>

        <ul class="steps steps-vertical mt-2 w-full lg:steps-horizontal">
          <li :class="lifecycleStepClasses[0]">{{ t("automation.jobApply.stream.steps.queued") }}</li>
          <li :class="lifecycleStepClasses[1]">{{ t("automation.jobApply.stream.steps.running") }}</li>
          <li :class="lifecycleStepClasses[2]">{{ t("automation.jobApply.stream.steps.completed") }}</li>
        </ul>

        <div
          class="stats stats-vertical bg-base-200 mt-4 lg:stats-horizontal"
          :aria-label="t('automation.jobApply.stream.aria')"
        >
          <div class="stat">
            <div class="stat-title">{{ t("automation.jobApply.stream.runIdTitle") }}</div>
            <div class="stat-value text-base">{{ activeRunId }}</div>
            <div class="stat-desc">{{ t(streamStateLabelKey) }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">{{ t("automation.jobApply.stream.statusTitle") }}</div>
            <div class="stat-value text-base">{{ streamStatusLabel }}</div>
            <div class="stat-desc">{{ t("automation.jobApply.stream.stateLabel") }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">{{ t("automation.jobApply.stream.progressTitle") }}</div>
            <div class="stat-value text-base">{{ streamProgressValue }}%</div>
            <div class="stat-desc">
              {{
                t("automation.jobApply.stream.currentStepLabel", {
                  current: streamCurrentStep ?? 0,
                  total: streamTotalSteps ?? 0,
                })
              }}
            </div>
            <progress
              class="progress progress-primary mt-2"
              :value="streamProgressValue"
              max="100"
              :aria-label="t('automation.jobApply.stream.progressAria')"
            ></progress>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <NuxtLink
            :to="APP_ROUTE_BUILDERS.automationRunDetail(activeRunId)"
            class="btn btn-sm btn-outline"
            :aria-label="t('automation.jobApply.openRunDetailAria', { id: activeRunId })"
          >
            {{ t("automation.jobApply.openRunDetailLink") }}
          </NuxtLink>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            :disabled="isStreamLoading"
            :aria-label="t('automation.jobApply.stream.retryAria')"
            @click="runStream.retry()"
          >
            {{ t("automation.jobApply.stream.retryButton") }}
          </button>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            :aria-label="t('automation.jobApply.stream.cancelAria')"
            @click="runStream.cancel()"
          >
            {{ t("automation.jobApply.stream.cancelButton") }}
          </button>
        </div>

        <div v-if="streamError" role="alert" class="alert alert-error mt-4" aria-live="assertive">
          <h3 class="font-semibold">{{ t("automation.jobApply.stream.errorTitle") }}</h3>
          <p>{{ streamError.message }}</p>
        </div>

        <section class="mt-4" :aria-label="t('automation.jobApply.stream.eventsAria')">
          <h3 class="font-semibold">{{ t("automation.jobApply.stream.eventsTitle") }}</h3>
          <div class="overflow-x-auto mt-2">
            <table class="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>{{ t("automation.jobApply.stream.events.columns.timestamp") }}</th>
                  <th>{{ t("automation.jobApply.stream.events.columns.stage") }}</th>
                  <th>{{ t("automation.jobApply.stream.events.columns.status") }}</th>
                  <th>{{ t("automation.jobApply.stream.events.columns.message") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="event in streamTimelineRows" :key="`${event.runId}-${event.sequence}`">
                  <td>{{ toLocalizedDateTime(event.timestamp) }}</td>
                  <td>{{ resolveStreamEventStageLabel(event) }}</td>
                  <td>{{ resolveStreamEventStatusLabel(event) }}</td>
                  <td>{{ resolveStreamEventMessage(event) }}</td>
                </tr>
                <tr v-if="streamTimelineRows.length === 0">
                  <td colspan="4" class="text-center text-sm text-base-content/60">
                    {{ t("automation.jobApply.stream.events.empty") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>

    <div v-if="scheduledRun" class="card card-border bg-base-100 shadow-sm">
      <div class="card-body">
        <div role="alert" class="alert alert-info">
          <h3 class="font-semibold">{{ t("automation.jobApply.schedule.createdTitle") }}</h3>
          <div>
            <p class="mb-1">{{ t("automation.jobApply.runIdLabel", { id: scheduledRun.id }) }}</p>
            <p class="mb-1 text-sm">
              {{
                t("automation.jobApply.schedule.scheduledForLabel", {
                  date: toLocalizedDateTime(resolveScheduledRunAt(scheduledRun)),
                })
              }}
            </p>
            <p class="text-sm">{{ t("automation.jobApply.statusLabel", { status: scheduledRun.status }) }}</p>
            <NuxtLink
              :to="APP_ROUTE_BUILDERS.automationRunDetail(scheduledRun.id)"
              class="link link-primary link-hover"
              :aria-label="t('automation.jobApply.openRunDetailAria', { id: scheduledRun.id })"
            >
              {{ t("automation.jobApply.openRunDetailLink") }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </PageScaffold>
</template>
