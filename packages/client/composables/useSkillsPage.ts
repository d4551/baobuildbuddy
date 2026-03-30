import type { SkillMapping } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { SKILLS_DEFAULT_CATEGORY, SKILLS_DEFAULT_CONFIDENCE, SKILLS_FILTER_ALL_VALUE } from "~/constants/skills";
import { createSkillsPageActions, type NewSkillMappingFormState } from "~/composables/skills-page-actions";
import { createSkillsPageDerived } from "~/composables/skills-page-derived";

type SkillsFilterValue = typeof SKILLS_FILTER_ALL_VALUE | NewSkillMappingFormState["category"];

function useSkillsPageDependencies() {
  return {
    api: useApi(),
    toast: useNuxtApp().$toast,
    t: useI18n().t,
    gamification: useGamification(),
  };
}

function createSkillsPageState() {
  return {
    mappings: ref<SkillMapping[]>([]),
    loading: ref(false),
    analyzing: ref(false),
    pageError: ref<string | null>(null),
    showAddModal: ref(false),
    categoryFilter: ref<SkillsFilterValue>(SKILLS_FILTER_ALL_VALUE),
    searchFilter: ref(""),
    newApplication: ref(""),
  };
}

function createSkillsPageFormState() {
  return reactive<NewSkillMappingFormState>({
    gameExpression: "",
    transferableSkill: "",
    industryApplications: [],
    confidence: SKILLS_DEFAULT_CONFIDENCE,
    category: SKILLS_DEFAULT_CATEGORY,
  });
}

function useSkillsPageDeleteState() {
  const {
    showDeleteDialog: showDeleteMappingDialog,
    pendingDeleteId: pendingDeleteMappingId,
    requestDelete: requestDeleteMapping,
    clearDeleteState: clearDeleteMappingState,
    closeDeleteDialog: closeDeleteMappingDialog,
  } = useDeleteConfirmation();

  return {
    showDeleteMappingDialog,
    pendingDeleteMappingId,
    requestDeleteMapping,
    clearDeleteMappingState,
    closeDeleteMappingDialog,
  };
}

function createSkillsProgress(gamification: ReturnType<typeof useGamification>) {
  return {
    level: computed(() => gamification.progress.value?.level ?? 1),
    xp: computed(() => gamification.progress.value?.xp ?? 0),
  };
}

function mergeSkillsPageState(input: {
  state: ReturnType<typeof createSkillsPageState>;
  newMapping: NewSkillMappingFormState;
  deletion: ReturnType<typeof useSkillsPageDeleteState>;
  derived: ReturnType<typeof createSkillsPageDerived>;
  actions: ReturnType<typeof createSkillsPageActions>;
}) {
  return {
    analyzing: input.state.analyzing,
    categoryFilter: input.state.categoryFilter,
    clearDeleteMappingState: input.deletion.clearDeleteMappingState,
    closeDeleteMappingDialog: input.deletion.closeDeleteMappingDialog,
    loading: input.state.loading,
    newApplication: input.state.newApplication,
    newMapping: input.newMapping,
    pageError: input.state.pageError,
    pendingDeleteMappingId: input.deletion.pendingDeleteMappingId,
    requestDeleteMapping: input.deletion.requestDeleteMapping,
    searchFilter: input.state.searchFilter,
    showAddModal: input.state.showAddModal,
    showDeleteMappingDialog: input.deletion.showDeleteMappingDialog,
    ...input.derived,
    ...input.actions,
  };
}

export function useSkillsPage() {
  const { api, toast, t, gamification } = useSkillsPageDependencies();
  const state = createSkillsPageState();
  const deletion = useSkillsPageDeleteState();
  const newMapping = createSkillsPageFormState();
  const progress = createSkillsProgress(gamification);

  const derived = createSkillsPageDerived({
    mappings: state.mappings,
    categoryFilter: state.categoryFilter,
    searchFilter: state.searchFilter,
    level: progress.level,
    xp: progress.xp,
    t,
  });

  const actions = createSkillsPageActions({
    api,
    toast,
    t,
    awardXP: gamification.awardXP,
    fetchProgress: gamification.fetchProgress,
    mappings: state.mappings,
    loading: state.loading,
    analyzing: state.analyzing,
    pageError: state.pageError,
    showAddModal: state.showAddModal,
    pendingDeleteMappingId: deletion.pendingDeleteMappingId,
    closeDeleteMappingDialog: deletion.closeDeleteMappingDialog,
    newApplication: state.newApplication,
    newMapping,
  });

  return mergeSkillsPageState({
    state,
    newMapping,
    deletion,
    derived,
    actions,
  });
}
