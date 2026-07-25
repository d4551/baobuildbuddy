import { asJsonArray, isRecord } from "@bao/shared/utils/type-guards";
import { useI18n } from "vue-i18n";
import { useAutomationRunStream } from "~/composables/useAutomationRunStream";
import type { CoverLetterSelectOption, ResumeSelectOption } from "~/types/automation-job-apply";
import { requireApiResponseData } from "~/utils/api-response";
import { getErrorMessage } from "~/utils/errors";

export interface JobApplyRequestBody {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
}

export interface ScheduledJobApplyRequestBody extends JobApplyRequestBody {
  runAt: string;
}

export function buildJobApplyBody(input: {
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

export const toResumeSelectOptions = <T>(value: T): ResumeSelectOption[] => {
  const entries = asJsonArray(value);
  if (!entries) {
    return [];
  }
  const options: ResumeSelectOption[] = [];
  for (const entry of entries) {
    if (!isRecord(entry) || typeof entry.id !== "string") {
      continue;
    }
    options.push({
      id: entry.id,
      ...(typeof entry.name === "string" ? { name: entry.name } : {}),
    });
  }
  return options;
};

export const toCoverLetterSelectOptions = <T>(value: T): CoverLetterSelectOption[] => {
  const entries = asJsonArray(value);
  if (!entries) {
    return [];
  }
  const options: CoverLetterSelectOption[] = [];
  for (const entry of entries) {
    if (!isRecord(entry) || typeof entry.id !== "string") {
      continue;
    }
    options.push({
      id: entry.id,
      ...(typeof entry.company === "string" ? { company: entry.company } : {}),
      ...(typeof entry.position === "string" ? { position: entry.position } : {}),
    });
  }
  return options;
};

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
      requireApiResponseData(response, input.t("automation.jobApply.bootstrapError"), getErrorMessage),
    );
  });

  const {
    data: coverLettersData,
    status: coverLettersStatus,
    error: coverLettersError,
    refresh: refreshCoverLetters,
  } = useAsyncData<CoverLetterSelectOption[]>(
    "automation-job-apply-cover-letters",
    async () => {
      const response = await input.api["cover-letters"].get();
      return toCoverLetterSelectOptions(
        requireApiResponseData(
          response,
          input.t("automation.jobApply.bootstrapError"),
          getErrorMessage,
        ),
      );
    },
  );

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
