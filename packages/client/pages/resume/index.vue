<script setup lang="ts">
import {
  APP_ROUTE_QUERY_KEYS,
  APP_ROUTES,
  formDataToResumeData,
  RESUME_LIST_PAGE_SIZE,
  RESUME_TEMPLATE_DEFAULT,
  RESUME_TEMPLATE_OPTIONS,
  type ResumeFormData,
  type ResumeTemplate,
  resumeDataToFormData,
  type DashboardStats,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { createFlowEngineInput } from "~/constants/flow-engine";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});

const {
  resumes,
  loading,
  fetchResumes,
  getResume,
  createResume,
  updateResume,
  deleteResume,
  exportResume,
  aiEnhance,
  aiScore,
} = useResume();
type ResumeScoreResult = Awaited<ReturnType<ReturnType<typeof useResume>["aiScore"]>>;
const route = useRoute();
const { $toast } = useNuxtApp();
const { t } = useI18n();
const i18n = useI18n();
const { awardForAction } = usePipelineGamification();
const { dashboard: dashboardStats, fetchDashboard } = useStatistics();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("resumePage.seoTitle"),
    description: t("resumePage.seoDescription"),
  });
}

const showCreateModal = ref(false);
const newResumeName = ref("");
const newResumeTemplate = ref<ResumeTemplate>(RESUME_TEMPLATE_DEFAULT);
const RESUME_CREATE_DIALOG_TITLE_ID = "resume-page-create-dialog-title";
const selectedResumeId = ref<string | null>(null);
const showDeleteResumeDialog = ref(false);
const pendingDeleteResumeId = ref<string | null>(null);
type ResumeTabId = "personal" | "experience" | "education" | "skills" | "projects" | "gaming";
const RESUME_TABS = [
  "personal",
  "experience",
  "education",
  "skills",
  "projects",
  "gaming",
] as const satisfies readonly ResumeTabId[];
const activeTab = ref<ResumeTabId>("personal");
const resumeTabListId = `resume-tabs-${useId()}`;
const resumeTabRefs = ref<(HTMLButtonElement | null)[]>([]);
const creating = ref(false);
const enhancing = ref(false);
const scoring = ref(false);
const scoreResult = ref<ResumeScoreResult | null>(null);
const resumeSearchQuery = ref("");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const templateLabelMap = computed<Record<ResumeTemplate, string>>(() => {
  return RESUME_TEMPLATE_OPTIONS.reduce(
    (acc, template) => {
      acc[template] = i18n.t(`resumePage.createModal.templates.${template}`);
      return acc;
    },
    {} as Record<ResumeTemplate, string>,
  );
});
const createResumeTemplateOptions = computed(() =>
  RESUME_TEMPLATE_OPTIONS.map((template) => ({
    value: template,
    label: templateLabelMap.value[template],
  })),
);
const aiEnhancementStepLabels = computed(
  () =>
    [
      t("resumePage.aiSteps.analyzing"),
      t("resumePage.aiSteps.enhancing"),
      t("resumePage.aiSteps.finalizing"),
    ] as const,
);
const aiEnhancementStepIndex = ref(0);
let aiEnhancementTimer: ReturnType<typeof setInterval> | null = null;

const formData = reactive<ResumeFormData>({
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

function hasNonEmptyGamingValue(value: string | string[]): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => typeof entry === "string" && entry.trim().length > 0);
  }
  return value.trim().length > 0;
}

const resumeSectionCompletion = computed<
  {
    id: ResumeTabId;
    completed: boolean;
  }[]
>(() => {
  const personalComplete =
    formData.name.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.summary.trim().length > 0;
  const experienceComplete =
    formData.experience.length > 0 &&
    formData.experience.every(
      (item) =>
        item.title.trim().length > 0 &&
        item.company.trim().length > 0 &&
        item.description.trim().length > 0,
    );
  const educationComplete =
    formData.education.length > 0 &&
    formData.education.every(
      (item) => item.degree.trim().length > 0 && item.school.trim().length > 0,
    );
  const skillsComplete = formData.skills.length > 0;
  const projectsComplete =
    formData.projects.length > 0 &&
    formData.projects.every(
      (item) => item.name.trim().length > 0 && item.description.trim().length > 0,
    );
  const gamingComplete =
    hasNonEmptyGamingValue(formData.gaming.roles) ||
    hasNonEmptyGamingValue(formData.gaming.genres) ||
    hasNonEmptyGamingValue(formData.gaming.achievements);

  return [
    { id: RESUME_TABS[0], completed: personalComplete },
    { id: RESUME_TABS[1], completed: experienceComplete },
    { id: RESUME_TABS[2], completed: educationComplete },
    { id: RESUME_TABS[3], completed: skillsComplete },
    { id: RESUME_TABS[4], completed: projectsComplete },
    { id: RESUME_TABS[5], completed: gamingComplete },
  ];
});

const completedSectionCount = computed(
  () => resumeSectionCompletion.value.filter((section) => section.completed).length,
);

const completionPercent = computed(() => {
  const total = resumeSectionCompletion.value.length;
  if (total === 0) return 0;
  return Math.round((completedSectionCount.value / total) * 100);
});

const nextRecommendedTab = computed<ResumeTabId | null>(() => {
  const incomplete = resumeSectionCompletion.value.find((section) => !section.completed);
  return incomplete ? incomplete.id : null;
});

const filteredResumes = computed(() => {
  const query = resumeSearchQuery.value.trim().toLowerCase();
  if (!query) return resumes.value;

  return resumes.value.filter((resume) => {
    const name = (resume.name || "").toLowerCase();
    const template = (resume.template || "").toLowerCase();
    return name.includes(query) || template.includes(query);
  });
});

const hasResumeFiltersApplied = computed(() => resumeSearchQuery.value.trim().length > 0);

const resumePagination = usePagination(filteredResumes, RESUME_LIST_PAGE_SIZE, [resumeSearchQuery]);

const resumePaginationSummary = computed(() =>
  t("resumePage.pagination.summary", {
    start: resumePagination.rangeStart.value,
    end: resumePagination.rangeEnd.value,
    total: resumePagination.totalItems.value,
  }),
);

const coverLetterQuickActionRoute = computed(() => ({
  path: APP_ROUTES.coverLetter,
  ...(selectedResumeId.value
    ? {
        query: {
          [APP_ROUTE_QUERY_KEYS.resumeId]: selectedResumeId.value,
        },
      }
    : {}),
}));

const flowInput = computed(() =>
  createFlowEngineInput(dashboardStats.value as DashboardStats | null, {
    hasResume: resumes.value.length > 0,
  }),
);

const { primaryAction: flowPrimaryAction, recommendedActions: flowRecommendedActions } =
  useFlowEngine(flowInput);

interface ResumeCompletionQuickAction {
  readonly id: string;
  readonly to: string | { path: string; query?: Record<string, string> };
  readonly labelKey: string;
}

const completionQuickActions = computed<readonly ResumeCompletionQuickAction[]>(() => {
  const actionCandidates = [flowPrimaryAction.value, ...flowRecommendedActions.value]
    .filter((action) => action.id !== "resume")
    .slice(0, 3);

  return actionCandidates.map((action) => ({
    id: action.id,
    to: action.id === "coverLetter" ? coverLetterQuickActionRoute.value : action.to,
    labelKey: action.labelKey,
  }));
});

function resumeTabLabel(tab: ResumeTabId): string {
  if (tab === "personal") return t("resumePage.tabs.personal");
  if (tab === "experience") return t("resumePage.tabs.experience");
  if (tab === "education") return t("resumePage.tabs.education");
  if (tab === "skills") return t("resumePage.tabs.skills");
  if (tab === "projects") return t("resumePage.tabs.projects");
  return t("resumePage.tabs.gaming");
}

function resumeTabAriaLabel(tab: ResumeTabId): string {
  return t("resumePage.tabs.selectAria", { tab: resumeTabLabel(tab) });
}

function resumeTabButtonId(tab: ResumeTabId): string {
  return `${resumeTabListId}-tab-${tab}`;
}

function resumeTabPanelId(tab: ResumeTabId): string {
  return `${resumeTabListId}-panel-${tab}`;
}

function setResumeTabRef(index: number, element: Element | null): void {
  resumeTabRefs.value[index] = element instanceof HTMLButtonElement ? element : null;
}

function focusResumeTab(index: number): void {
  resumeTabRefs.value[index]?.focus();
}

function selectResumeTab(tab: ResumeTabId): void {
  activeTab.value = tab;
}

function handleResumeTabKeydown(event: KeyboardEvent, index: number): void {
  const lastTabIndex = RESUME_TABS.length - 1;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    const nextIndex = index === lastTabIndex ? 0 : index + 1;
    const nextTab = RESUME_TABS[nextIndex];
    if (nextTab) selectResumeTab(nextTab);
    focusResumeTab(nextIndex);
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    const nextIndex = index === 0 ? lastTabIndex : index - 1;
    const nextTab = RESUME_TABS[nextIndex];
    if (nextTab) selectResumeTab(nextTab);
    focusResumeTab(nextIndex);
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    const firstTab = RESUME_TABS[0];
    if (firstTab) selectResumeTab(firstTab);
    focusResumeTab(0);
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    const lastTab = RESUME_TABS[lastTabIndex];
    if (lastTab) selectResumeTab(lastTab);
    focusResumeTab(lastTabIndex);
  }
}

function resumeTemplateLabel(template?: string): string {
  if (!template) {
    return templateLabelMap.value[RESUME_TEMPLATE_DEFAULT];
  }
  return templateLabelMap.value[template as ResumeTemplate] ?? template;
}

function clearResumeFilters() {
  resumeSearchQuery.value = "";
}

function resumePageAria(page: number): string {
  return t("resumePage.pagination.pageAria", { page });
}

const {
  error: resumeBootstrapError,
  status: resumeBootstrapStatus,
  refresh: refreshResumeBootstrap,
} = await useAsyncData("resume-page-bootstrap", async () => {
  await fetchResumes();
  await fetchDashboard();

  const id = route.query[APP_ROUTE_QUERY_KEYS.id];
  if (typeof id === "string" && id.trim()) {
    selectedResumeId.value = id.trim();
  }
  return true;
});

watch(selectedResumeId, async (id) => {
  if (id) {
    const resume = await getResume(id);
    if (resume) {
      const form = resumeDataToFormData(resume);
      Object.assign(formData, form);
    }
  }
});

onUnmounted(() => {
  if (aiEnhancementTimer) {
    clearInterval(aiEnhancementTimer);
    aiEnhancementTimer = null;
  }
});

function startAiEnhancementProgress() {
  aiEnhancementStepIndex.value = 0;
  if (aiEnhancementTimer) {
    clearInterval(aiEnhancementTimer);
  }
  aiEnhancementTimer = setInterval(() => {
    if (aiEnhancementStepIndex.value < aiEnhancementStepLabels.value.length - 1) {
      aiEnhancementStepIndex.value += 1;
    }
  }, 900);
}

function stopAiEnhancementProgress() {
  if (aiEnhancementTimer) {
    clearInterval(aiEnhancementTimer);
    aiEnhancementTimer = null;
  }
  aiEnhancementStepIndex.value = 0;
}

async function handleCreate() {
  if (!newResumeName.value.trim()) return;

  if (newResumeName.value.trim().length < 2) {
    $toast.error(t("resumePage.toasts.resumeNameMinLength"));
    return;
  }

  creating.value = true;
  const createResult = await settlePromise(
    createResume({
      name: newResumeName.value,
      template: newResumeTemplate.value,
      personalInfo: {},
      experience: [],
      education: [],
      skills: {},
      projects: [],
      gamingExperience: {},
    }),
    t("resumePage.toasts.resumeCreateFailed"),
  );
  creating.value = false;

  if (!createResult.ok) {
    $toast.error(getErrorMessage(createResult.error, t("resumePage.toasts.resumeCreateFailed")));
    return;
  }

  showCreateModal.value = false;
  newResumeName.value = "";
  selectedResumeId.value = createResult.value.id ?? null;
  $toast.success(t("resumePage.toasts.resumeCreated"));
}

async function handleSave() {
  if (!selectedResumeId.value) return;

  if (formData.name.trim().length < 2) {
    $toast.error(t("resumePage.toasts.nameMinLength"));
    return;
  }

  if (!emailPattern.test(formData.email.trim())) {
    $toast.error(t("resumePage.toasts.invalidEmail"));
    return;
  }

  if (formData.summary.trim().length < 50) {
    $toast.error(t("resumePage.toasts.summaryMinLength"));
    return;
  }

  const hasInvalidExperience = formData.experience.some(
    (item) =>
      item.title.trim().length < 2 ||
      item.company.trim().length < 2 ||
      item.description.trim().length < 20,
  );
  if (hasInvalidExperience) {
    $toast.error(t("resumePage.toasts.invalidExperience"));
    return;
  }

  const hasInvalidEducation = formData.education.some(
    (item) => item.degree.trim().length < 2 || item.school.trim().length < 2,
  );
  if (hasInvalidEducation) {
    $toast.error(t("resumePage.toasts.invalidEducation"));
    return;
  }

  const hasInvalidProjects = formData.projects.some(
    (item) => item.name.trim().length < 2 || item.description.trim().length < 20,
  );
  if (hasInvalidProjects) {
    $toast.error(t("resumePage.toasts.invalidProjects"));
    return;
  }

  const resumeId = selectedResumeId.value;
  if (!resumeId) return;

  const saveResult = await settlePromise(
    (async () => {
      const updates = formDataToResumeData(formData);
      await updateResume(resumeId, updates);
      return resolvePipelineReward("resumeSave");
    })(),
    t("resumePage.toasts.resumeSaveFailed"),
  );
  if (!saveResult.ok) {
    $toast.error(getErrorMessage(saveResult.error, t("resumePage.toasts.resumeSaveFailed")));
    return;
  }

  const reward = saveResult.value;
  $toast.success(
    reward
      ? t("resumePage.toasts.resumeSavedWithXp", { xp: reward })
      : t("resumePage.toasts.resumeSaved"),
  );
}

function requestDeleteResume(id: string) {
  pendingDeleteResumeId.value = id;
  showDeleteResumeDialog.value = true;
}

function clearDeleteResumeState() {
  pendingDeleteResumeId.value = null;
}

async function handleDeleteResume() {
  const id = pendingDeleteResumeId.value;
  if (!id) return;

  const deleteResult = await settlePromise(
    deleteResume(id),
    t("resumePage.toasts.resumeDeleteFailed"),
  );
  clearDeleteResumeState();
  showDeleteResumeDialog.value = false;

  if (!deleteResult.ok) {
    $toast.error(getErrorMessage(deleteResult.error, t("resumePage.toasts.resumeDeleteFailed")));
    return;
  }

  if (selectedResumeId.value === id) {
    selectedResumeId.value = null;
  }
  $toast.success(t("resumePage.toasts.resumeDeleted"));
}

async function handleExport() {
  if (!selectedResumeId.value) return;
  const exportResult = await settlePromise(
    exportResume(selectedResumeId.value),
    t("resumePage.toasts.resumeExportFailed"),
  );
  if (!exportResult.ok) {
    $toast.error(getErrorMessage(exportResult.error, t("resumePage.toasts.resumeExportFailed")));
    return;
  }
  $toast.success(t("resumePage.toasts.resumeExported"));
}

async function handleAIEnhance() {
  if (!selectedResumeId.value) return;

  enhancing.value = true;
  startAiEnhancementProgress();
  const enhanceResult = await settlePromise(
    aiEnhance(selectedResumeId.value),
    t("resumePage.toasts.resumeEnhanceFailed"),
  );
  stopAiEnhancementProgress();
  enhancing.value = false;

  if (!enhanceResult.ok) {
    $toast.error(getErrorMessage(enhanceResult.error, t("resumePage.toasts.resumeEnhanceFailed")));
    return;
  }

  const enhancedResume = enhanceResult.value;
  const form = resumeDataToFormData(enhancedResume);
  Object.assign(formData, form);
  const reward = await resolvePipelineReward("resumeEnhance");
  $toast.success(
    reward
      ? t("resumePage.toasts.resumeEnhancedWithXp", { xp: reward })
      : t("resumePage.toasts.resumeEnhanced"),
  );
}

async function handleAIScore() {
  if (!selectedResumeId.value) return;

  scoring.value = true;
  const scoreSubmission = await settlePromise(
    aiScore(selectedResumeId.value, ""),
    t("resumePage.toasts.resumeScoreFailed"),
  );
  scoring.value = false;

  if (!scoreSubmission.ok) {
    $toast.error(getErrorMessage(scoreSubmission.error, t("resumePage.toasts.resumeScoreFailed")));
    return;
  }

  scoreResult.value = scoreSubmission.value;
  $toast.success(t("resumePage.toasts.resumeScored"));
}

function addExperience() {
  formData.experience.push({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });
}

function removeExperience(index: number) {
  formData.experience.splice(index, 1);
}

function addEducation() {
  formData.education.push({
    degree: "",
    school: "",
    location: "",
    graduationDate: "",
    gpa: "",
  });
}

function removeEducation(index: number) {
  formData.education.splice(index, 1);
}

function addProject() {
  formData.projects.push({
    name: "",
    description: "",
    technologies: [] as string[],
    url: "",
  });
}

function removeProject(index: number) {
  formData.projects.splice(index, 1);
}

const newSkill = ref("");

function addSkill() {
  if (newSkill.value.trim()) {
    formData.skills.push(newSkill.value.trim());
    newSkill.value = "";
  }
}

function removeSkill(index: number) {
  formData.skills.splice(index, 1);
}

async function resolvePipelineReward(
  action: "resumeSave" | "resumeEnhance",
): Promise<number | null> {
  const rewardResult = await settlePromise(
    awardForAction(action),
    t("apiErrors.gamification.awardXPFailed"),
  );
  if (!rewardResult.ok) {
    // Resume save/enhance should succeed even when gamification is unavailable.
    return null;
  }
  return rewardResult.value.awarded ? rewardResult.value.amount : null;
}
</script>

<template>
  <PageScaffold>
    <section class="rounded-box border border-base-300 bg-base-200 p-6">
      <PageHeaderBlock
        title-id="resume-page-title"
        :title="t('resumePage.title')"
        :description="t('resumePage.subtitle')"
      >
        <template #actions>
          <button
            class="btn btn-primary btn-sm"
            :aria-label="t('resumePage.createButtonAria')"
            @click="showCreateModal = true"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ t("resumePage.createButton") }}
          </button>
          <NuxtLink :to="APP_ROUTES.resumeBuild" class="btn btn-outline btn-sm" :aria-label="t('resumePage.guidedButtonAria')">
            {{ t("resumePage.guidedButton") }}
          </NuxtLink>
        </template>
      </PageHeaderBlock>
    </section>

    <div
      v-if="resumeBootstrapError"
      class="alert alert-error sm:alert-horizontal"
      role="alert"
    >
      <svg class="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ getErrorMessage(resumeBootstrapError, t("resumePage.bootstrapError")) }}</span>
      <button
        type="button"
        class="btn btn-sm btn-ghost shrink-0"
        :aria-label="t('resumePage.bootstrapRetryAria')"
        @click="() => refreshResumeBootstrap()"
      >
        {{ t("resumePage.bootstrapRetry") }}
      </button>
    </div>

    <LoadingSkeleton
      v-else-if="resumeBootstrapStatus === 'pending' || (loading && !resumes.length)"
      variant="cards"
      :lines="6"
    />

    <div v-else-if="!selectedResumeId" class="space-y-6">
      <section v-if="resumes.length > 0" class="card card-border bg-base-100">
        <div class="card-body">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("resumePage.filters.searchLegend") }}</legend>
            <input
              v-model="resumeSearchQuery"
              type="search"
              class="input w-full"
              :placeholder="t('resumePage.filters.searchPlaceholder')"
              :aria-label="t('resumePage.filters.searchAria')"
            />
          </fieldset>

          <div v-if="hasResumeFiltersApplied" class="card-actions justify-end">
            <button
              class="btn btn-sm btn-ghost"
              :aria-label="t('resumePage.filters.clearAria')"
              @click="clearResumeFilters"
            >
              {{ t("resumePage.filters.clearButton") }}
            </button>
          </div>
        </div>
      </section>

      <div v-if="resumes.length === 0" class="alert alert-info alert-soft">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ t("resumePage.emptyState") }}</span>
      </div>

      <div v-else-if="filteredResumes.length === 0" class="alert alert-soft" role="status">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l2-2m0 0l2-2m-2 2l2 2m-2-2l-2 2m9 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ t("resumePage.filteredEmptyState") }}</span>
      </div>

      <div v-else class="space-y-4">
        <SectionGrid grid-token="threeColumnLg">
          <div
            v-for="resume in resumePagination.items.value"
            :key="resume.id"
            class="relative overflow-hidden transition-colors"
            :class="
              (resume.experience?.length ?? 0) > 0
                ? 'card card-border bg-base-100 hover:bg-base-200'
                : 'card card-dash bg-base-100 hover:bg-base-200'
            "
          >
            <button
              type="button"
              class="absolute inset-0 rounded-box focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              :aria-label="t('resumePage.editButtonAria', { name: resume.name })"
              @click="selectedResumeId = resume.id ?? null"
            />
            <div class="card-body relative z-10">
              <h3 class="card-title">{{ resume.name }}</h3>
              <div class="flex gap-2 mt-2">
                <span class="badge badge-sm">{{ resumeTemplateLabel(resume.template) }}</span>
                <span v-if="resume.isDefault" class="badge badge-primary badge-sm">{{ t("resumePage.defaultBadge") }}</span>
              </div>
              <div class="card-actions justify-end mt-4">
                <button
                  class="btn btn-sm btn-outline relative z-20"
                  :aria-label="t('resumePage.editButtonAria', { name: resume.name })"
                  @click.stop="selectedResumeId = resume.id ?? null"
                >
                  {{ t("resumePage.editButton") }}
                </button>
                <button
                  class="btn btn-sm btn-error btn-outline relative z-20"
                  :aria-label="t('resumePage.deleteButtonAria', { name: resume.name })"
                  @click.stop="resume.id ? requestDeleteResume(resume.id) : null"
                >
                  {{ t("resumePage.deleteButton") }}
                </button>
              </div>
            </div>
          </div>
        </SectionGrid>

        <AppPagination
          :current-page="resumePagination.currentPage.value"
          :total-pages="resumePagination.totalPages.value"
          :page-numbers="resumePagination.pageNumbers.value"
          :summary="resumePaginationSummary"
          :navigation-aria="t('resumePage.pagination.navigationAria')"
          :previous-aria="t('resumePage.pagination.previousAria')"
          :next-aria="t('resumePage.pagination.nextAria')"
          :page-aria="resumePageAria"
          @update:current-page="resumePagination.goToPage"
        />
      </div>
    </div>

    <!-- Resume Editor -->
    <div v-else class="space-y-6">
      <div class="flex items-center justify-between">
        <button
          class="btn btn-ghost btn-sm"
          :aria-label="t('resumePage.backButtonAria')"
          @click="selectedResumeId = null"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {{ t("resumePage.backButton") }}
        </button>

        <div class="flex gap-2">
          <button
            class="btn btn-sm btn-outline"
            :disabled="enhancing"
            :aria-label="t('resumePage.aiEnhanceButtonAria')"
            @click="handleAIEnhance"
          >
            <span v-if="enhancing" class="loading loading-spinner loading-xs"></span>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {{ t("resumePage.aiEnhanceButton") }}
          </button>
          <button
            class="btn btn-sm btn-outline"
            :disabled="scoring"
            :aria-label="t('resumePage.aiScoreButtonAria')"
            @click="handleAIScore"
          >
            <span v-if="scoring" class="loading loading-spinner loading-xs"></span>
            {{ t("resumePage.aiScoreButton") }}
          </button>
          <button class="btn btn-sm btn-outline" :aria-label="t('resumePage.exportButtonAria')" @click="handleExport">
            {{ t("resumePage.exportButton") }}
          </button>
          <button class="btn btn-sm btn-primary" :aria-label="t('resumePage.saveButtonAria')" @click="handleSave">
            {{ t("resumePage.saveButton") }}
          </button>
        </div>
      </div>

      <div class="card card-border bg-base-100">
        <div class="card-body py-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3 class="text-sm font-semibold">{{ t("resumePage.completion.title") }}</h3>
            <span class="badge badge-primary badge-outline">
              {{ t("resumePage.completion.percentLabel", { percent: completionPercent }) }}
            </span>
          </div>
          <progress
            class="progress progress-primary w-full"
            :value="completionPercent"
            max="100"
            :aria-label="t('resumePage.completion.progressAria')"
          ></progress>
          <p class="text-xs text-base-content/70">
            {{ t("resumePage.completion.summary", { completed: completedSectionCount, total: resumeSectionCompletion.length }) }}
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="section in resumeSectionCompletion"
              :key="section.id"
              class="badge badge-sm cursor-pointer"
              :class="section.completed ? 'badge-success' : 'badge-ghost'"
              :aria-label="t('resumePage.completion.jumpAria', { section: resumeTabLabel(section.id) })"
              @click="activeTab = section.id"
            >
              {{ resumeTabLabel(section.id) }}
            </button>
          </div>
          <div class="card-actions justify-between">
            <p class="text-xs text-base-content/70">
              {{
                nextRecommendedTab
                  ? t("resumePage.completion.nextStep", { section: resumeTabLabel(nextRecommendedTab) })
                  : t("resumePage.completion.complete")
              }}
            </p>
            <div class="flex flex-wrap gap-2">
              <NuxtLink
                v-for="action in completionQuickActions"
                :key="action.id"
                :to="action.to"
                class="btn btn-xs btn-outline"
                :aria-label="t(action.labelKey)"
              >
                {{ t(action.labelKey) }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <div v-if="enhancing" class="card card-border bg-base-100">
        <div class="card-body py-4">
          <h3 class="mb-2 text-sm font-semibold">{{ t("resumePage.aiEnhancementTitle") }}</h3>
          <ul class="steps steps-horizontal w-full">
            <li
              v-for="(stepLabel, index) in aiEnhancementStepLabels"
              :key="stepLabel"
              class="step"
              :class="{ 'step-primary': index <= aiEnhancementStepIndex }"
            >
              {{ stepLabel }}
            </li>
          </ul>
        </div>
      </div>

      <div class="tabs tabs-lift" role="tablist" :aria-label="t('resumePage.tabs.tablistAria')">
        <button
          v-for="(tab, index) in RESUME_TABS"
          :id="resumeTabButtonId(tab)"
          :key="tab"
          type="button"
          class="tab"
          role="tab"
          :class="{ 'tab-active': activeTab === tab }"
          :aria-selected="activeTab === tab"
          :aria-controls="resumeTabPanelId(tab)"
          :aria-label="resumeTabAriaLabel(tab)"
          :tabindex="activeTab === tab ? 0 : -1"
          :ref="(element) => setResumeTabRef(index, element as Element | null)"
          @click="selectResumeTab(tab)"
          @keydown="handleResumeTabKeydown($event, index)"
        >
          {{ resumeTabLabel(tab) }}
        </button>
      </div>

      <!-- Personal Info Tab -->
      <div
        v-show="activeTab === 'personal'"
        :id="resumeTabPanelId('personal')"
        class="card bg-base-200"
        role="tabpanel"
        :aria-labelledby="resumeTabButtonId('personal')"
        :aria-hidden="activeTab !== 'personal'"
      >
        <div class="card-body">
          <h2 class="card-title">{{ t("resumePage.personal.title") }}</h2>
          <SectionGrid grid-token="twoColumn">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.personal.fullNameLegend") }}</legend>
              <input
                v-model="formData.name"
                type="text"
                required
                minlength="2"
                class="input validator w-full"
                :aria-label="t('resumePage.personal.fullNameAria')"
              />
              <p class="validator-hint">{{ t("resumePage.personal.fullNameHint") }}</p>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.personal.emailLegend") }}</legend>
              <input
                v-model="formData.email"
                type="email"
                required
                class="input validator w-full"
                :aria-label="t('resumePage.personal.emailAria')"
              />
              <p class="validator-hint">{{ t("resumePage.personal.emailHint") }}</p>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.personal.phoneLegend") }}</legend>
              <input
                v-model="formData.phone"
                type="tel"
                pattern="^[+0-9()\\-\\s]{7,20}$"
                class="input validator w-full"
                :aria-label="t('resumePage.personal.phoneAria')"
              />
              <p class="validator-hint">{{ t("resumePage.personal.phoneHint") }}</p>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.personal.locationLegend") }}</legend>
              <input v-model="formData.location" type="text" class="input w-full" :aria-label="t('resumePage.personal.locationAria')"/>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.personal.linkedInLegend") }}</legend>
              <input v-model="formData.linkedIn" type="url" class="input w-full" :aria-label="t('resumePage.personal.linkedInAria')"/>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.personal.portfolioLegend") }}</legend>
              <input v-model="formData.portfolio" type="url" class="input w-full" :aria-label="t('resumePage.personal.portfolioAria')"/>
            </fieldset>
          </SectionGrid>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("resumePage.personal.summaryLegend") }}</legend>
            <textarea
              v-model="formData.summary"
              required
              minlength="50"
              class="textarea validator w-full"
              rows="4"
              :aria-label="t('resumePage.personal.summaryAria')"
            ></textarea>
            <p class="validator-hint">{{ t("resumePage.personal.summaryHint") }}</p>
          </fieldset>
        </div>
      </div>

      <!-- Experience Tab -->
      <div
        v-show="activeTab === 'experience'"
        :id="resumeTabPanelId('experience')"
        class="card bg-base-200"
        role="tabpanel"
        :aria-labelledby="resumeTabButtonId('experience')"
        :aria-hidden="activeTab !== 'experience'"
      >
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">{{ t("resumePage.experience.title") }}</h2>
            <button class="btn btn-sm btn-primary" :aria-label="t('resumePage.experience.addButtonAria')" @click="addExperience">
              {{ t("resumePage.experience.addButton") }}
            </button>
          </div>
          <div class="space-y-6">
            <div v-for="(exp, idx) in formData.experience" :key="idx" class="card bg-base-100">
              <div class="card-body">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold">{{ t("resumePage.experience.itemTitle", { index: idx + 1 }) }}</h3>
                  <button class="btn btn-error btn-xs" :aria-label="t('resumePage.experience.removeButtonAria', { index: idx + 1 })" @click="removeExperience(idx)">
                    {{ t("resumePage.experience.removeButton") }}
                  </button>
                </div>
                <SectionGrid grid-token="twoColumn">
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">{{ t("resumePage.experience.jobTitleLegend") }}</legend>
                    <input
                      v-model="exp.title"
                      type="text"
                      required
                      minlength="2"
                      class="input validator w-full input-sm"
                      :aria-label="t('resumePage.experience.jobTitleAria')"
                    />
                    <p class="validator-hint">{{ t("resumePage.experience.jobTitleHint") }}</p>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">{{ t("resumePage.experience.companyLegend") }}</legend>
                    <input
                      v-model="exp.company"
                      type="text"
                      required
                      minlength="2"
                      class="input validator w-full input-sm"
                      :aria-label="t('resumePage.experience.companyAria')"
                    />
                    <p class="validator-hint">{{ t("resumePage.experience.companyHint") }}</p>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">{{ t("resumePage.experience.locationLegend") }}</legend>
                    <input v-model="exp.location" type="text" class="input w-full input-sm" :aria-label="t('resumePage.experience.locationAria')"/>
                  </fieldset>
                  <div class="flex gap-2">
                    <fieldset class="fieldset flex-1">
                      <legend class="fieldset-legend">{{ t("resumePage.experience.startDateLegend") }}</legend>
                      <input v-model="exp.startDate" type="month" class="input w-full input-sm" :aria-label="t('resumePage.experience.startDateAria')"/>
                    </fieldset>
                    <fieldset class="fieldset flex-1">
                      <legend class="fieldset-legend">{{ t("resumePage.experience.endDateLegend") }}</legend>
                      <input v-model="exp.endDate" type="month" class="input w-full input-sm" :disabled="exp.current" :aria-label="t('resumePage.experience.endDateAria')"/>
                    </fieldset>
                  </div>
                </SectionGrid>
                <fieldset class="fieldset">
                  <label class="label cursor-pointer justify-start gap-2">
                    <input v-model="exp.current" type="checkbox" class="checkbox checkbox-sm" :aria-label="t('resumePage.experience.currentAria')"/>
                    <span class="label">{{ t("resumePage.experience.currentLabel") }}</span>
                  </label>
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">{{ t("resumePage.experience.descriptionLegend") }}</legend>
                  <textarea
                    v-model="exp.description"
                    required
                    minlength="20"
                    class="textarea validator w-full"
                    rows="3"
                    :aria-label="t('resumePage.experience.descriptionAria')"
                  ></textarea>
                  <p class="validator-hint">{{ t("resumePage.experience.descriptionHint") }}</p>
                </fieldset>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Education Tab -->
      <div
        v-show="activeTab === 'education'"
        :id="resumeTabPanelId('education')"
        class="card bg-base-200"
        role="tabpanel"
        :aria-labelledby="resumeTabButtonId('education')"
        :aria-hidden="activeTab !== 'education'"
      >
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">{{ t("resumePage.education.title") }}</h2>
            <button class="btn btn-sm btn-primary" :aria-label="t('resumePage.education.addButtonAria')" @click="addEducation">
              {{ t("resumePage.education.addButton") }}
            </button>
          </div>
          <div class="space-y-6">
            <div v-for="(edu, idx) in formData.education" :key="idx" class="card bg-base-100">
              <div class="card-body">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold">{{ t("resumePage.education.itemTitle", { index: idx + 1 }) }}</h3>
                  <button class="btn btn-error btn-xs" :aria-label="t('resumePage.education.removeButtonAria', { index: idx + 1 })" @click="removeEducation(idx)">
                    {{ t("resumePage.education.removeButton") }}
                  </button>
                </div>
                <SectionGrid grid-token="twoColumn">
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">{{ t("resumePage.education.degreeLegend") }}</legend>
                    <input
                      v-model="edu.degree"
                      type="text"
                      required
                      minlength="2"
                      class="input validator w-full input-sm"
                      :aria-label="t('resumePage.education.degreeAria')"
                    />
                    <p class="validator-hint">{{ t("resumePage.education.degreeHint") }}</p>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">{{ t("resumePage.education.schoolLegend") }}</legend>
                    <input
                      v-model="edu.school"
                      type="text"
                      required
                      minlength="2"
                      class="input validator w-full input-sm"
                      :aria-label="t('resumePage.education.schoolAria')"
                    />
                    <p class="validator-hint">{{ t("resumePage.education.schoolHint") }}</p>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">{{ t("resumePage.education.locationLegend") }}</legend>
                    <input v-model="edu.location" type="text" class="input w-full input-sm" :aria-label="t('resumePage.education.locationAria')"/>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">{{ t("resumePage.education.graduationDateLegend") }}</legend>
                    <input v-model="edu.graduationDate" type="month" class="input w-full input-sm" :aria-label="t('resumePage.education.graduationDateAria')"/>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">{{ t("resumePage.education.gpaLegend") }}</legend>
                    <input v-model="edu.gpa" type="text" class="input w-full input-sm" :aria-label="t('resumePage.education.gpaAria')"/>
                  </fieldset>
                </SectionGrid>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skills Tab -->
      <div
        v-show="activeTab === 'skills'"
        :id="resumeTabPanelId('skills')"
        class="card bg-base-200"
        role="tabpanel"
        :aria-labelledby="resumeTabButtonId('skills')"
        :aria-hidden="activeTab !== 'skills'"
      >
        <div class="card-body">
          <h2 class="card-title mb-4">{{ t("resumePage.skills.title") }}</h2>
          <div class="flex gap-2 mb-4">
            <input
              v-model="newSkill"
              type="text"
              :placeholder="t('resumePage.skills.inputPlaceholder')"
              class="input input-sm flex-1"
              @keyup.enter="addSkill"
              :aria-label="t('resumePage.skills.inputAria')"
            />
            <button class="btn btn-sm btn-primary" :aria-label="t('resumePage.skills.addButtonAria')" @click="addSkill">
              {{ t("resumePage.skills.addButton") }}
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(skill, idx) in formData.skills"
              :key="idx"
              class="badge badge-lg gap-2"
            >
              {{ skill }}
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-circle"
                :aria-label="t('resumePage.skills.removeButtonAria', { index: idx + 1 })"
                @click="removeSkill(idx)"
              >
                <CloseIcon class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Projects Tab -->
      <div
        v-show="activeTab === 'projects'"
        :id="resumeTabPanelId('projects')"
        class="card bg-base-200"
        role="tabpanel"
        :aria-labelledby="resumeTabButtonId('projects')"
        :aria-hidden="activeTab !== 'projects'"
      >
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">{{ t("resumePage.projects.title") }}</h2>
            <button class="btn btn-sm btn-primary" :aria-label="t('resumePage.projects.addButtonAria')" @click="addProject">
              {{ t("resumePage.projects.addButton") }}
            </button>
          </div>
          <div class="space-y-6">
            <div v-for="(project, idx) in formData.projects" :key="idx" class="card bg-base-100">
              <div class="card-body">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold">{{ t("resumePage.projects.itemTitle", { index: idx + 1 }) }}</h3>
                  <button class="btn btn-error btn-xs" :aria-label="t('resumePage.projects.removeButtonAria', { index: idx + 1 })" @click="removeProject(idx)">
                    {{ t("resumePage.projects.removeButton") }}
                  </button>
                </div>
                <SectionGrid grid-token="twoColumn">
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">{{ t("resumePage.projects.nameLegend") }}</legend>
                    <input
                      v-model="project.name"
                      type="text"
                      required
                      minlength="2"
                      class="input validator w-full input-sm"
                      :aria-label="t('resumePage.projects.nameAria')"
                    />
                    <p class="validator-hint">{{ t("resumePage.projects.nameHint") }}</p>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">{{ t("resumePage.projects.urlLegend") }}</legend>
                    <input v-model="project.url" type="url" class="input w-full input-sm" :aria-label="t('resumePage.projects.urlAria')"/>
                  </fieldset>
                </SectionGrid>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">{{ t("resumePage.projects.descriptionLegend") }}</legend>
                  <textarea
                    v-model="project.description"
                    required
                    minlength="20"
                    class="textarea validator w-full"
                    rows="3"
                    :aria-label="t('resumePage.projects.descriptionAria')"
                  ></textarea>
                  <p class="validator-hint">{{ t("resumePage.projects.descriptionHint") }}</p>
                </fieldset>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gaming Experience Tab -->
      <div
        v-show="activeTab === 'gaming'"
        :id="resumeTabPanelId('gaming')"
        class="card bg-base-200"
        role="tabpanel"
        :aria-labelledby="resumeTabButtonId('gaming')"
        :aria-hidden="activeTab !== 'gaming'"
      >
        <div class="card-body">
          <h2 class="card-title mb-4">{{ t("resumePage.gaming.title") }}</h2>
          <p class="text-sm text-base-content/70 mb-4">
            {{ t("resumePage.gaming.description") }}
          </p>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("resumePage.gaming.rolesLegend") }}</legend>
            <input
              v-model="formData.gaming.roles"
              type="text"
              :placeholder="t('resumePage.gaming.rolesPlaceholder')"
              class="input w-full"
              :aria-label="t('resumePage.gaming.rolesAria')"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("resumePage.gaming.genresLegend") }}</legend>
            <input
              v-model="formData.gaming.genres"
              type="text"
              :placeholder="t('resumePage.gaming.genresPlaceholder')"
              class="input w-full"
              :aria-label="t('resumePage.gaming.genresAria')"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("resumePage.gaming.achievementsLegend") }}</legend>
            <textarea
              v-model="formData.gaming.achievements"
              class="textarea w-full"
              rows="4"
              :placeholder="t('resumePage.gaming.achievementsPlaceholder')"
              :aria-label="t('resumePage.gaming.achievementsAria')"
            ></textarea>
          </fieldset>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <AppModalFrame
      v-model:open="showCreateModal"
      :title-id="RESUME_CREATE_DIALOG_TITLE_ID"
      size-token="compact"
      :close-aria-label="t('resumePage.createModal.closeBackdropAria')"
      :close-backdrop-label="t('resumePage.createModal.closeBackdropButton')"
    >
      <h3 :id="RESUME_CREATE_DIALOG_TITLE_ID" class="font-bold text-lg mb-4">
        {{ t("resumePage.createModal.title") }}
      </h3>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("resumePage.createModal.nameLegend") }}</legend>
        <input
          v-model="newResumeName"
          type="text"
          :placeholder="t('resumePage.createModal.namePlaceholder')"
          class="input w-full"
          :aria-label="t('resumePage.createModal.nameAria')"
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("resumePage.createModal.templateLegend") }}</legend>
        <select v-model="newResumeTemplate" class="select w-full" :aria-label="t('resumePage.createModal.templateAria')">
          <option
            v-for="templateOption in createResumeTemplateOptions"
            :key="templateOption.value"
            :value="templateOption.value"
          >
            {{ templateOption.label }}
          </option>
        </select>
      </fieldset>

      <div class="modal-action">
        <button
          class="btn btn-ghost"
          :aria-label="t('resumePage.createModal.cancelAria')"
          @click="showCreateModal = false"
        >
          {{ t("resumePage.createModal.cancelButton") }}
        </button>
        <button
          class="btn btn-primary"
          :disabled="creating || !newResumeName.trim()"
          :aria-label="t('resumePage.createModal.createAria')"
          @click="handleCreate"
        >
          <span v-if="creating" class="loading loading-spinner loading-xs"></span>
          {{ t("resumePage.createModal.createButton") }}
        </button>
      </div>
    </AppModalFrame>

    <ConfirmDialog
      id="resume-delete-dialog"
      v-model:open="showDeleteResumeDialog"
      :title="t('resumePage.deleteDialog.title')"
      :message="t('resumePage.deleteDialog.message')"
      :confirm-text="t('resumePage.deleteDialog.confirmButton')"
      :cancel-text="t('resumePage.deleteDialog.cancelButton')"
      variant="danger"
      focus-primary
      @confirm="handleDeleteResume"
      @cancel="clearDeleteResumeState"
    />
  </PageScaffold>
</template>
