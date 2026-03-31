import type { PortfolioMetadata } from "@bao/shared";
import type { ComposerTranslation } from "vue-i18n";
import type { ComputedRef, Ref } from "vue";
import { PORTFOLIO_PROJECT_LIST_PAGE_SIZE } from "@bao/shared";
import {
  normalizePortfolioProject,
  type PortfolioProjectView,
} from "~/composables/portfolio-page-state";

type PortfolioPageDerivedInput = {
  portfolioForm: PortfolioMetadata;
  projects: Ref<readonly PortfolioProjectView[]>;
  searchQuery: Ref<string>;
};

function usePortfolioProjectSearch(
  projects: Ref<readonly PortfolioProjectView[]>,
  searchQuery: Ref<string>,
  t: ComposerTranslation,
) {
  const displayProjects = computed(() =>
    projects.value.map((project) => normalizePortfolioProject(project)),
  );
  const filteredProjects = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) {
      return displayProjects.value;
    }

    return displayProjects.value.filter((project) => {
      const title = project.title.toLowerCase();
      const description = (project.description || "").toLowerCase();
      const technologies = (project.technologies || []).join(" ").toLowerCase();
      return title.includes(query) || description.includes(query) || technologies.includes(query);
    });
  });
  const projectPagination = usePagination(filteredProjects, PORTFOLIO_PROJECT_LIST_PAGE_SIZE, [
    searchQuery,
  ]);

  return {
    displayProjects,
    filteredProjects,
    hasFiltersApplied: computed(() => searchQuery.value.trim().length > 0),
    projectPageAria(page: number): string {
      return t("portfolioPage.pagination.pageAria", { page });
    },
    projectPagination,
    projectPaginationSummary: computed(() =>
      t("portfolioPage.pagination.summary", {
        start: projectPagination.rangeStart.value,
        end: projectPagination.rangeEnd.value,
        total: projectPagination.totalItems.value,
      }),
    ),
  };
}

function usePortfolioProjectTechnologySuggestions(
  displayProjects: ComputedRef<readonly ReturnType<typeof normalizePortfolioProject>[]>,
) {
  return computed(() => {
    const suggestions = new Set<string>();
    for (const project of displayProjects.value) {
      for (const technology of project.technologies || []) {
        const trimmed = technology.trim();
        if (trimmed.length > 0) {
          suggestions.add(trimmed);
        }
      }
    }

    return [...suggestions].sort((left, right) => left.localeCompare(right));
  });
}

export function usePortfolioPageDerived(
  { portfolioForm, projects, searchQuery }: PortfolioPageDerivedInput,
  t: ComposerTranslation,
) {
  const search = usePortfolioProjectSearch(projects, searchQuery, t);

  const featuredProjectCount = computed(
    () => projects.value.filter((project) => project.featured).length,
  );

  const hasMetadata = computed(
    () =>
      Boolean(portfolioForm.title?.trim()) ||
      Boolean(portfolioForm.bio?.trim()) ||
      Boolean(portfolioForm.email?.trim()) ||
      Boolean(portfolioForm.website?.trim()),
  );
  const projectTechnologySuggestions = usePortfolioProjectTechnologySuggestions(
    search.displayProjects,
  );

  return {
    displayProjects: search.displayProjects,
    featuredProjectCount,
    filteredProjects: search.filteredProjects,
    hasFiltersApplied: search.hasFiltersApplied,
    hasMetadata,
    projectPageAria: (page: number) => search.projectPageAria(page),
    projectPagination: search.projectPagination,
    projectPaginationSummary: search.projectPaginationSummary,
    projectTechnologySuggestions,
  };
}
