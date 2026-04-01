import {
  INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  INTERVIEW_DEFAULT_QUESTION_COUNT,
  INTERVIEW_DEFAULT_ROLE_TYPE,
  INTERVIEW_DEFAULT_VOICE_SETTINGS,
  INTERVIEW_HUB_EXPERIENCE_OPTIONS,
  INTERVIEW_HUB_JOB_QUERY_LIMIT,
  INTERVIEW_HUB_QUESTION_COUNT_OPTIONS,
} from "@bao/shared/constants/interview";
import { APP_ROUTE_QUERY_KEYS } from "@bao/shared/constants/routes";
import type { InterviewMode, VoiceSettings } from "@bao/shared/types/interview";
import type { Job } from "@bao/shared/types/jobs";
import type { ComposerTranslation } from "vue-i18n";
import type { ComputedRef } from "vue";
import type { LocationQueryValue, RouteLocationNormalizedLoaded } from "vue-router";
import type { InterviewHubSessionConfig } from "~/types/interview";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

export const INTERVIEW_CONFIG_DIALOG_TITLE_ID = "interview-hub-config-dialog-title";
export const INTERVIEW_CONFIG_DIALOG_DESCRIPTION_ID = "interview-hub-config-dialog-description";
export const INTERVIEW_ROLE_SUGGESTIONS_LIST_ID = "interview-hub-role-suggestions";

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

export type InterviewJobView = DeepReadonly<Job>;

export function ensureOptions<T>(
  options: readonly T[],
  fallbackOptions: readonly T[],
): readonly T[] {
  if (options.length > 0) {
    return options;
  }
  return fallbackOptions;
}

export function resolvePreferredOption<T>(
  options: readonly T[],
  preferredIndex: number,
  fallback: T,
): T {
  const preferredValue = options[preferredIndex];
  if (preferredValue !== undefined) {
    return preferredValue;
  }
  const firstValue = options[0];
  if (firstValue !== undefined) {
    return firstValue;
  }
  return fallback;
}

export function queryValueToString(
  value: LocationQueryValue | LocationQueryValue[] | readonly LocationQueryValue[] | undefined,
): string {
  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string" ? firstValue : "";
  }
  return typeof value === "string" ? value : "";
}

export function normalizeRoleCandidate(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

export function cloneJob(job: Job | InterviewJobView): Job {
  return {
    ...job,
    requirements: job.requirements ? [...job.requirements] : undefined,
    technologies: job.technologies ? [...job.technologies] : undefined,
    tags: job.tags ? [...job.tags] : undefined,
    gameGenres: job.gameGenres ? [...job.gameGenres] : undefined,
    platforms: job.platforms ? [...job.platforms] : undefined,
    cultureInfo: job.cultureInfo
      ? {
          ...job.cultureInfo,
          values: [...job.cultureInfo.values],
          benefits: [...job.cultureInfo.benefits],
        }
      : undefined,
    enrichment: job.enrichment
      ? {
          ...job.enrichment,
          interviewFocusAreas: [...job.enrichment.interviewFocusAreas],
          hiringSignals: [...job.enrichment.hiringSignals],
          candidatePitchAngles: [...job.enrichment.candidatePitchAngles],
        }
      : undefined,
  };
}

type InterviewHubBootstrapInput = {
  fetchCoverLetters: () => Promise<void>;
  fetchPathways: () => Promise<void>;
  fetchPortfolio: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchReadiness: () => Promise<void>;
  fetchResumes: () => Promise<void>;
  fetchSessions: () => Promise<void>;
  fetchStats: () => Promise<void>;
  route: RouteLocationNormalizedLoaded;
  searchJobs: (input: { limit: string }) => Promise<void>;
  searchStudios: () => Promise<void>;
};

function createInterviewHubBootstrapState() {
  return {
    jobSearchTerm: ref(""),
    pathwaysRecommendationError: ref<string | null>(null),
    selectedJobFallback: ref<Job | null>(null),
    selectedJobId: ref(""),
    selectedMode: ref<InterviewMode>("studio"),
    showConfigModal: ref(false),
    starting: ref(false),
  };
}

function createInterviewHubSessionConfig() {
  const interviewExperienceOptions = ensureOptions(INTERVIEW_HUB_EXPERIENCE_OPTIONS, [
    INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  ]);
  const interviewQuestionCountOptions = ensureOptions(INTERVIEW_HUB_QUESTION_COUNT_OPTIONS, [
    INTERVIEW_DEFAULT_QUESTION_COUNT,
  ]);

  return {
    interviewExperienceOptions,
    interviewQuestionCountOptions,
    sessionConfig: reactive<InterviewHubSessionConfig>({
      studioId: "",
      role: INTERVIEW_DEFAULT_ROLE_TYPE,
      experienceLevel: resolvePreferredOption(
        interviewExperienceOptions,
        1,
        INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
      ),
      questionCount: resolvePreferredOption(
        interviewQuestionCountOptions,
        1,
        INTERVIEW_DEFAULT_QUESTION_COUNT,
      ),
      conversationStyle: "natural",
      enableVoiceMode: false,
      voiceSettings: {
        ...INTERVIEW_DEFAULT_VOICE_SETTINGS,
        voiceId: "",
      } satisfies VoiceSettings,
    }),
  };
}

function createInterviewHubRouteState(route: RouteLocationNormalizedLoaded) {
  const routeJobId = computed(() => queryValueToString(route.query[APP_ROUTE_QUERY_KEYS.jobId]));
  const routeStudioId = computed(() =>
    queryValueToString(route.query[APP_ROUTE_QUERY_KEYS.studioId]),
  );
  const requestedMode = computed<InterviewMode>(() =>
    route.query[APP_ROUTE_QUERY_KEYS.mode] === "job" || routeJobId.value ? "job" : "studio",
  );

  return {
    requestedMode,
    routeJobId,
    routeStudioId,
  };
}

async function loadInterviewHubBootstrapData(
  {
    input,
    requestedMode,
    routeStudioId,
    sessionConfig,
    state,
  }: {
    input: InterviewHubBootstrapInput;
    requestedMode: ComputedRef<InterviewMode>;
    routeStudioId: ComputedRef<string>;
    sessionConfig: InterviewHubSessionConfig;
    state: ReturnType<typeof createInterviewHubBootstrapState>;
  },
  t: ComposerTranslation,
) {
  state.pathwaysRecommendationError.value = null;

  const bootstrapResult = await settlePromise(
    Promise.all([
      input.fetchSessions(),
      input.fetchStats(),
      input.fetchProfile(),
      input.searchStudios(),
      input.searchJobs({ limit: String(INTERVIEW_HUB_JOB_QUERY_LIMIT) }),
      input.fetchResumes(),
      input.fetchCoverLetters(),
      input.fetchPortfolio(),
    ]),
    t("interviewHub.errors.bootstrapLoadFailed"),
  );

  if (!bootstrapResult.ok) {
    throw new Error(
      getErrorMessage(bootstrapResult.error, t("interviewHub.errors.bootstrapLoadFailed")),
    );
  }

  const pathwaysResult = await settlePromise(
    Promise.all([input.fetchPathways(), input.fetchReadiness()]),
    t("interviewHub.errors.roleRecommendationsFailed"),
  );
  state.pathwaysRecommendationError.value = pathwaysResult.ok
    ? null
    : getErrorMessage(pathwaysResult.error, t("interviewHub.errors.roleRecommendationsFailed"));

  state.selectedMode.value = requestedMode.value;
  if (routeStudioId.value) {
    sessionConfig.studioId = routeStudioId.value;
  }

  return true;
}

export function useInterviewHubBootstrap(
  input: InterviewHubBootstrapInput,
  t: ComposerTranslation,
) {
  const state = createInterviewHubBootstrapState();
  const { interviewExperienceOptions, interviewQuestionCountOptions, sessionConfig } =
    createInterviewHubSessionConfig();
  const { requestedMode, routeJobId, routeStudioId } = createInterviewHubRouteState(input.route);

  const {
    status: interviewHubStatus,
    error: interviewHubError,
    refresh: refreshInterviewHub,
  } = useAsyncData("interview-hub-bootstrap", async () =>
    loadInterviewHubBootstrapData({ input, requestedMode, routeStudioId, sessionConfig, state }, t),
  );

  const interviewHubPending = computed(
    () => interviewHubStatus.value === "pending" || interviewHubStatus.value === "idle",
  );

  return {
    interviewExperienceOptions,
    interviewHubError,
    interviewHubPending,
    interviewHubStatus,
    interviewQuestionCountOptions,
    jobSearchTerm: state.jobSearchTerm,
    pathwaysRecommendationError: state.pathwaysRecommendationError,
    refreshInterviewHub,
    requestedMode,
    routeJobId,
    routeStudioId,
    selectedJobFallback: state.selectedJobFallback,
    selectedJobId: state.selectedJobId,
    selectedMode: state.selectedMode,
    sessionConfig,
    showConfigModal: state.showConfigModal,
    starting: state.starting,
  };
}
