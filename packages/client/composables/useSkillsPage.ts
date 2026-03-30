import type { SkillMapping } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { SKILLS_DEFAULT_CATEGORY, SKILLS_DEFAULT_CONFIDENCE, SKILLS_FILTER_ALL_VALUE } from "~/constants/skills";
import { createSkillsPageActions, type NewSkillMappingFormState } from "~/composables/skills-page-actions";
import { createSkillsPageDerived } from "~/composables/skills-page-derived";

type SkillsFilterValue = typeof SKILLS_FILTER_ALL_VALUE | NewSkillMappingFormState["category"];

export function useSkillsPage() {
  const api = useApi();
  const { $toast } = useNuxtApp();
  const { t } = useI18n();
  const { awardXP, progress, fetchProgress } = useGamification();

  const mappings = ref<SkillMapping[]>([]);
  const loading = ref(false);
  const analyzing = ref(false);
  const pageError = ref<string | null>(null);
  const showAddModal = ref(false);
  const categoryFilter = ref<SkillsFilterValue>(SKILLS_FILTER_ALL_VALUE);
  const searchFilter = ref("");
  const newApplication = ref("");

  const {
    showDeleteDialog: showDeleteMappingDialog,
    pendingDeleteId: pendingDeleteMappingId,
    requestDelete: requestDeleteMapping,
    clearDeleteState: clearDeleteMappingState,
    closeDeleteDialog: closeDeleteMappingDialog,
  } = useDeleteConfirmation();

  const newMapping = reactive<NewSkillMappingFormState>({
    gameExpression: "",
    transferableSkill: "",
    industryApplications: [],
    confidence: SKILLS_DEFAULT_CONFIDENCE,
    category: SKILLS_DEFAULT_CATEGORY,
  });

  const level = computed(() => progress.value?.level ?? 1);
  const xp = computed(() => progress.value?.xp ?? 0);

  const derived = createSkillsPageDerived({
    mappings,
    categoryFilter,
    searchFilter,
    level,
    xp,
    t,
  });

  const actions = createSkillsPageActions({
    api,
    toast: $toast,
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
  });

  return {
    analyzing,
    categoryFilter,
    clearDeleteMappingState,
    closeDeleteMappingDialog,
    loading,
    newApplication,
    newMapping,
    pageError,
    pendingDeleteMappingId,
    requestDeleteMapping,
    searchFilter,
    showAddModal,
    showDeleteMappingDialog,
    ...derived,
    ...actions,
  };
}
