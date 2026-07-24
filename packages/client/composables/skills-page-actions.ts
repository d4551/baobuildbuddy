import { ROUTE_GAMIFICATION_XP } from "@bao/shared/constants/gamification";
import type { SkillCategory, SkillMapping } from "@bao/shared/types/skill-mapping";
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
  awardXP: (amount: number, reason: string) => Promise<void>;
  fetchProgress: () => Promise<void>;
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

function createSkillFormActions(
  newApplication: SkillsPageActionsInput["newApplication"],
  newMapping: SkillsPageActionsInput["newMapping"],
) {
  function resetForm(): void {
    newMapping.gameExpression = DEFAULT_SKILL_FORM_STATE.gameExpression;
    newMapping.transferableSkill = DEFAULT_SKILL_FORM_STATE.transferableSkill;
    newMapping.industryApplications = [...DEFAULT_SKILL_FORM_STATE.industryApplications];
    newMapping.confidence = DEFAULT_SKILL_FORM_STATE.confidence;
    newMapping.category = DEFAULT_SKILL_FORM_STATE.category;
    newApplication.value = "";
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
    removeApplication,
    resetForm,
  };
}

function createFetchMappingsAction({
  api,
  toast,
  t,
  mappings,
  loading,
  pageError,
}: Pick<SkillsPageActionsInput, "api" | "toast" | "t" | "mappings" | "loading" | "pageError">) {
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

  return { fetchMappings };
}

function createSkillsGamificationActions(
  input: Pick<SkillsPageActionsInput, "awardXP" | "fetchProgress" | "t">,
) {
  async function syncGamificationProgress(): Promise<void> {
    await settlePromise(input.fetchProgress(), input.t("skillsPage.errors.gamificationLoadFailed"));
  }

  async function tryAwardSkillXp(
    amount: number,
    reason: SkillsGamificationReason,
  ): Promise<boolean> {
    const awardResult = await settlePromise(
      input.awardXP(amount, reason),
      input.t("apiErrors.gamification.awardXPFailed"),
    );
    return awardResult.ok;
  }

  return {
    syncGamificationProgress,
    tryAwardSkillXp,
  };
}

function createSkillsMutationActions(
  input: Pick<
    SkillsPageActionsInput,
    | "api"
    | "toast"
    | "t"
    | "loading"
    | "analyzing"
    | "showAddModal"
    | "pendingDeleteMappingId"
    | "closeDeleteMappingDialog"
    | "newMapping"
  >,
  support: {
    fetchMappings: () => Promise<void>;
    resetForm: () => void;
    tryAwardSkillXp: (amount: number, reason: SkillsGamificationReason) => Promise<boolean>;
  },
) {
  const handleAddMapping = createAddMappingAction(input, support);
  const handleDeleteMapping = createDeleteMappingAction(input, support);
  const handleAIAnalyze = createAnalyzeSkillsAction(input, support);

  return {
    handleAddMapping,
    handleAIAnalyze,
    handleDeleteMapping,
  };
}

function createAddMappingAction(
  input: Pick<
    SkillsPageActionsInput,
    "api" | "toast" | "t" | "loading" | "showAddModal" | "newMapping"
  >,
  support: Pick<Parameters<typeof createSkillsMutationActions>[1], "fetchMappings" | "resetForm">,
) {
  return async function handleAddMapping(): Promise<void> {
    const normalizedGameExpression = input.newMapping.gameExpression.trim();
    if (normalizedGameExpression.length < SKILLS_MIN_GAME_EXPRESSION_LENGTH) {
      input.toast.error(input.t("skillsPage.errors.gameExpressionMinLength"));
      return;
    }

    const normalizedTransferableSkill = input.newMapping.transferableSkill.trim();
    if (normalizedTransferableSkill.length < SKILLS_MIN_TRANSFERABLE_SKILL_LENGTH) {
      input.toast.error(input.t("skillsPage.errors.transferableSkillMinLength"));
      return;
    }

    input.loading.value = true;
    const addMappingResult = await settlePromise(
      (async () => {
        await input.api.skills.mappings.post({
          gameExpression: normalizedGameExpression,
          transferableSkill: normalizedTransferableSkill,
          industryApplications: input.newMapping.industryApplications,
          confidence: input.newMapping.confidence,
          category: input.newMapping.category,
          demandLevel: SKILLS_DEFAULT_DEMAND_LEVEL,
        });
        await support.fetchMappings();
        input.showAddModal.value = false;
        support.resetForm();
      })(),
      input.t("skillsPage.errors.addFailed"),
    );
    input.loading.value = false;

    if (!addMappingResult.ok) {
      input.toast.error(
        getErrorMessage(addMappingResult.error, input.t("skillsPage.errors.addFailed")),
      );
      return;
    }

    input.toast.success(
      input.t("skillsPage.toasts.mappingAddedWithXp", {
        xp: ROUTE_GAMIFICATION_XP.skillsMapped,
      }),
    );
  };
}

function createDeleteMappingAction(
  input: Pick<
    SkillsPageActionsInput,
    "api" | "toast" | "t" | "loading" | "pendingDeleteMappingId" | "closeDeleteMappingDialog"
  >,
  support: Pick<Parameters<typeof createSkillsMutationActions>[1], "fetchMappings">,
) {
  return async function handleDeleteMapping(): Promise<void> {
    const id = input.pendingDeleteMappingId.value;
    if (!id) {
      return;
    }

    input.loading.value = true;
    const deleteResult = await settlePromise(
      (async () => {
        await input.api.skills.mappings({ id }).delete();
        await support.fetchMappings();
      })(),
      input.t("skillsPage.errors.deleteFailed"),
    );
    input.loading.value = false;
    input.closeDeleteMappingDialog();

    if (!deleteResult.ok) {
      input.toast.error(
        getErrorMessage(deleteResult.error, input.t("skillsPage.errors.deleteFailed")),
      );
      return;
    }

    input.toast.success(input.t("skillsPage.toasts.mappingDeleted"));
  };
}

function createAnalyzeSkillsAction(
  input: Pick<SkillsPageActionsInput, "api" | "toast" | "t" | "analyzing">,
  support: Pick<
    Parameters<typeof createSkillsMutationActions>[1],
    "fetchMappings" | "tryAwardSkillXp"
  >,
) {
  return async function handleAIAnalyze(): Promise<void> {
    input.analyzing.value = true;
    const analysisResult = await settlePromise(
      input.api.skills["ai-analyze"].post({}),
      input.t("skillsPage.errors.analysisFailed"),
    );
    input.analyzing.value = false;

    if (!analysisResult.ok) {
      input.toast.error(
        getErrorMessage(analysisResult.error, input.t("skillsPage.errors.analysisFailed")),
      );
      return;
    }

    if (!analysisResult.value.data) {
      return;
    }

    await support.fetchMappings();
    const awardedXp = await support.tryAwardSkillXp(
      SKILLS_GAMIFICATION_XP.aiAnalysisCompleted,
      SKILLS_GAMIFICATION_REASONS.aiAnalysisCompleted,
    );
    input.toast.success(
      awardedXp
        ? input.t("skillsPage.toasts.analysisCompletedWithXp", {
            xp: SKILLS_GAMIFICATION_XP.aiAnalysisCompleted,
          })
        : input.t("skillsPage.toasts.analysisCompleted"),
    );
  };
}

export function createSkillsPageActions(input: SkillsPageActionsInput) {
  const form = createSkillFormActions(input.newApplication, input.newMapping);
  const fetchActions = createFetchMappingsAction(input);
  const gamification = createSkillsGamificationActions(input);
  const mutations = createSkillsMutationActions(input, {
    fetchMappings: fetchActions.fetchMappings,
    resetForm: form.resetForm,
    tryAwardSkillXp: gamification.tryAwardSkillXp,
  });

  async function initializeSkillsPage(): Promise<void> {
    await Promise.all([fetchActions.fetchMappings(), gamification.syncGamificationProgress()]);
  }

  return {
    ...fetchActions,
    ...form,
    ...mutations,
    initializeSkillsPage,
  };
}
