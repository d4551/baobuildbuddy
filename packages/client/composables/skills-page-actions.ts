import { ROUTE_GAMIFICATION_XP, type SkillCategory, type SkillMapping } from "@bao/shared";
import type { Ref } from "vue";
import { toSkillMapping } from "~/composables/api-normalizer-skills";
import { settlePromise } from "~/composables/async-flow";
import {
  SKILLS_DEFAULT_CATEGORY,
  SKILLS_DEFAULT_CONFIDENCE,
  SKILLS_DEFAULT_DEMAND_LEVEL,
  SKILLS_GAMIFICATION_REASONS,
  SKILLS_GAMIFICATION_XP,
  SKILLS_MIN_GAME_EXPRESSION_LENGTH,
  SKILLS_MIN_TRANSFERABLE_SKILL_LENGTH,
  type SkillsGamificationReason,
} from "~/constants/skills";
import { getErrorMessage } from "~/utils/errors";

export interface NewSkillMappingFormState {
  gameExpression: string;
  transferableSkill: string;
  industryApplications: string[];
  confidence: number;
  category: SkillCategory;
}

type SkillsPageActionsInput = {
  api: ReturnType<typeof useApi>;
  toast: {
    error: (message: string) => void;
    success: (message: string) => void;
  };
  t: (key: string, params?: Record<string, string | number>) => string;
  awardXP: (amount: number, reason: string) => Promise<unknown>;
  fetchProgress: () => Promise<unknown>;
  mappings: Ref<SkillMapping[]>;
  loading: Ref<boolean>;
  analyzing: Ref<boolean>;
  pageError: Ref<string | null>;
  showAddModal: Ref<boolean>;
  pendingDeleteMappingId: Ref<string | null>;
  closeDeleteMappingDialog: () => void;
  newApplication: Ref<string>;
  newMapping: NewSkillMappingFormState;
};

const DEFAULT_SKILL_FORM_STATE = {
  gameExpression: "",
  transferableSkill: "",
  industryApplications: [],
  confidence: SKILLS_DEFAULT_CONFIDENCE,
  category: SKILLS_DEFAULT_CATEGORY,
} satisfies NewSkillMappingFormState;

export function createSkillsPageActions({
  api,
  toast,
  t,
  awardXP,
  fetchProgress,
  mappings,
  loading,
  analyzing,
  pageError,
  showAddModal,
  pendingDeleteMappingId,
  closeDeleteMappingDialog,
  newApplication,
  newMapping,
}: SkillsPageActionsInput) {
  function resetForm(): void {
    newMapping.gameExpression = DEFAULT_SKILL_FORM_STATE.gameExpression;
    newMapping.transferableSkill = DEFAULT_SKILL_FORM_STATE.transferableSkill;
    newMapping.industryApplications = [...DEFAULT_SKILL_FORM_STATE.industryApplications];
    newMapping.confidence = DEFAULT_SKILL_FORM_STATE.confidence;
    newMapping.category = DEFAULT_SKILL_FORM_STATE.category;
    newApplication.value = "";
  }

  async function fetchMappings(): Promise<void> {
    pageError.value = null;
    loading.value = true;
    const mappingsResult = await settlePromise(
      api.skills.mappings.get(),
      t("skillsPage.errors.fetchFailed"),
    );
    loading.value = false;

    if (!mappingsResult.ok) {
      pageError.value = getErrorMessage(mappingsResult.error, t("skillsPage.errors.fetchFailed"));
      toast.error(pageError.value);
      return;
    }

    const { data } = mappingsResult.value;
    mappings.value = Array.isArray(data)
      ? data
          .map((entry) => toSkillMapping(entry))
          .filter((entry): entry is SkillMapping => entry !== null)
      : [];
  }

  async function syncGamificationProgress(): Promise<void> {
    await settlePromise(fetchProgress(), t("skillsPage.errors.gamificationLoadFailed"));
  }

  async function initializeSkillsPage(): Promise<void> {
    await Promise.all([fetchMappings(), syncGamificationProgress()]);
  }

  async function tryAwardSkillXp(amount: number, reason: SkillsGamificationReason): Promise<boolean> {
    const awardResult = await settlePromise(
      awardXP(amount, reason),
      t("apiErrors.gamification.awardXPFailed"),
    );
    return awardResult.ok;
  }

  async function handleAddMapping(): Promise<void> {
    const normalizedGameExpression = newMapping.gameExpression.trim();
    if (normalizedGameExpression.length < SKILLS_MIN_GAME_EXPRESSION_LENGTH) {
      toast.error(t("skillsPage.errors.gameExpressionMinLength"));
      return;
    }

    const normalizedTransferableSkill = newMapping.transferableSkill.trim();
    if (normalizedTransferableSkill.length < SKILLS_MIN_TRANSFERABLE_SKILL_LENGTH) {
      toast.error(t("skillsPage.errors.transferableSkillMinLength"));
      return;
    }

    loading.value = true;
    const addMappingResult = await settlePromise(
      (async () => {
        await api.skills.mappings.post({
          gameExpression: normalizedGameExpression,
          transferableSkill: normalizedTransferableSkill,
          industryApplications: newMapping.industryApplications,
          confidence: newMapping.confidence,
          category: newMapping.category,
          demandLevel: SKILLS_DEFAULT_DEMAND_LEVEL,
        });
        await fetchMappings();
        showAddModal.value = false;
        resetForm();
      })(),
      t("skillsPage.errors.addFailed"),
    );
    loading.value = false;

    if (!addMappingResult.ok) {
      toast.error(getErrorMessage(addMappingResult.error, t("skillsPage.errors.addFailed")));
      return;
    }

    toast.success(
      t("skillsPage.toasts.mappingAddedWithXp", {
        xp: ROUTE_GAMIFICATION_XP.skillsMapped,
      }),
    );
  }

  async function handleDeleteMapping(): Promise<void> {
    const id = pendingDeleteMappingId.value;
    if (!id) {
      return;
    }

    loading.value = true;
    const deleteResult = await settlePromise(
      (async () => {
        await api.skills.mappings({ id }).delete();
        await fetchMappings();
      })(),
      t("skillsPage.errors.deleteFailed"),
    );
    loading.value = false;
    closeDeleteMappingDialog();

    if (!deleteResult.ok) {
      toast.error(getErrorMessage(deleteResult.error, t("skillsPage.errors.deleteFailed")));
      return;
    }

    toast.success(t("skillsPage.toasts.mappingDeleted"));
  }

  async function handleAIAnalyze(): Promise<void> {
    analyzing.value = true;
    const analysisResult = await settlePromise(
      api.skills["ai-analyze"].post({}),
      t("skillsPage.errors.analysisFailed"),
    );
    analyzing.value = false;

    if (!analysisResult.ok) {
      toast.error(getErrorMessage(analysisResult.error, t("skillsPage.errors.analysisFailed")));
      return;
    }

    if (!analysisResult.value.data) {
      return;
    }

    await fetchMappings();
    const awardedXp = await tryAwardSkillXp(
      SKILLS_GAMIFICATION_XP.aiAnalysisCompleted,
      SKILLS_GAMIFICATION_REASONS.aiAnalysisCompleted,
    );
    toast.success(
      awardedXp
        ? t("skillsPage.toasts.analysisCompletedWithXp", {
            xp: SKILLS_GAMIFICATION_XP.aiAnalysisCompleted,
          })
        : t("skillsPage.toasts.analysisCompleted"),
    );
  }

  function addApplication(): void {
    const normalizedApplication = newApplication.value.trim();
    if (normalizedApplication.length === 0) {
      return;
    }

    newMapping.industryApplications.push(normalizedApplication);
    newApplication.value = "";
  }

  function removeApplication(index: number): void {
    newMapping.industryApplications.splice(index, 1);
  }

  return {
    addApplication,
    fetchMappings,
    handleAddMapping,
    handleAIAnalyze,
    handleDeleteMapping,
    initializeSkillsPage,
    removeApplication,
    resetForm,
  };
}
