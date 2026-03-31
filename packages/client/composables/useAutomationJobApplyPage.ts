import { API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { useI18n } from "vue-i18n";
import type { CoverLetterSelectOption, ResumeSelectOption } from "~/types/automation-job-apply";
import {
  DATE_FORMAT_OPTIONS,
  resolveScheduledRunAt,
  toIsoTimestamp,
} from "~/composables/automation-scraper-bootstrap";
import { settlePromise } from "~/composables/async-flow";
import { useAutomationRunStream } from "~/composables/useAutomationRunStream";
import { resolveApiEndpoint } from "~/utils/endpoints";
import { getErrorMessage } from "~/utils/errors";
import { formatDateWithLocale } from "~/utils/locale-format";

interface JobApplyRequestBody {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
}

interface ScheduledJobApplyRequestBody extends JobApplyRequestBody {
  runAt: string;
}

function buildJobApplyBody(input: {
  jobUrl: Ref<string>;
  resumeId: Ref<string>;
  coverLetterId: Ref<string>;
  jobId: Ref<string>;
}): JobApplyRequestBody {
  const coverLetterId = input.coverLetterId.value.trim();
  const jobId = input.jobId.value.trim();

  return {
    jobUrl: input.jobUrl.value.trim(),
    resumeId: input.resumeId.value,
    ...(coverLetterId ? { coverLetterId } : {}),
    ...(jobId ? { jobId } : {}),
  };
}

function useAutomationJobApplyForm() {
  return {
    coverLetterId: ref(""),
    jobId: ref(""),
    jobUrl: ref(""),
    resumeId: ref(""),
    runAt: ref(""),
  };
}

function useAutomationJobApplyDependencies() {
  const { t, locale, fallbackLocale } = useI18n();
  const { triggerJobApply, scheduleJobApply } = useAutomation();
  const requestUrl = useRequestURL();
  const apiBase = String(useRuntimeConfig().public.apiBase || "/");
  const runStream = useAutomationRunStream({
    fallbackMessage: t("automation.jobApply.stream.startErrorFallback"),
  });

  return {
    apiBase,
    fallbackLocale,
    locale,
    requestUrl,
    runStream,
    scheduleJobApply,
    t,
    triggerJobApply,
  };
}

async function useAutomationJobApplyBootstrap(input: { apiBase: string; requestUrl: URL }) {
  const { data: resumesData } = await useFetch<ResumeSelectOption[]>(
    resolveApiEndpoint(input.apiBase, input.requestUrl, API_ENDPOINTS.resumes),
    {
      method: "GET",
    },
  );

  const { data: coverLettersData } = await useFetch<CoverLetterSelectOption[]>(
    resolveApiEndpoint(input.apiBase, input.requestUrl, API_ENDPOINTS.coverLetters),
    {
      method: "GET",
    },
  );

  return {
    coverLettersData,
    resumesData,
  };
}

function createAutomationJobApplyState(runStream: ReturnType<typeof useAutomationRunStream>) {
  const pending = ref(false);
  const submitError = ref("");
  const startedRunId = ref("");
  const scheduledRun = ref<RpaRunExecutionEnvelope | null>(null);
  const streamRun = computed(() => runStream.run.value);
  const streamState = computed(() => runStream.state.value);
  const streamEvents = computed(() => runStream.events.value);
  const streamError = computed(() => runStream.streamError.value);
  const activeRunId = computed<string>(() => streamRun.value?.id ?? startedRunId.value);
  const hasActiveRun = computed<boolean>(() => activeRunId.value.length > 0);

  return {
    activeRunId,
    hasActiveRun,
    pending,
    scheduledRun,
    startedRunId,
    streamError,
    streamEvents,
    streamRun,
    streamState,
    submitError,
  };
}

function createAutomationJobApplyPresentation(input: {
  fallbackLocale: Ref<unknown> | ComputedRef<unknown>;
  form: ReturnType<typeof useAutomationJobApplyForm>;
  locale: Ref<unknown> | ComputedRef<unknown>;
  state: ReturnType<typeof createAutomationJobApplyState>;
}) {
  const isSubmitDisabled = computed(
    () => input.state.pending.value || !input.form.jobUrl.value || !input.form.resumeId.value,
  );
  const isScheduleDisabled = computed(() => isSubmitDisabled.value || !input.form.runAt.value);

  const toLocalizedDateTime = (value: string): string => {
    const formatted = formatDateWithLocale(
      value,
      input.locale.value,
      input.fallbackLocale.value,
      DATE_FORMAT_OPTIONS,
    );
    return formatted ?? value;
  };

  return {
    isScheduleDisabled,
    isSubmitDisabled,
    toLocalizedDateTime,
  };
}

function createAutomationJobApplyActions(input: {
  form: ReturnType<typeof useAutomationJobApplyForm>;
  runStream: ReturnType<typeof useAutomationRunStream>;
  scheduleJobApply: ReturnType<typeof useAutomation>["scheduleJobApply"];
  state: ReturnType<typeof createAutomationJobApplyState>;
  t: ReturnType<typeof useI18n>["t"];
  triggerJobApply: ReturnType<typeof useAutomation>["triggerJobApply"];
}) {
  async function startRunStream(runId: string) {
    const streamStartResult = await settlePromise(
      input.runStream.start(runId),
      input.t("automation.jobApply.stream.startErrorFallback"),
    );
    if (!streamStartResult.ok) {
      input.state.submitError.value = getErrorMessage(
        streamStartResult.error,
        input.t("automation.jobApply.stream.startErrorFallback"),
      );
    }
  }

  function resetSubmissionState() {
    input.state.submitError.value = "";
    input.state.startedRunId.value = "";
    input.state.scheduledRun.value = null;
  }

  const runNowActions = createAutomationImmediateJobApplyAction({
    form: input.form,
    resetSubmissionState,
    startRunStream,
    state: input.state,
    t: input.t,
    triggerJobApply: input.triggerJobApply,
  });
  const scheduledActions = createAutomationScheduledJobApplyAction({
    form: input.form,
    resetSubmissionState,
    runStream: input.runStream,
    scheduleJobApply: input.scheduleJobApply,
    state: input.state,
    t: input.t,
  });

  return {
    submitJobApply: runNowActions.submitJobApply,
    submitScheduledJobApply: scheduledActions.submitScheduledJobApply,
  };
}

function createAutomationImmediateJobApplyAction(input: {
  form: ReturnType<typeof useAutomationJobApplyForm>;
  resetSubmissionState: () => void;
  startRunStream: (runId: string) => Promise<void>;
  state: ReturnType<typeof createAutomationJobApplyState>;
  t: ReturnType<typeof useI18n>["t"];
  triggerJobApply: ReturnType<typeof useAutomation>["triggerJobApply"];
}) {
  async function submitJobApply(): Promise<void> {
    input.resetSubmissionState();
    input.state.pending.value = true;

    const submitResult = await settlePromise(
      input.triggerJobApply(buildJobApplyBody(input.form)),
      input.t("automation.jobApply.submitErrorFallback"),
    );
    input.state.pending.value = false;

    if (!submitResult.ok) {
      input.state.submitError.value = getErrorMessage(
        submitResult.error,
        input.t("automation.jobApply.submitErrorFallback"),
      );
      return;
    }

    const startedRun = submitResult.value;
    input.state.startedRunId.value = startedRun.id;
    await input.startRunStream(startedRun.id);
  }

  return {
    submitJobApply,
  };
}

function createAutomationScheduledJobApplyAction(input: {
  form: ReturnType<typeof useAutomationJobApplyForm>;
  resetSubmissionState: () => void;
  runStream: ReturnType<typeof useAutomationRunStream>;
  scheduleJobApply: ReturnType<typeof useAutomation>["scheduleJobApply"];
  state: ReturnType<typeof createAutomationJobApplyState>;
  t: ReturnType<typeof useI18n>["t"];
}) {
  async function submitScheduledJobApply(): Promise<void> {
    input.resetSubmissionState();
    input.runStream.cancel();
    input.state.pending.value = true;

    const runAt = toIsoTimestamp(input.form.runAt.value);
    if (!runAt) {
      input.state.submitError.value = input.t("automation.jobApply.schedule.invalidRunAt");
      input.state.pending.value = false;
      return;
    }

    const body: ScheduledJobApplyRequestBody = {
      ...buildJobApplyBody(input.form),
      runAt,
    };

    const scheduledResult = await settlePromise(
      input.scheduleJobApply(body),
      input.t("automation.jobApply.submitErrorFallback"),
    );
    input.state.pending.value = false;

    if (!scheduledResult.ok) {
      input.state.submitError.value = getErrorMessage(
        scheduledResult.error,
        input.t("automation.jobApply.submitErrorFallback"),
      );
      return;
    }

    input.state.scheduledRun.value = scheduledResult.value;
  }

  return {
    submitScheduledJobApply,
  };
}

export async function useAutomationJobApplyPage() {
  const dependencies = useAutomationJobApplyDependencies();
  const form = useAutomationJobApplyForm();
  const bootstrap = await useAutomationJobApplyBootstrap({
    apiBase: dependencies.apiBase,
    requestUrl: dependencies.requestUrl,
  });
  const state = createAutomationJobApplyState(dependencies.runStream);
  const presentation = createAutomationJobApplyPresentation({
    fallbackLocale: dependencies.fallbackLocale,
    form,
    locale: dependencies.locale,
    state,
  });
  const actions = createAutomationJobApplyActions({
    form,
    runStream: dependencies.runStream,
    scheduleJobApply: dependencies.scheduleJobApply,
    state,
    t: dependencies.t,
    triggerJobApply: dependencies.triggerJobApply,
  });

  return {
    activeRunId: state.activeRunId,
    coverLetterId: form.coverLetterId,
    coverLettersData: bootstrap.coverLettersData,
    hasActiveRun: state.hasActiveRun,
    isScheduleDisabled: presentation.isScheduleDisabled,
    isSubmitDisabled: presentation.isSubmitDisabled,
    jobId: form.jobId,
    jobUrl: form.jobUrl,
    pending: state.pending,
    resolveScheduledRunAt,
    resumeId: form.resumeId,
    resumesData: bootstrap.resumesData,
    runAt: form.runAt,
    runDetailRoute: (id: string) => APP_ROUTE_BUILDERS.automationRunDetail(id),
    runStream: dependencies.runStream,
    scheduledRun: state.scheduledRun,
    startedRunId: state.startedRunId,
    streamError: state.streamError,
    streamEvents: state.streamEvents,
    streamRun: state.streamRun,
    streamState: state.streamState,
    submitError: state.submitError,
    submitJobApply: actions.submitJobApply,
    submitScheduledJobApply: actions.submitScheduledJobApply,
    toLocalizedDateTime: presentation.toLocalizedDateTime,
  };
}
