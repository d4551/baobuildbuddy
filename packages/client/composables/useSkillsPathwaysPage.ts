import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { CareerPathway, ReadinessAssessment } from "@bao/shared/types/skill-mapping";
import { computed, type Ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { createSkillsPathwaysPresentation } from "~/composables/skills-pathways-page-presentation";
import { SKILLS_READINESS_MAX, SKILLS_READINESS_MIN } from "~/constants/skills";
import { getErrorMessage } from "~/utils/errors";

interface SkillsPathwaysBootstrapData {
  readonly pathways: readonly CareerPathway[];
  readonly readiness: ReadinessAssessment;
}

const useSkillsPathwaysBootstrap = async (
  api: ReturnType<typeof useApi>,
  t: ReturnType<typeof useI18n>["t"],
) =>
  useAsyncData<SkillsPathwaysBootstrapData>(
    "skills-pathways-bootstrap",
    async () => {
      const [pathwaysResponse, readinessResponse] = await Promise.all([
        api.skills.pathways.get(),
        api.skills.readiness.get(),
      ]);

      if (pathwaysResponse.error) {
        throw new Error(
          getErrorMessage(
            pathwaysResponse.error,
            t("skillsPathwaysPage.errors.pathwaysLoadFailed"),
          ),
        );
      }
      if (readinessResponse.error) {
        throw new Error(
          getErrorMessage(
            readinessResponse.error,
            t("skillsPathwaysPage.errors.readinessLoadFailed"),
          ),
        );
      }

      return {
        pathways: pathwaysResponse.data,
        readiness: readinessResponse.data,
      };
    },
    {
      lazy: false,
      server: true,
    },
  );

const useSkillsPathwaysGamification = async (
  api: ReturnType<typeof useApi>,
  t: ReturnType<typeof useI18n>["t"],
) =>
  useAsyncData(
    "skills-pathways-gamification-progress",
    async () => {
      const progressResponse = await api.gamification.progress.get();
      if (progressResponse.error) {
        throw new Error(
          getErrorMessage(
            progressResponse.error,
            t("skillsPathwaysPage.errors.gamificationLoadFailed"),
          ),
        );
      }

      return progressResponse.data;
    },
    {
      lazy: false,
      server: true,
    },
  );

const createSkillsPathwaysDerivedState = (options: {
  readonly data: Ref<SkillsPathwaysBootstrapData | null | undefined>;
  readonly gamificationProgress: Ref<{ level?: number; xp?: number } | null | undefined>;
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

export const useSkillsPathwaysPage = async () => {
  const api = useApi();
  const { $toast } = useNuxtApp();
  const { t } = useI18n();
  const presentation = createSkillsPathwaysPresentation({ t });
  const { data, status, error, refresh } = await useSkillsPathwaysBootstrap(api, t);
  const {
    data: gamificationProgress,
    status: gamificationStatus,
    error: gamificationError,
    refresh: refreshGamificationProgress,
  } = await useSkillsPathwaysGamification(api, t);
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
    getReadinessDialStyle: presentation.getReadinessDialStyle,
    getPathwayIcon: presentation.getPathwayIcon,
  };
};
