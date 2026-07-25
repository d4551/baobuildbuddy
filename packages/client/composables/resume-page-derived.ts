import {
  RESUME_LIST_PAGE_SIZE,
  RESUME_TEMPLATE_DEFAULT,
  RESUME_TEMPLATE_OPTIONS,
} from "@bao/shared/constants/resume";
import { APP_ROUTE_QUERY_KEYS, APP_ROUTES } from "@bao/shared/constants/routes";
import type { ResumeFormData } from "@bao/shared/utils/resume-transform";
import type { Ref } from "vue";
import type { Composer, ComposerTranslation } from "vue-i18n";
import {
  RESUME_TABS,
  type ResumeCompletionQuickAction,
  type ResumeTabId,
} from "~/components/resume/resume-page-contracts";
import {
  cloneDashboardStats,
  type DashboardStatsView,
  hasNonEmptyGamingValue,
} from "~/composables/resume-page-bootstrap";
import { createFlowEngineInput } from "~/constants/flow-engine";
import { PERCENT_MAX, UI_CHIP_OVERFLOW_THRESHOLD } from "~/constants/numeric-ui";

type ResumePageDerivedInput = {
  dashboardStats: Ref<DashboardStatsView | null>;
  formData: ResumeFormData;
  resumeSearchQuery: Ref<string>;
  resumes: Ref<
    readonly {
      readonly id?: string;
      readonly name?: string;
      readonly template?: string;
      readonly isDefault?: boolean;
    }[]
  >;
  selectedResumeId: Ref<string | null>;
};

function useResumeTemplateOptions(i18n: Composer) {
  const templateLabelMap = computed<Record<string, string>>(() =>
    RESUME_TEMPLATE_OPTIONS.reduce<Record<string, string>>((labels, template) => {
      labels[template] = i18n.t(`resumePage.createModal.templates.${template}`);
      return labels;
    }, {}),
  );

  return {
    createResumeTemplateOptions: computed(() =>
      RESUME_TEMPLATE_OPTIONS.map((template) => ({
        value: template,
        label: templateLabelMap.value[template] ?? template,
      })),
    ),
    templateLabelMap,
  };
}

function useResumeCompletionState(formData: ResumeFormData) {
  const resumeSectionCompletion = computed(() => {
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

  return {
    completedSectionCount,
    completionPercent: computed(() => {
      const total = resumeSectionCompletion.value.length;
      if (total === 0) {
        return 0;
      }
      return Math.round((completedSectionCount.value / total) * PERCENT_MAX);
    }),
    nextRecommendedTab: computed<ResumeTabId | null>(() => {
      const incomplete = resumeSectionCompletion.value.find((section) => !section.completed);
      return incomplete ? incomplete.id : null;
    }),
    resumeSectionCompletion,
  };
}

function useResumeSearch(
  resumes: ResumePageDerivedInput["resumes"],
  resumeSearchQuery: ResumePageDerivedInput["resumeSearchQuery"],
  t: ComposerTranslation,
) {
  const filteredResumes = computed(() => {
    const query = resumeSearchQuery.value.trim().toLowerCase();
    if (!query) {
      return resumes.value;
    }

    return resumes.value.filter((resume) => {
      const name = (resume.name || "").toLowerCase();
      const template = (resume.template || "").toLowerCase();
      return name.includes(query) || template.includes(query);
    });
  });
  const resumePagination = usePagination(filteredResumes, RESUME_LIST_PAGE_SIZE, [
    resumeSearchQuery,
  ]);

  return {
    filteredResumes,
    hasResumeFiltersApplied: computed(() => resumeSearchQuery.value.trim().length > 0),
    resumePageAria(page: number): string {
      return t("resumePage.pagination.pageAria", { page });
    },
    resumePagination,
    resumePaginationSummary: computed(() =>
      t("resumePage.pagination.summary", {
        start: resumePagination.rangeStart.value,
        end: resumePagination.rangeEnd.value,
        total: resumePagination.totalItems.value,
      }),
    ),
  };
}

function useResumeCompletionQuickActions(
  dashboardStats: ResumePageDerivedInput["dashboardStats"],
  resumes: ResumePageDerivedInput["resumes"],
  selectedResumeId: ResumePageDerivedInput["selectedResumeId"],
) {
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
    createFlowEngineInput(cloneDashboardStats(dashboardStats.value), {
      hasResume: resumes.value.length > 0,
    }),
  );
  const { primaryAction: flowPrimaryAction, recommendedActions: flowRecommendedActions } =
    useFlowEngine(flowInput);

  return computed<readonly ResumeCompletionQuickAction[]>(() => {
    const actionCandidates = [flowPrimaryAction.value, ...flowRecommendedActions.value]
      .filter((action) => action.id !== "resume")
      .slice(0, UI_CHIP_OVERFLOW_THRESHOLD);

    return actionCandidates.map((action) => ({
      id: action.id,
      to: action.id === "coverLetter" ? coverLetterQuickActionRoute.value : action.to,
      labelKey: action.labelKey,
    }));
  });
}

function createResumeTabLabels(t: ComposerTranslation) {
  function tabLabel(tab: ResumeTabId): string {
    if (tab === "personal") return t("resumePage.tabs.personal");
    if (tab === "experience") return t("resumePage.tabs.experience");
    if (tab === "education") return t("resumePage.tabs.education");
    if (tab === "skills") return t("resumePage.tabs.skills");
    if (tab === "projects") return t("resumePage.tabs.projects");
    return t("resumePage.tabs.gaming");
  }

  return {
    resumeTabAriaLabel(tab: ResumeTabId): string {
      return t("resumePage.tabs.selectAria", { tab: tabLabel(tab) });
    },
    resumeTabLabel(tab: ResumeTabId): string {
      return tabLabel(tab);
    },
  };
}

export function useResumePageDerived(
  input: ResumePageDerivedInput,
  i18n: Composer,
  t: ComposerTranslation,
) {
  const templates = useResumeTemplateOptions(i18n);
  const labels = createResumeTabLabels(t);

  const aiEnhancementStepLabels = computed(
    () =>
      [
        t("resumePage.aiSteps.analyzing"),
        t("resumePage.aiSteps.enhancing"),
        t("resumePage.aiSteps.finalizing"),
      ] as const,
  );

  const completion = useResumeCompletionState(input.formData);
  const search = useResumeSearch(input.resumes, input.resumeSearchQuery, t);
  const completionQuickActions = useResumeCompletionQuickActions(
    input.dashboardStats,
    input.resumes,
    input.selectedResumeId,
  );

  function resumeTemplateLabel(template?: string): string {
    if (!template) {
      return templates.templateLabelMap.value[RESUME_TEMPLATE_DEFAULT] ?? RESUME_TEMPLATE_DEFAULT;
    }
    return RESUME_TEMPLATE_OPTIONS.some((option) => option === template)
      ? (templates.templateLabelMap.value[template] ?? template)
      : template;
  }

  return {
    aiEnhancementStepLabels,
    completedSectionCount: completion.completedSectionCount,
    completionPercent: completion.completionPercent,
    completionQuickActions,
    createResumeTemplateOptions: templates.createResumeTemplateOptions,
    filteredResumes: search.filteredResumes,
    hasResumeFiltersApplied: search.hasResumeFiltersApplied,
    nextRecommendedTab: completion.nextRecommendedTab,
    resumePageAria: (page: number) => search.resumePageAria(page),
    resumePagination: search.resumePagination,
    resumePaginationSummary: search.resumePaginationSummary,
    resumeSectionCompletion: completion.resumeSectionCompletion,
    resumeTabAriaLabel: (tab: ResumeTabId) => labels.resumeTabAriaLabel(tab),
    resumeTabLabel: (tab: ResumeTabId) => labels.resumeTabLabel(tab),
    resumeTemplateLabel,
  };
}
