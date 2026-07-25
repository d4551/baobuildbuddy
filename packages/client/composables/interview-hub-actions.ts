import { INTERVIEW_FALLBACK_STUDIO_ID } from "@bao/shared/constants/interview";
import { APP_ROUTE_QUERY_KEYS, APP_ROUTES } from "@bao/shared/constants/routes";
import type { InterviewMode, InterviewTargetJob } from "@bao/shared/types/interview";
import type { Job } from "@bao/shared/types/jobs";
import type { ComposerTranslation } from "vue-i18n";
import type { Router } from "vue-router";
import type { NuxtApp } from "#app";
import { settlePromise } from "~/composables/async-flow";
import { createInterviewHubPresentation } from "~/composables/interview-hub-presentation";
import { getErrorMessage } from "~/utils/errors";

type InterviewHubActionsInput = {
  closeConfig: Ref<boolean>;
  fallbackLocale: Ref<unknown>;
  getJob: (jobId: string) => Promise<Job | null>;
  locale: Ref<string>;
  selectedCoverLetterId: Ref<string | undefined>;
  selectedJob: Ref<Job | null>;
  selectedJobFallback: Ref<Job | null>;
  selectedJobId: Ref<string>;
  selectedMode: Ref<InterviewMode>;
  selectedPortfolioId: Ref<string | undefined>;
  selectedResumeId: Ref<string | undefined>;
  sessionConfig: {
    studioId: string;
    role: string;
    experienceLevel: string;
    questionCount: number;
    conversationStyle: string;
    enableVoiceMode: boolean;
    voiceSettings: unknown;
  };
  startSession: (
    studioId: string,
    config: Record<string, unknown>,
  ) => Promise<{ id?: string } | null>;
  starting: Ref<boolean>;
  studios: Ref<readonly { readonly id: string; readonly name: string }[]>;
};

type InterviewHubJobSelectionInput = Pick<
  InterviewHubActionsInput,
  "getJob" | "selectedJobFallback" | "selectedJobId" | "sessionConfig"
>;

type InterviewHubSessionStartInput = Pick<
  InterviewHubActionsInput,
  | "closeConfig"
  | "selectedCoverLetterId"
  | "selectedJob"
  | "selectedMode"
  | "selectedPortfolioId"
  | "selectedResumeId"
  | "sessionConfig"
  | "startSession"
  | "starting"
  | "studios"
>;

type InterviewHubSessionRequestInput = Pick<
  InterviewHubActionsInput,
  | "selectedCoverLetterId"
  | "selectedJob"
  | "selectedMode"
  | "selectedPortfolioId"
  | "selectedResumeId"
  | "sessionConfig"
>;

function createJobSelectionAction(
  input: InterviewHubJobSelectionInput,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const { $toast } = nuxtApp;

  return async (jobId: string, availableJobs: readonly Job[]): Promise<void> => {
    input.selectedJobId.value = jobId;
    const fromLoadedJobs = availableJobs.find((job) => job.id === jobId);
    if (fromLoadedJobs) {
      input.selectedJobFallback.value = fromLoadedJobs;
      input.sessionConfig.role = fromLoadedJobs.title;
      return;
    }

    const fetchedJobResult = await settlePromise(
      input.getJob(jobId),
      t("interviewHub.errors.jobLoadFailed"),
    );
    if (!fetchedJobResult.ok) {
      input.selectedJobFallback.value = null;
      $toast.error(getErrorMessage(fetchedJobResult.error, t("interviewHub.errors.jobLoadFailed")));
      return;
    }
    if (fetchedJobResult.value) {
      input.selectedJobFallback.value = fetchedJobResult.value;
      input.sessionConfig.role = fetchedJobResult.value.title;
    }
  };
}

function createSessionStartAction(
  input: InterviewHubSessionStartInput,
  router: Router,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const { $toast } = nuxtApp;

  function resolveStudioIdForJob(job: Job): string {
    const company = job.company.trim().toLowerCase();
    const matchedStudio = input.studios.value.find((studio) => {
      const studioName = studio.name.trim().toLowerCase();
      return studioName === company || studioName.includes(company) || company.includes(studioName);
    });
    return matchedStudio?.id || INTERVIEW_FALLBACK_STUDIO_ID;
  }

  return async (isStartDisabled: boolean): Promise<void> => {
    if (isStartDisabled) {
      return;
    }

    input.starting.value = true;
    const startResult = await settlePromise(
      input.startSession(
        resolveSessionStudioId(
          input.selectedMode.value,
          input.selectedJob.value,
          input.sessionConfig.studioId,
          resolveStudioIdForJob,
        ),
        createSessionRequest(input, toInterviewTargetJob),
      ),
      t("interviewHub.errors.startFailed"),
    );
    input.starting.value = false;

    if (!startResult.ok) {
      $toast.error(getErrorMessage(startResult.error, t("interviewHub.errors.startFailed")));
      return;
    }

    if (startResult.value?.id) {
      input.closeConfig.value = false;
      $toast.success(t("interviewHub.toasts.started"));
      await router.push({
        path: APP_ROUTES.interviewSession,
        query: { [APP_ROUTE_QUERY_KEYS.sessionId]: startResult.value.id },
      });
    }
  };
}

export function useInterviewHubActions(
  input: InterviewHubActionsInput,
  router: Router,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const presentation = createInterviewHubPresentation(
    { fallbackLocale: input.fallbackLocale, locale: input.locale },
    t,
  );
  const selectJobById = createJobSelectionAction(input, nuxtApp, t);
  const handleStartInterview = createSessionStartAction(input, router, nuxtApp, t);

  async function retryPathwaysFromWarning(
    refreshInterviewHub: () => Promise<unknown>,
  ): Promise<void> {
    await refreshInterviewHub();
  }

  function openConfig(mode: InterviewMode): void {
    input.selectedMode.value = mode;
    input.closeConfig.value = true;
  }

  async function viewSession(id: string): Promise<void> {
    await router.push({
      path: APP_ROUTES.interviewHistory,
      query: { [APP_ROUTE_QUERY_KEYS.sessionId]: id },
    });
  }

  return {
    experienceLabel: (level: string) => presentation.experienceLabel(level),
    formatSessionDate: (value: string | undefined) => presentation.formatSessionDate(value),
    handleStartInterview,
    interviewConfigPageAria: (page: number) => presentation.interviewConfigPageAria(page),
    modeLabel: (mode: InterviewMode | undefined) => presentation.modeLabel(mode),
    openConfig,
    prepStatusBadgeClass: (ready: boolean) => presentation.prepStatusBadgeClass(ready),
    questionCountLabel: (count: number) => presentation.questionCountLabel(count),
    recentSessionPageAria: (page: number) => presentation.recentSessionPageAria(page),
    retryPathwaysFromWarning,
    selectJobById,
    viewSession,
  };
}

function toInterviewTargetJob(job: Job): InterviewTargetJob {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    requirements: job.requirements,
    technologies: job.technologies,
    source: job.source,
    postedDate: job.postedDate,
    url: job.url,
    enrichment: job.enrichment,
  };
}

function resolveSessionStudioId(
  selectedMode: InterviewMode,
  selectedJob: Job | null,
  studioId: string,
  resolveStudioIdForJob: (job: Job) => string,
): string {
  return selectedMode === "job" && selectedJob ? resolveStudioIdForJob(selectedJob) : studioId;
}

function createCandidateContext(
  selectedResumeId: string | undefined,
  selectedCoverLetterId: string | undefined,
  selectedPortfolioId: string | undefined,
): Record<string, string> {
  return {
    ...(selectedResumeId ? { resumeId: selectedResumeId } : {}),
    ...(selectedCoverLetterId ? { coverLetterId: selectedCoverLetterId } : {}),
    ...(selectedPortfolioId ? { portfolioId: selectedPortfolioId } : {}),
  };
}

function createSessionRequest(
  {
    selectedCoverLetterId,
    selectedJob,
    selectedMode,
    selectedPortfolioId,
    selectedResumeId,
    sessionConfig,
  }: InterviewHubSessionRequestInput,
  toTargetJob: (job: Job) => InterviewTargetJob,
): Record<string, unknown> {
  return {
    roleType: selectedJob.value?.title || sessionConfig.role,
    experienceLevel: sessionConfig.experienceLevel,
    questionCount: sessionConfig.questionCount,
    conversationStyle: sessionConfig.conversationStyle,
    includeTechnical: true,
    includeBehavioral: true,
    includeStudioSpecific: true,
    technologies: selectedJob.value?.technologies || [],
    enableVoiceMode: sessionConfig.enableVoiceMode,
    interviewMode: selectedMode.value,
    candidateContext: createCandidateContext(
      selectedResumeId.value,
      selectedCoverLetterId.value,
      selectedPortfolioId.value,
    ),
    ...(sessionConfig.enableVoiceMode ? { voiceSettings: sessionConfig.voiceSettings } : {}),
    ...(selectedJob.value ? { targetJob: toTargetJob(selectedJob.value) } : {}),
  };
}
