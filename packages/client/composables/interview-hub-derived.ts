import {
  INTERVIEW_HUB_RECENT_SESSION_LIMIT,
  JOB_PREVIEW_LIMIT,
} from "@bao/shared/constants/interview";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { InterviewMode } from "@bao/shared/types/interview";
import type { Job } from "@bao/shared/types/jobs";
import type { ComputedRef, Ref } from "vue";
import type { ComposerTranslation } from "vue-i18n";
import { cloneJob, type InterviewJobView } from "~/composables/interview-hub-bootstrap";
import { useInterviewRoleOptions } from "~/composables/interview-hub-role-options";
import { PERCENT_MAX } from "~/constants/numeric-ui";

type InterviewHubDerivedInput = {
  coverLetters: Ref<readonly { readonly id?: string }[]>;
  jobSearchTerm: Ref<string>;
  jobs: Ref<readonly InterviewJobView[]>;
  pathways: Ref<readonly { readonly title: string; readonly matchScore: number }[]>;
  portfolio: Ref<{ readonly id?: string; readonly projects: readonly unknown[] } | null>;
  profile: Ref<{ readonly currentRole?: string | null } | null>;
  readiness: Ref<{
    readonly targetRoleReadiness?: readonly {
      readonly roleTitle: string;
      readonly readinessScore: number;
    }[];
  } | null>;
  selectedJobFallback: Ref<Job | null>;
  selectedJobId: Ref<string>;
  selectedMode: Ref<InterviewMode>;
  sessionConfig: { studioId: string; role: string };
  sessions: Ref<readonly unknown[]>;
  stats: Ref<{
    readonly totalSessions?: number;
    readonly averageScore?: number;
    readonly improvementTrend?: number;
  } | null>;
  studios: Ref<
    readonly {
      readonly id: string;
      readonly name: string;
      readonly type?: string;
      readonly location?: string;
    }[]
  >;
  resumes: Ref<readonly { readonly id?: string; readonly isDefault?: boolean }[]>;
};

function useInterviewHubSessionStats(
  sessions: InterviewHubDerivedInput["sessions"],
  stats: InterviewHubDerivedInput["stats"],
  t: ComposerTranslation,
) {
  const recentSessionPagination = usePagination(
    computed(() => sessions.value),
    INTERVIEW_HUB_RECENT_SESSION_LIMIT,
  );

  return {
    averageScore: computed(() => Math.round(stats.value?.averageScore ?? 0)),
    improvementTrend: computed(() => Math.round(stats.value?.improvementTrend ?? 0)),
    recentSessionPagination,
    recentSessions: computed(() => recentSessionPagination.items.value),
    recentSessionsPaginationSummary: computed(() =>
      t("interviewHub.recent.pagination.summary", {
        start: recentSessionPagination.rangeStart.value,
        end: recentSessionPagination.rangeEnd.value,
        total: recentSessionPagination.totalItems.value,
      }),
    ),
    totalSessions: computed(() => stats.value?.totalSessions ?? 0),
  };
}

function useInterviewHubPrepState(
  {
    coverLetters,
    portfolio,
    resumes,
  }: Pick<InterviewHubDerivedInput, "coverLetters" | "portfolio" | "resumes">,
  t: ComposerTranslation,
) {
  const prepChecklist = computed(() => [
    {
      id: "resume",
      ready: resumes.value.length > 0,
      title: t("interviewHub.prep.items.resume.title"),
      description: t("interviewHub.prep.items.resume.description"),
      ctaLabel: t("interviewHub.prep.items.resume.cta"),
      route: APP_ROUTES.resume,
    },
    {
      id: "coverLetter",
      ready: coverLetters.value.length > 0,
      title: t("interviewHub.prep.items.coverLetter.title"),
      description: t("interviewHub.prep.items.coverLetter.description"),
      ctaLabel: t("interviewHub.prep.items.coverLetter.cta"),
      route: APP_ROUTES.coverLetter,
    },
    {
      id: "portfolio",
      ready: portfolio.value?.projects.length > 0 ? portfolio.value.projects.length > 0 : false,
      title: t("interviewHub.prep.items.portfolio.title"),
      description: t("interviewHub.prep.items.portfolio.description"),
      ctaLabel: t("interviewHub.prep.items.portfolio.cta"),
      route: APP_ROUTES.portfolio,
    },
  ]);
  const prepReadyCount = computed(() => prepChecklist.value.filter((item) => item.ready).length);

  return {
    prepChecklist,
    prepCompletionPercent: computed(() => {
      const total = prepChecklist.value.length;
      if (total === 0) {
        return 0;
      }
      return Math.round((prepReadyCount.value / total) * PERCENT_MAX);
    }),
    prepReadyCount,
  };
}

function useInterviewJobSelection(
  {
    jobSearchTerm,
    jobs,
    selectedJobFallback,
    selectedJobId,
  }: Pick<
    InterviewHubDerivedInput,
    "jobSearchTerm" | "jobs" | "selectedJobFallback" | "selectedJobId"
  >,
  t: ComposerTranslation,
) {
  const availableJobs = computed(() => {
    const unique = new Map<string, Job>();
    for (const job of jobs.value) {
      unique.set(job.id, cloneJob(job));
    }
    return [...unique.values()];
  });
  const searchedJobs = computed(() => {
    const query = jobSearchTerm.value.trim().toLowerCase();
    if (!query) {
      return availableJobs.value;
    }
    return availableJobs.value.filter((job) => {
      const title = job.title.toLowerCase();
      const company = job.company.toLowerCase();
      const description = (job.description || "").toLowerCase();
      return title.includes(query) || company.includes(query) || description.includes(query);
    });
  });
  const jobSelectionPagination = usePagination(searchedJobs, JOB_PREVIEW_LIMIT, [jobSearchTerm]);

  return {
    availableJobs,
    jobSelectionPagination,
    jobSelectionPaginationSummary: computed(() =>
      t("interviewHub.config.pagination.summary", {
        start: jobSelectionPagination.rangeStart.value,
        end: jobSelectionPagination.rangeEnd.value,
        total: jobSelectionPagination.totalItems.value,
      }),
    ),
    searchedJobs,
    selectedJob: computed(() => {
      const fromList = availableJobs.value.find((job) => job.id === selectedJobId.value);
      if (fromList) {
        return fromList;
      }
      if (selectedJobFallback.value?.id === selectedJobId.value) {
        return selectedJobFallback.value;
      }
      return null;
    }),
  };
}

function useInterviewResourceSelections(
  {
    coverLetters,
    portfolio,
    resumes,
    sessionConfig,
    selectedMode,
    studios,
  }: Pick<
    InterviewHubDerivedInput,
    "coverLetters" | "portfolio" | "resumes" | "sessionConfig" | "selectedMode" | "studios"
  >,
  selectedJob: ComputedRef<Job | null>,
) {
  return {
    isStartDisabled: computed(() => {
      if (selectedMode.value === "job") {
        return !selectedJob.value;
      }
      return !sessionConfig.studioId;
    }),
    selectedCoverLetterId: computed(() => coverLetters.value[0]?.id),
    selectedPortfolioId: computed(() => portfolio.value?.id),
    selectedResumeId: computed(() => {
      const defaultResume = resumes.value.find((resume) => resume.isDefault && resume.id);
      if (defaultResume?.id) {
        return defaultResume.id;
      }
      return resumes.value[0]?.id;
    }),
    selectedStudioName: computed(() => {
      if (!sessionConfig.studioId) {
        return "";
      }
      const selectedStudio = studios.value.find((studio) => studio.id === sessionConfig.studioId);
      return selectedStudio?.name || "";
    }),
    studiosForSelector: computed(() =>
      studios.value.map((studio) => ({
        id: studio.id,
        name: studio.name,
        type: studio.type,
        location: studio.location,
      })),
    ),
  };
}

export function useInterviewHubDerived(
  {
    coverLetters,
    jobSearchTerm,
    jobs,
    pathways,
    portfolio,
    profile,
    readiness,
    selectedJobFallback,
    selectedJobId,
    selectedMode,
    sessionConfig,
    sessions,
    stats,
    studios,
    resumes,
  }: InterviewHubDerivedInput,
  t: ComposerTranslation,
) {
  const sessionStats = useInterviewHubSessionStats(sessions, stats, t);
  const prepState = useInterviewHubPrepState({ coverLetters, portfolio, resumes }, t);
  const interviewRoleOptions = useInterviewRoleOptions({ jobs, pathways, profile, readiness });
  const jobSelection = useInterviewJobSelection(
    { jobSearchTerm, jobs, selectedJobFallback, selectedJobId },
    t,
  );
  const resourceSelections = useInterviewResourceSelections(
    { coverLetters, portfolio, resumes, sessionConfig, selectedMode, studios },
    jobSelection.selectedJob,
  );

  return {
    averageScore: sessionStats.averageScore,
    availableJobs: jobSelection.availableJobs,
    improvementTrend: sessionStats.improvementTrend,
    interviewRoleOptions,
    isStartDisabled: resourceSelections.isStartDisabled,
    jobSelectionPagination: jobSelection.jobSelectionPagination,
    jobSelectionPaginationSummary: jobSelection.jobSelectionPaginationSummary,
    prepChecklist: prepState.prepChecklist,
    prepCompletionPercent: prepState.prepCompletionPercent,
    prepReadyCount: prepState.prepReadyCount,
    recentSessionPagination: sessionStats.recentSessionPagination,
    recentSessions: sessionStats.recentSessions,
    recentSessionsPaginationSummary: sessionStats.recentSessionsPaginationSummary,
    searchedJobs: jobSelection.searchedJobs,
    selectedCoverLetterId: resourceSelections.selectedCoverLetterId,
    selectedJob: jobSelection.selectedJob,
    selectedPortfolioId: resourceSelections.selectedPortfolioId,
    selectedResumeId: resourceSelections.selectedResumeId,
    selectedStudioName: resourceSelections.selectedStudioName,
    studiosForSelector: resourceSelections.studiosForSelector,
    totalSessions: sessionStats.totalSessions,
  };
}
