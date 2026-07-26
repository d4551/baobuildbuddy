import { useI18n } from "vue-i18n";
import { useAutomationRunStream } from "~/composables/useAutomationRunStream";
import type { CoverLetterSelectOption, ResumeSelectOption } from "~/types/automation-job-apply";
import { requireApiResponseData } from "~/utils/api-response";
import { getErrorMessage } from "~/utils/errors";
import {
  type JobApplyFormBody,
  toCoverLetterSelectOptions,
  toResumeSelectOptions,
} from "./automation-job-apply-select-options";

export interface ScheduledJobApplyRequestBody extends JobApplyFormBody {
  runAt: string;
}

export function useAutomationJobApplyForm() {
  return {
    coverLetterId: ref(""),
    jobId: ref(""),
    jobUrl: ref(""),
    resumeId: ref(""),
    runAt: ref(""),
  };
}

export function useAutomationJobApplyDependencies() {
  const { t, locale, fallbackLocale } = useI18n();
  const api = useApi();
  const { getVerifyContext, triggerJobApply, scheduleJobApply } = useAutomation();
  const runStream = useAutomationRunStream({
    fallbackMessage: t("automation.jobApply.stream.startErrorFallback"),
  });

  return {
    api,
    fallbackLocale,
    getVerifyContext,
    locale,
    runStream,
    scheduleJobApply,
    t,
    triggerJobApply,
  };
}

export function useAutomationJobApplyBootstrap(input: {
  api: ReturnType<typeof useApi>;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const {
    data: resumesData,
    status: resumesStatus,
    error: resumesError,
    refresh: refreshResumes,
  } = useAsyncData<ResumeSelectOption[]>("automation-job-apply-resumes", async () => {
    const response = await input.api.resumes.get();
    return toResumeSelectOptions(
      requireApiResponseData(
        response,
        input.t("automation.jobApply.bootstrapError"),
        getErrorMessage,
      ),
    );
  });

  const {
    data: coverLettersData,
    status: coverLettersStatus,
    error: coverLettersError,
    refresh: refreshCoverLetters,
  } = useAsyncData<CoverLetterSelectOption[]>("automation-job-apply-cover-letters", async () => {
    const response = await input.api["cover-letters"].get();
    return toCoverLetterSelectOptions(
      requireApiResponseData(
        response,
        input.t("automation.jobApply.bootstrapError"),
        getErrorMessage,
      ),
    );
  });

  const bootstrapPending = computed(
    () =>
      resumesStatus.value === "pending" ||
      resumesStatus.value === "idle" ||
      coverLettersStatus.value === "pending" ||
      coverLettersStatus.value === "idle",
  );

  const bootstrapError = computed(() => resumesError.value ?? coverLettersError.value ?? null);

  const refreshBootstrap = async (): Promise<void> => {
    await Promise.all([refreshResumes(), refreshCoverLetters()]);
  };

  return {
    bootstrapError,
    bootstrapPending,
    coverLettersData,
    refreshBootstrap,
    resumesData,
  };
}
