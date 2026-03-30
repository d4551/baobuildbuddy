<script setup lang="ts">
import {
  AUTOMATION_RUN_STATUSES,
  type AutomationRunUiState,
  type RpaRunEvent,
  type RpaRunExecutionEnvelope,
} from "@bao/shared";
import { useI18n } from "vue-i18n";

const [RUN_STATUS_PENDING, RUN_STATUS_RUNNING, RUN_STATUS_SUCCESS, RUN_STATUS_ERROR] =
  AUTOMATION_RUN_STATUSES;
const TERMINAL_RUN_STATUSES = new Set<RpaRunExecutionEnvelope["status"]>([
  RUN_STATUS_SUCCESS,
  RUN_STATUS_ERROR,
]);

const props = defineProps<{
  activeRunId: string;
  eventRows: RpaRunEvent[];
  run: RpaRunExecutionEnvelope | null;
  runDetailRoute: (id: string) => string;
  streamErrorMessage: string;
  streamState: AutomationRunUiState;
  toLocalizedDateTime: (value: string) => string;
}>();

const emit = defineEmits<{
  cancel: [];
  retry: [];
}>();

const { t } = useI18n();

const isStreamLoading = computed<boolean>(() => props.streamState === "loading");
const streamStatusLabel = computed<string>(() => {
  const currentStatus = props.run?.status ?? RUN_STATUS_PENDING;
  return t(`automation.runs.statusOptions.${currentStatus}`);
});
const streamProgressValue = computed<number>(() => {
  const progress = props.run?.progress;
  if (typeof progress === "number" && Number.isFinite(progress)) {
    return Math.max(0, Math.min(100, progress));
  }
  return 0;
});
const streamCurrentStep = computed<number | null>(() => props.run?.currentStep ?? null);
const streamTotalSteps = computed<number | null>(() => props.run?.totalSteps ?? null);
const streamStateLabelKey = computed<string>(
  () => `automation.jobApply.stream.states.${props.streamState}`,
);
const lifecycleStepClasses = computed<[string, string, string]>(() => {
  const runStatus = props.run?.status ?? RUN_STATUS_PENDING;
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

function resolveStreamEventStageLabel(event: RpaRunEvent): string {
  return t(`automation.jobApply.stream.eventType.${event.eventType}`);
}

function resolveStreamEventStatusLabel(event: RpaRunEvent): string {
  if (event.eventType === "progress") {
    return t(`automation.runs.statusOptions.${event.status}`);
  }
  if (event.eventType === "result") {
    return event.result.success
      ? t(`automation.runs.statusOptions.${RUN_STATUS_SUCCESS}`)
      : t(`automation.runs.statusOptions.${RUN_STATUS_ERROR}`);
  }
  return t(`automation.runs.statusOptions.${RUN_STATUS_ERROR}`);
}

function resolveStreamEventMessage(event: RpaRunEvent): string {
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
}
</script>

<template>
  <div class="card card-border bg-base-100 shadow-sm">
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
          :to="runDetailRoute(activeRunId)"
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
          @click="emit('retry')"
        >
          {{ t("automation.jobApply.stream.retryButton") }}
        </button>
        <button
          type="button"
          class="btn btn-sm btn-ghost"
          :aria-label="t('automation.jobApply.stream.cancelAria')"
          @click="emit('cancel')"
        >
          {{ t("automation.jobApply.stream.cancelButton") }}
        </button>
      </div>

      <BootstrapErrorAlert
        v-if="streamErrorMessage"
        class="mt-4"
        :title="t('automation.jobApply.stream.errorTitle')"
        :message="streamErrorMessage"
        :retry-label="t('automation.jobApply.stream.retryButton')"
        :retry-aria-label="t('automation.jobApply.stream.retryAria')"
        @retry="emit('retry')"
      />

      <section class="mt-4" :aria-label="t('automation.jobApply.stream.eventsAria')">
        <h3 class="font-semibold">{{ t("automation.jobApply.stream.eventsTitle") }}</h3>
        <div class="overflow-x-auto mt-2">
          <table class="table table-zebra table-sm" :aria-label="t('automation.jobApply.stream.eventsAria')">
            <thead>
              <tr>
                <th scope="col">{{ t("automation.jobApply.stream.events.columns.timestamp") }}</th>
                <th scope="col">{{ t("automation.jobApply.stream.events.columns.stage") }}</th>
                <th scope="col">{{ t("automation.jobApply.stream.events.columns.status") }}</th>
                <th scope="col">{{ t("automation.jobApply.stream.events.columns.message") }}</th>
              </tr>
            </thead>
            <tbody aria-live="polite">
              <tr v-for="event in eventRows" :key="`${event.runId}-${event.sequence}`">
                <td>{{ toLocalizedDateTime(event.timestamp) }}</td>
                <td>{{ resolveStreamEventStageLabel(event) }}</td>
                <td>{{ resolveStreamEventStatusLabel(event) }}</td>
                <td>{{ resolveStreamEventMessage(event) }}</td>
              </tr>
              <tr v-if="eventRows.length === 0">
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
</template>
