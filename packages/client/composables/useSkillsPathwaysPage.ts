import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { ReadinessAssessment } from "@bao/shared/types/skill-mapping";
import { computed, type Ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  type SkillsPathwaysBootstrapData,
  type SkillsPathwaysGamificationProgress,
  toGamificationProgress,
  toSkillsPathwaysBootstrapData,
} from "~/composables/skills-pathways-page-data";
import { createSkillsPathwaysPresentation } from "~/composables/skills-pathways-page-presentation";
import { SKILLS_READINESS_MAX, SKILLS_READINESS_MIN } from "~/constants/skills";
import { requireApiResponseData } from "~/utils/api-response";
import { getErrorMessage } from "~/utils/errors";

const useSkillsPathwaysBootstrap = (
  api: ReturnType<typeof useApi>,
  t: ReturnType<typeof useI18n>["t"],
) =>
  useAsyncData<SkillsPathwaysBootstrapData>(
    "skills-pathways-bootstrap",
    async () => {
      const [pathwaysData, readinessData] = await Promise.all([
        api.skills.pathways.get(),
        api.skills.readiness.get(),
      ]);
      const pathways = requireApiResponseData(
        pathwaysData,
        t("skillsPathwaysPage.errors.pathwaysLoadFailed"),
      );
      const readiness = requireApiResponseData(
        readinessData,
        t("skillsPathwaysPage.errors.readinessLoadFailed"),
      );
      const normalized = toSkillsPathwaysBootstrapData({ pathways, readiness });
      if (!normalized) {
        throw new Error(t("skillsPathwaysPage.errors.loadFailed"));
      }
      return normalized;
    },
    {
      lazy: false,
      server: true,
    },
  );

const useSkillsPathwaysGamification = (
  api: ReturnType<typeof useApi>,
  t: ReturnType<typeof useI18n>["t"],
) =>
  useAsyncData(
    "skills-pathways-gamification-progress",
    async () => {
      const response = await api.gamification.progress.get();
      const progress = requireApiResponseData(
        response,
        t("skillsPathwaysPage.errors.gamificationLoadFailed"),
      );
      const normalized = toGamificationProgress(progress);
      if (!normalized) {
        throw new Error(t("skillsPathwaysPage.errors.gamificationLoadFailed"));
      }
      return normalized;
    },
    {
      lazy: false,
      server: true,
    },
  );

const createSkillsPathwaysDerivedState = (options: {
  readonly data: Ref<SkillsPathwaysBootstrapData | null | undefined>;
  readonly gamificationProgress: Ref<SkillsPathwaysGamificationProgress | null | undefined>;
  readonly status: Ref<"idle" | "pending" | "success" | "error">;
  readonly gamificationStatus: Ref<"idle" | "pending" | "success" | "error">;
  readonly presentation: ReturnType<typeof createSkillsPathwaysPresentation>;
  readonly t: ReturnType<typeof useI18n>["t"];
}) => {
  const gamificationReady = computed(() => options.gamificationStatus.value === "success");
  const uiState = computed(() => {
    if (options.status.value === "pending" || options.status.value === "idle") return "loading";
    if (options.status.value === "error") return "error";
    return "success";
  });

  const breadcrumbs = computed(() => [
    { label: options.t("nav.skills"), to: APP_ROUTES.skills },
    { label: options.t("skillsPathwaysPage.title") },
  ]);
  const gamificationLevel = computed(() =>
    gamificationReady.value ? (options.gamificationProgress.value?.level ?? 1) : 0,
  );
  const gamificationXP = computed(() =>
    gamificationReady.value ? (options.gamificationProgress.value?.xp ?? 0) : 0,
  );

  const readinessAssessment = computed<ReadinessAssessment | null>(
    () => options.data.value?.readiness ?? null,
  );
  const sortedPathways = computed(() =>
    options.presentation.sortPathways(options.data.value?.pathways ?? []),
  );
  const readinessCategories = computed(() =>
    options.presentation.createReadinessCategories(readinessAssessment.value),
  );
  return {
    gamificationReady,
    uiState,
    breadcrumbs,
    gamificationLevel,
    gamificationXP,
    readinessAssessment,
    sortedPathways,
    readinessCategories,
  };
};

const registerSkillsPathwaysErrorToast = (
  error: Ref<unknown>,
  toast: ReturnType<typeof useNuxtApp>["$toast"],
  t: ReturnType<typeof useI18n>["t"],
) => {
  watch(
    () => error.value,
    (nextError) => {
      if (import.meta.client && nextError) {
        toast.error(getErrorMessage(nextError, t("skillsPathwaysPage.errors.loadFailed")));
      }
    },
  );
};

export const useSkillsPathwaysPage = () => {
  const api = useApi();
  const { $toast } = useNuxtApp();
  const { t } = useI18n();
  const presentation = createSkillsPathwaysPresentation({ t });
  const { data, status, error, refresh } = useSkillsPathwaysBootstrap(api, t);
  const {
    data: gamificationProgress,
    status: gamificationStatus,
    error: gamificationError,
    refresh: refreshGamificationProgress,
  } = useSkillsPathwaysGamification(api, t);
  const derived = createSkillsPathwaysDerivedState({
    data,
    gamificationProgress,
    status,
    gamificationStatus,
    presentation,
    t,
  });
  registerSkillsPathwaysErrorToast(error, $toast, t);

  const retryLoad = async (): Promise<void> => {
    await refresh();
  };

  return {
    t,
    uiState: derived.uiState,
    error,
    breadcrumbs: derived.breadcrumbs,
    gamificationStatus,
    gamificationError,
    gamificationReady: derived.gamificationReady,
    gamificationLevel: derived.gamificationLevel,
    gamificationXP: derived.gamificationXP,
    refreshGamificationProgress,
    readinessAssessment: derived.readinessAssessment,
    readinessCategories: derived.readinessCategories,
    sortedPathways: derived.sortedPathways,
    retryLoad,
    readinessMin: SKILLS_READINESS_MIN,
    readinessMax: SKILLS_READINESS_MAX,
    getCategoryLabel: presentation.getCategoryLabel,
    getCategoryFeedbackLabel: presentation.getCategoryFeedbackLabel,
    getReadinessImprovementLabel: presentation.getReadinessImprovementLabel,
    getReadinessNextStepLabel: presentation.getReadinessNextStepLabel,
    getReadinessColor: presentation.getReadinessColor,
    getReadinessBadgeColor: presentation.getReadinessBadgeColor,
    getPathwayIcon: presentation.getPathwayIcon,
  };
};
