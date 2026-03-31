import { RESUME_TEMPLATE_DEFAULT, type ResumeTemplate } from "@bao/shared/constants/resume";
import { APP_ROUTE_QUERY_KEYS } from "@bao/shared/constants/routes";
import type { DashboardStats } from "@bao/shared/types/search";
import { resumeDataToFormData, type ResumeFormData } from "@bao/shared/utils/resume-transform";
import type { Ref } from "vue";
import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { ResumeTabId } from "~/components/resume/resume-page-contracts";

export const RESUME_CREATE_DIALOG_TITLE_ID = "resume-page-create-dialog-title";
export const RESUME_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

export type DashboardStatsView = DeepReadonly<DashboardStats>;

export const createResumeFormData = (): ResumeFormData => ({
  name: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  linkedIn: "",
  portfolio: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  gaming: {
    roles: [],
    genres: [],
    achievements: [],
  },
});

export function hasNonEmptyGamingValue(value: string | string[]): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => typeof entry === "string" && entry.trim().length > 0);
  }
  return value.trim().length > 0;
}

export function cloneDashboardStats(
  stats: DashboardStats | DashboardStatsView | null,
): DashboardStats | null {
  if (!stats) {
    return null;
  }

  return {
    profile: { ...stats.profile },
    jobs: { ...stats.jobs },
    resumes: { ...stats.resumes },
    coverLetters: { ...stats.coverLetters },
    portfolio: { ...stats.portfolio },
    interviews: { ...stats.interviews },
    skills: { ...stats.skills },
    ai: { ...stats.ai },
    gamification: { ...stats.gamification },
    automation: {
      ...stats.automation,
      recentRuns: stats.automation.recentRuns.map((run) => ({ ...run })),
    },
  };
}

type ResumePageBootstrapInput = {
  fetchDashboard: () => Promise<void>;
  fetchResumes: () => Promise<void>;
  getResume: (id: string) => Promise<unknown>;
  route: RouteLocationNormalizedLoaded;
};

function createResumePageBootstrapState() {
  const {
    showDeleteDialog: showDeleteResumeDialog,
    pendingDeleteId: pendingDeleteResumeId,
    requestDelete: requestDeleteResume,
    clearDeleteState: clearDeleteResumeState,
    closeDeleteDialog: closeDeleteResumeDialog,
  } = useDeleteConfirmation();

  return {
    activeTab: ref<ResumeTabId>("personal"),
    clearDeleteResumeState,
    closeDeleteResumeDialog,
    creating: ref(false),
    enhancing: ref(false),
    formData: reactive<ResumeFormData>(createResumeFormData()),
    newResumeName: ref(""),
    newResumeTemplate: ref<ResumeTemplate>(RESUME_TEMPLATE_DEFAULT),
    pendingDeleteResumeId,
    requestDeleteResume,
    resumeSearchQuery: ref(""),
    scoring: ref(false),
    selectedResumeId: ref<string | null>(null),
    showCreateModal: ref(false),
    showDeleteResumeDialog,
  };
}

function syncSelectedResumeIdFromRoute(
  route: RouteLocationNormalizedLoaded,
  selectedResumeId: Ref<string | null>,
) {
  const id = route.query[APP_ROUTE_QUERY_KEYS.id];
  if (typeof id === "string" && id.trim()) {
    selectedResumeId.value = id.trim();
  }
}

export async function useResumePageBootstrap({
  fetchDashboard,
  fetchResumes,
  getResume,
  route,
}: ResumePageBootstrapInput) {
  const state = createResumePageBootstrapState();

  const {
    error: resumeBootstrapError,
    status: resumeBootstrapStatus,
    refresh: refreshResumeBootstrap,
  } = await useAsyncData("resume-page-bootstrap", async () => {
    await fetchResumes();
    await fetchDashboard();
    syncSelectedResumeIdFromRoute(route, state.selectedResumeId);

    return true;
  });

  watch(state.selectedResumeId, async (id) => {
    if (!id) {
      return;
    }

    const resume = await getResume(id);
    if (resume) {
      Object.assign(state.formData, resumeDataToFormData(resume));
    }
  });

  return {
    activeTab: state.activeTab,
    clearDeleteResumeState: state.clearDeleteResumeState,
    closeDeleteResumeDialog: state.closeDeleteResumeDialog,
    creating: state.creating,
    enhancing: state.enhancing,
    formData: state.formData,
    newResumeName: state.newResumeName,
    newResumeTemplate: state.newResumeTemplate,
    pendingDeleteResumeId: state.pendingDeleteResumeId,
    refreshResumeBootstrap,
    requestDeleteResume: state.requestDeleteResume,
    resumeBootstrapError,
    resumeBootstrapStatus,
    resumeSearchQuery: state.resumeSearchQuery,
    scoring: state.scoring,
    selectedResumeId: state.selectedResumeId,
    showCreateModal: state.showCreateModal,
    showDeleteResumeDialog: state.showDeleteResumeDialog,
  };
}
