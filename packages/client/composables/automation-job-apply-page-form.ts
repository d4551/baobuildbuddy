import { API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { asJsonArray, isRecord } from "@bao/shared/utils/type-guards";
import { useI18n } from "vue-i18n";
import { requestApi, useClientApiRequestRuntime } from "~/composables/api-request";
import { useAutomationRunStream } from "~/composables/useAutomationRunStream";
import type { CoverLetterSelectOption, ResumeSelectOption } from "~/types/automation-job-apply";
import { readApiDataOrEmpty } from "~/utils/api-response";

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
  const runtime = useClientApiRequestRuntime();
  const { triggerJobApply, scheduleJobApply } = useAutomation();
  const runStream = useAutomationRunStream({
    fallbackMessage: t("automation.jobApply.stream.startErrorFallback"),
  });

  return {
    api,
    fallbackLocale,
    locale,
    runStream,
    runtime,
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
  runtime: ReturnType<typeof useClientApiRequestRuntime>;
}) {
  const { data: resumesData } = useAsyncData<ResumeSelectOption[]>(
    "automation-job-apply-resumes",
    async () => toResumeSelectOptions(await readApiDataOrEmpty(input.api.resumes.get())),
    {
      default: () => [],
    },
  );

  const { data: coverLettersData } = useAsyncData<CoverLetterSelectOption[]>(
    "automation-job-apply-cover-letters",
    async () =>
      toCoverLetterSelectOptions(
        await readApiDataOrEmpty(
          requestApi<unknown>(input.runtime, API_ENDPOINTS.coverLetters, {
            method: "GET",
          }),
        ),
      ),
    {
      default: () => [],
    },
  );

  return {
    coverLettersData,
    resumesData,
  };
}
