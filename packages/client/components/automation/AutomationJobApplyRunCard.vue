<script setup lang="ts">
import { AUTOMATION_RUN_STATUSES } from "@bao/shared/constants/automation";
import type { RpaRunEvent, RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import type { AutomationRunUiState } from "@bao/shared/schemas/rpa-protocol.schema";
import { useI18n } from "vue-i18n";
import ResponsiveDataSurface from "~/components/ui/ResponsiveDataSurface.vue";
import {
  BADGE_OUTLINE_SM_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  INSET_PANEL_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  STATS_SHELL_VARIANT_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { PERCENT_MAX } from "~/constants/numeric-ui";

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


const [RUN_STATUS_PENDING, RUN_STATUS_RUNNING, RUN_STATUS_SUCCESS, RUN_STATUS_ERROR] =
  AUTOMATION_RUN_STATUSES;
const TERMINAL_RUN_STATUSES = new Set<RpaRunExecutionEnvelope["status"]>([
  RUN_STATUS_SUCCESS,
  RUN_STATUS_ERROR,
]);

const { t } = useI18n();

const isStreamLoading = computed<boolean>(() => props.streamState === "loading");
const streamStatusLabel = computed<string>(() => {
  const currentStatus = props.run?.status ?? RUN_STATUS_PENDING;
  return t(`automation.runs.statusOptions.${currentStatus}`);
});
const streamProgressValue = computed<number>(() => {
  const progress = props.run?.progress;
  if (typeof progress === "number" && Number.isFinite(progress)) {
    return Math.max(0, Math.min(PERCENT_MAX, progress));
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
  let completionStep = "step";
  if (runStatus === RUN_STATUS_SUCCESS) {
    completionStep = "step step-success";
  } else if (runStatus === RUN_STATUS_ERROR) {
    completionStep = "step step-error";
  }
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
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <h2 class="card-title">{{ t("automation.jobApply.stream.title") }}</h2>
      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("automation.jobApply.stream.subtitle") }}</p>

      <ul class="steps steps-vertical lg:steps-horizontal" :class="[FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS.mt2]">
        <li :class="lifecycleStepClasses[0]">{{ t("automation.jobApply.stream.steps.queued") }}</li>
        <li :class="lifecycleStepClasses[1]">{{ t("automation.jobApply.stream.steps.running") }}</li>
        <li :class="lifecycleStepClasses[2]">{{ t("automation.jobApply.stream.steps.completed") }}</li>
      </ul>

      <div
        :class="[STATS_SHELL_VARIANT_CLASS.lg, MARGIN_TOKEN_CLASS.mt4]"
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
            class="progress progress-primary" :class="[MARGIN_TOKEN_CLASS.mt2]"
            :value="streamProgressValue"
            max="100"
            :aria-label="t('automation.jobApply.stream.progressAria')"
          ></progress>
        </div>
      </div>

      <div class="flex flex-wrap items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap3, MARGIN_TOKEN_CLASS.mt4]">
        <NuxtLink 
          :to="runDetailRoute(activeRunId)"
          :class="[OUTLINE_ACTION_CLASS]"
          :aria-label="t('automation.jobApply.openRunDetailAria', { id: activeRunId })"
        >
          {{ t("automation.jobApply.openRunDetailLink") }}
        </NuxtLink>
        <button 
          type="button"
          :class="[TOUCH_TARGET_MIN_CLASS, GHOST_ACTION_DENSE_CLASS]"
          :disabled="isStreamLoading"
          :aria-label="t('automation.jobApply.stream.retryAria')"
          @click="emit('retry')"
        >
          {{ t("automation.jobApply.stream.retryButton") }}
        </button>
        <button 
          type="button"
          :class="[TOUCH_TARGET_MIN_CLASS, GHOST_ACTION_DENSE_CLASS]"
          :aria-label="t('automation.jobApply.stream.cancelAria')"
          @click="emit('cancel')"
        >
          {{ t("automation.jobApply.stream.cancelButton") }}
        </button>
      </div>

      <BootstrapErrorAlert 
        v-if="streamErrorMessage"
        :class="[MARGIN_TOKEN_CLASS.mt4]"
        :title="t('automation.jobApply.stream.errorTitle')"
        :message="streamErrorMessage"
        :retry-label="t('automation.jobApply.stream.retryButton')"
        :retry-aria-label="t('automation.jobApply.stream.retryAria')"
        @retry="emit('retry')"
      />

      <section :class="[MARGIN_TOKEN_CLASS.mt4]" :aria-label="t('automation.jobApply.stream.eventsAria')">
        <h3 class="font-semibold">{{ t("automation.jobApply.stream.eventsTitle") }}</h3>
        <p
          v-if="eventRows.length === 0"
          class="text-center text-muted"
          :class="[TYPOGRAPHY_SCALE_CLASS.sm, MARGIN_TOKEN_CLASS.mt2]"
        >
          {{ t("automation.jobApply.stream.events.empty") }}
        </p>
        <ResponsiveDataSurface v-else :class="[MARGIN_TOKEN_CLASS.mt2]">
          <template #cards>
            <ul
              class="list-none"
              :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]"
              :aria-label="t('automation.jobApply.stream.eventsAria')"
              aria-live="polite"
            >
              <li
                v-for="event in eventRows"
                :key="`${event.runId}-${event.sequence}`"
 
 :class="[INSET_PANEL_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack2, PADDING_TOKEN_CLASS.p3]"
 >
                <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                  <div>
                    <p class="font-semibold">{{ resolveStreamEventStageLabel(event) }}</p>
                    <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                      {{ toLocalizedDateTime(event.timestamp) }}
                    </p>
                  </div>
                  <span :class="BADGE_OUTLINE_SM_CLASS">
                    {{ resolveStreamEventStatusLabel(event) }}
                  </span>
                </div>
                <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ resolveStreamEventMessage(event) }}</p>
              </li>
            </ul>
          </template>
          <template #table>
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
              </tbody>
            </table>
          </template>
        </ResponsiveDataSurface>
      </section>
    </div>
  </div>
</template>
