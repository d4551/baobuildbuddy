<script setup lang="ts">
import {
  APP_ROUTES,
  PORTFOLIO_PROJECT_LIST_PAGE_SIZE,
  PORTFOLIO_PROJECT_DESCRIPTION_MIN_LENGTH,
  PORTFOLIO_PROJECT_TECH_PREVIEW_LIMIT,
  PORTFOLIO_PROJECT_TITLE_MIN_LENGTH,
  type PortfolioMetadata,
  type PortfolioProject,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});

const {
  portfolio,
  projects,
  loading,
  fetchPortfolio,
  updatePortfolio,
  reorderProjects,
  addProject,
  updateProject,
  deleteProject,
  exportPortfolio,
} = usePortfolio();
const { $toast } = useNuxtApp();
const { t } = useI18n();

type PortfolioProjectReadonlyView<T> = {
  [K in keyof T]: T[K] extends Array<infer U> ? readonly Readonly<U>[] : T[K];
};

type PortfolioProjectView = PortfolioProjectReadonlyView<PortfolioProject>;
type ProjectDirection = "up" | "down";

const showAddModal = ref(false);
const editingProject = ref<PortfolioProject | null>(null);
const projectDialogRef = ref<HTMLDialogElement | null>(null);
useFocusTrap(projectDialogRef, () => showAddModal.value);
const showDeleteProjectDialog = ref(false);
const pendingDeleteProjectId = ref<string | null>(null);
const searchQuery = ref("");
const reorderingProjectId = ref<string | null>(null);

const portfolioForm = reactive<PortfolioMetadata>({
  title: "",
  bio: "",
  email: "",
  website: "",
});

const projectForm = reactive<{
  title: string;
  description: string;
  technologies: string[];
  image: string;
  liveUrl: string;
  featured: boolean;
}>({
  title: "",
  description: "",
  technologies: [],
  image: "",
  liveUrl: "",
  featured: false,
});

const newTech = ref("");

const displayProjects = computed(() =>
  projects.value.map((project) => normalizePortfolioProject(project as PortfolioProjectView)),
);

const filteredProjects = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return displayProjects.value;

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
const projectPaginationSummary = computed(() =>
  t("portfolioPage.pagination.summary", {
    start: projectPagination.rangeStart.value,
    end: projectPagination.rangeEnd.value,
    total: projectPagination.totalItems.value,
  }),
);

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

const projectTechnologySuggestions = computed(() => {
  const suggestions = new Set<string>();
  for (const project of displayProjects.value) {
    for (const tech of project.technologies || []) {
      const trimmed = tech.trim();
      if (trimmed.length > 0) {
        suggestions.add(trimmed);
      }
    }
  }
  return [...suggestions].sort((a, b) => a.localeCompare(b));
});

const hasFiltersApplied = computed(() => searchQuery.value.trim().length > 0);

onMounted(async () => {
  await fetchPortfolio();
  if (portfolio.value?.metadata) {
    portfolioForm.title = portfolio.value.metadata.title || "";
    portfolioForm.bio = portfolio.value.metadata.bio || "";
    portfolioForm.email = portfolio.value.metadata.email || "";
    portfolioForm.website = portfolio.value.metadata.website || "";
  }
});

watch(showAddModal, (isOpen) => {
  const dialog = projectDialogRef.value;
  if (!dialog) return;

  if (isOpen && !dialog.open) {
    dialog.showModal();
  } else if (!isOpen && dialog.open) {
    dialog.close();
  }
});

function clearProjectForm() {
  projectForm.title = "";
  projectForm.description = "";
  projectForm.technologies = [];
  projectForm.image = "";
  projectForm.liveUrl = "";
  projectForm.featured = false;
  newTech.value = "";
}

async function handleSavePortfolio() {
  const savePortfolioResult = await settlePromise(
    updatePortfolio(portfolioForm),
    t("portfolioPage.toasts.saveFailed"),
  );
  if (!savePortfolioResult.ok) {
    $toast.error(getErrorMessage(savePortfolioResult.error, t("portfolioPage.toasts.saveFailed")));
    return;
  }
  $toast.success(t("portfolioPage.toasts.saved"));
}

function openAddModal() {
  editingProject.value = null;
  clearProjectForm();
  showAddModal.value = true;
}

function normalizePortfolioProject(
  project: PortfolioProject | PortfolioProjectView,
): PortfolioProject {
  return {
    ...project,
    technologies: [...(project.technologies || [])],
    links: project.links ? [...project.links] : undefined,
    media: project.media ? [...project.media] : undefined,
    tags: project.tags ? [...project.tags] : undefined,
    responsibilities: project.responsibilities ? [...project.responsibilities] : undefined,
    outcomes: project.outcomes ? [...project.outcomes] : undefined,
    platforms: project.platforms ? [...project.platforms] : undefined,
    engines: project.engines ? [...project.engines] : undefined,
  };
}

function openEditModal(project: PortfolioProject) {
  editingProject.value = project;
  projectForm.title = project.title;
  projectForm.description = project.description || "";
  projectForm.technologies = [...(project.technologies || [])];
  projectForm.image = project.image || "";
  projectForm.liveUrl = project.liveUrl || "";
  projectForm.featured = project.featured || false;
  newTech.value = "";
  showAddModal.value = true;
}

async function handleSaveProject() {
  if (projectForm.title.trim().length < PORTFOLIO_PROJECT_TITLE_MIN_LENGTH) {
    $toast.error(
      t("portfolioPage.toasts.projectTitleMinLength", {
        count: PORTFOLIO_PROJECT_TITLE_MIN_LENGTH,
      }),
    );
    return;
  }

  if (projectForm.description.trim().length < PORTFOLIO_PROJECT_DESCRIPTION_MIN_LENGTH) {
    $toast.error(
      t("portfolioPage.toasts.projectDescriptionMinLength", {
        count: PORTFOLIO_PROJECT_DESCRIPTION_MIN_LENGTH,
      }),
    );
    return;
  }

  const payload = {
    title: projectForm.title.trim(),
    description: projectForm.description.trim(),
    technologies: [...projectForm.technologies],
    featured: projectForm.featured,
    ...(projectForm.image.trim() ? { image: projectForm.image.trim() } : {}),
    ...(projectForm.liveUrl.trim() ? { liveUrl: projectForm.liveUrl.trim() } : {}),
  };

  if (editingProject.value && !editingProject.value.id) {
    $toast.error(t("portfolioPage.toasts.projectIdMissing"));
    return;
  }

  const saveProjectResult = await settlePromise(
    (async () => {
      if (editingProject.value?.id) {
        await updateProject(editingProject.value.id, payload);
        return "updated" as const;
      }

      await addProject(payload);
      return "added" as const;
    })(),
    t("portfolioPage.toasts.projectSaveFailed"),
  );

  if (!saveProjectResult.ok) {
    $toast.error(
      getErrorMessage(saveProjectResult.error, t("portfolioPage.toasts.projectSaveFailed")),
    );
    return;
  }

  showAddModal.value = false;
  clearProjectForm();
  $toast.success(
    saveProjectResult.value === "updated"
      ? t("portfolioPage.toasts.projectUpdated")
      : t("portfolioPage.toasts.projectAdded"),
  );
}

function requestDeleteProject(id?: string) {
  if (!id) {
    $toast.error(t("portfolioPage.toasts.projectIdMissing"));
    return;
  }

  pendingDeleteProjectId.value = id;
  showDeleteProjectDialog.value = true;
}

function clearDeleteProjectState() {
  pendingDeleteProjectId.value = null;
}

async function handleDeleteProject() {
  const id = pendingDeleteProjectId.value;
  if (!id) return;

  const deleteProjectResult = await settlePromise(
    deleteProject(id),
    t("portfolioPage.toasts.projectDeleteFailed"),
  );
  clearDeleteProjectState();
  showDeleteProjectDialog.value = false;

  if (!deleteProjectResult.ok) {
    $toast.error(
      getErrorMessage(deleteProjectResult.error, t("portfolioPage.toasts.projectDeleteFailed")),
    );
    return;
  }

  $toast.success(t("portfolioPage.toasts.projectDeleted"));
}

async function handleExport() {
  const exportResult = await settlePromise(
    exportPortfolio(),
    t("portfolioPage.toasts.exportFailed"),
  );
  if (!exportResult.ok) {
    $toast.error(getErrorMessage(exportResult.error, t("portfolioPage.toasts.exportFailed")));
    return;
  }
  $toast.success(t("portfolioPage.toasts.exported"));
}

function projectIndexById(projectId: string | undefined): number {
  if (!projectId) return -1;
  return projects.value.findIndex((project) => project.id === projectId);
}

function canMove(projectId: string | undefined, direction: ProjectDirection): boolean {
  const index = projectIndexById(projectId);
  if (index < 0) return false;
  if (direction === "up") return index > 0;
  return index < projects.value.length - 1;
}

async function reorderByIds(orderedIds: string[]) {
  if (orderedIds.length === 0) return;

  await reorderProjects(orderedIds);
}

async function moveProject(projectId: string | undefined, direction: ProjectDirection) {
  if (!projectId) return;

  const index = projectIndexById(projectId);
  if (index < 0) return;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= projects.value.length) return;

  const reordered = [...displayProjects.value];
  const [movedProject] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, movedProject);

  const orderedIds = reordered
    .map((project) => project.id)
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0);

  reorderingProjectId.value = projectId;
  const reorderResult = await settlePromise(
    reorderByIds(orderedIds),
    t("portfolioPage.toasts.reorderFailed"),
  );
  reorderingProjectId.value = null;

  if (!reorderResult.ok) {
    $toast.error(getErrorMessage(reorderResult.error, t("portfolioPage.toasts.reorderFailed")));
    return;
  }

  $toast.success(t("portfolioPage.toasts.reordered"));
}

function addTechnology() {
  const nextTechnology = newTech.value.trim();
  if (!nextTechnology) return;

  const alreadyExists = projectForm.technologies.some(
    (technology) => technology.toLowerCase() === nextTechnology.toLowerCase(),
  );

  if (alreadyExists) {
    $toast.error(t("portfolioPage.toasts.technologyDuplicate"));
    return;
  }

  projectForm.technologies.push(nextTechnology);
  newTech.value = "";
}

function removeTechnology(index: number) {
  projectForm.technologies.splice(index, 1);
}

function clearFilters() {
  searchQuery.value = "";
}

function projectPageAria(page: number): string {
  return t("portfolioPage.pagination.pageAria", { page });
}
</script>

<template>
  <div class="mx-auto w-full max-w-7xl space-y-6">
    <section class="rounded-box border border-base-300 bg-base-200 p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold">{{ t("portfolioPage.title") }}</h1>
          <p class="max-w-2xl text-sm text-base-content/70">{{ t("portfolioPage.subtitle") }}</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <NuxtLink
            :to="APP_ROUTES.portfolioPreview"
            class="btn btn-outline"
            :aria-label="t('portfolioPage.actions.previewAria')"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {{ t("portfolioPage.actions.previewButton") }}
          </NuxtLink>

          <button
            class="btn btn-primary"
            :aria-label="t('portfolioPage.actions.exportAria')"
            @click="handleExport"
          >
            {{ t("portfolioPage.actions.exportButton") }}
          </button>
        </div>
      </div>

      <div class="stats stats-vertical mt-4 w-full border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal">
        <div class="stat">
          <div class="stat-title">{{ t("portfolioPage.stats.projectsTitle") }}</div>
          <div class="stat-value text-primary">{{ projects.length }}</div>
          <div class="stat-desc">{{ t("portfolioPage.stats.projectsDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("portfolioPage.stats.featuredTitle") }}</div>
          <div class="stat-value text-secondary">{{ featuredProjectCount }}</div>
          <div class="stat-desc">{{ t("portfolioPage.stats.featuredDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("portfolioPage.stats.profileTitle") }}</div>
          <div class="stat-value">{{ hasMetadata ? t("portfolioPage.stats.profileReady") : t("portfolioPage.stats.profileMissing") }}</div>
          <div class="stat-desc">{{ t("portfolioPage.stats.profileDesc") }}</div>
        </div>
      </div>
    </section>

    <section class="card card-border bg-base-100">
      <div class="card-body">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <fieldset class="fieldset lg:col-span-2">
            <legend class="fieldset-legend">{{ t("portfolioPage.filters.searchLegend") }}</legend>
            <input
              v-model="searchQuery"
              type="search"
              class="input w-full"
              :placeholder="t('portfolioPage.filters.searchPlaceholder')"
              :aria-label="t('portfolioPage.filters.searchAria')"
            />
          </fieldset>
        </div>

        <div v-if="hasFiltersApplied" class="card-actions justify-end">
          <button class="btn btn-sm btn-ghost" :aria-label="t('portfolioPage.filters.clearAria')" @click="clearFilters">
            {{ t("portfolioPage.filters.clearButton") }}
          </button>
        </div>
      </div>
    </section>

    <LoadingSkeleton v-if="loading && !portfolio" :lines="8" />

    <div v-else class="space-y-6">
      <section class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">{{ t("portfolioPage.profile.title") }}</h2>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("portfolioPage.profile.titleLegend") }}</legend>
              <input
                v-model="portfolioForm.title"
                type="text"
                class="input w-full"
                :placeholder="t('portfolioPage.profile.titlePlaceholder')"
                :aria-label="t('portfolioPage.profile.titleAria')"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("portfolioPage.profile.emailLegend") }}</legend>
              <input
                v-model="portfolioForm.email"
                type="email"
                class="input w-full"
                :placeholder="t('portfolioPage.profile.emailPlaceholder')"
                :aria-label="t('portfolioPage.profile.emailAria')"
              />
            </fieldset>

            <fieldset class="fieldset md:col-span-2">
              <legend class="fieldset-legend">{{ t("portfolioPage.profile.websiteLegend") }}</legend>
              <input
                v-model="portfolioForm.website"
                type="url"
                class="input w-full"
                :placeholder="t('portfolioPage.profile.websitePlaceholder')"
                :aria-label="t('portfolioPage.profile.websiteAria')"
              />
            </fieldset>

            <fieldset class="fieldset md:col-span-2">
              <legend class="fieldset-legend">{{ t("portfolioPage.profile.bioLegend") }}</legend>
              <textarea
                v-model="portfolioForm.bio"
                class="textarea w-full"
                rows="4"
                :placeholder="t('portfolioPage.profile.bioPlaceholder')"
                :aria-label="t('portfolioPage.profile.bioAria')"
              ></textarea>
            </fieldset>
          </div>

          <div class="card-actions justify-end">
            <button class="btn btn-primary" :aria-label="t('portfolioPage.profile.saveAria')" @click="handleSavePortfolio">
              {{ t("portfolioPage.profile.saveButton") }}
            </button>
          </div>
        </div>
      </section>

      <section class="card bg-base-200">
        <div class="card-body">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 class="card-title">{{ t("portfolioPage.projects.title") }}</h2>
            <button class="btn btn-primary" :aria-label="t('portfolioPage.projects.addAria')" @click="openAddModal">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ t("portfolioPage.projects.addButton") }}
            </button>
          </div>

          <div v-if="projects.length === 0" class="alert alert-soft" role="status">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ t("portfolioPage.projects.emptyState") }}</span>
          </div>

          <div v-else-if="filteredProjects.length === 0" class="alert alert-soft" role="status">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l2-2m0 0l2-2m-2 2l2 2m-2-2l-2 2m9 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ t("portfolioPage.projects.filteredEmptyState") }}</span>
          </div>

          <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(project, idx) in projectPagination.items"
              :key="project.id || `${project.title}-${idx}`"
              class="card bg-base-100"
            >
              <figure v-if="project.image" class="h-48">
                <NuxtImg
                  :src="project.image"
                  :alt="project.title"
                  class="h-full w-full object-cover"
                  sizes="sm:100vw md:50vw lg:33vw"
                  format="webp"
                />
              </figure>

              <div class="card-body">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="card-title text-base">{{ project.title }}</h3>
                  <svg class="h-5 w-5 shrink-0 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                  </svg>
                </div>

                <p class="line-clamp-3 text-sm text-base-content/70">{{ project.description }}</p>

                <div v-if="project.technologies?.length" class="mt-2 flex flex-wrap gap-1">
                  <span
                    v-for="tech in project.technologies.slice(0, PORTFOLIO_PROJECT_TECH_PREVIEW_LIMIT)"
                    :key="tech"
                    class="badge badge-xs"
                  >
                    {{ tech }}
                  </span>
                  <span
                    v-if="project.technologies.length > PORTFOLIO_PROJECT_TECH_PREVIEW_LIMIT"
                    class="badge badge-xs"
                  >
                    +{{ project.technologies.length - PORTFOLIO_PROJECT_TECH_PREVIEW_LIMIT }}
                  </span>
                </div>

                <div class="mt-2 flex items-center gap-2">
                  <span v-if="project.featured" class="badge badge-primary badge-xs">
                    {{ t("portfolioPage.projects.featuredBadge") }}
                  </span>
                  <a
                    v-if="project.liveUrl"
                    :href="project.liveUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link link-primary text-xs"
                    :aria-label="t('portfolioPage.projects.openProjectAria', { title: project.title })"
                  >
                    {{ t("portfolioPage.projects.openProjectButton") }}
                  </a>
                </div>

                <div class="card-actions mt-4 justify-between">
                  <div class="join">
                    <button
                      class="btn join-item btn-xs"
                      :disabled="!canMove(project.id, 'up') || reorderingProjectId === project.id"
                      :aria-label="t('portfolioPage.projects.moveUpAria', { title: project.title })"
                      @click="moveProject(project.id, 'up')"
                    >
                      {{ t("portfolioPage.projects.moveUpButton") }}
                    </button>
                    <button
                      class="btn join-item btn-xs"
                      :disabled="!canMove(project.id, 'down') || reorderingProjectId === project.id"
                      :aria-label="t('portfolioPage.projects.moveDownAria', { title: project.title })"
                      @click="moveProject(project.id, 'down')"
                    >
                      {{ t("portfolioPage.projects.moveDownButton") }}
                    </button>
                  </div>

                  <div class="flex gap-2">
                    <button
                      class="btn btn-xs btn-outline"
                      :aria-label="t('portfolioPage.projects.editAria', { title: project.title })"
                      @click="openEditModal(project)"
                    >
                      {{ t("portfolioPage.projects.editButton") }}
                    </button>
                    <button
                      class="btn btn-xs btn-error btn-outline"
                      :aria-label="t('portfolioPage.projects.deleteAria', { title: project.title })"
                      @click="requestDeleteProject(project.id)"
                    >
                      {{ t("portfolioPage.projects.deleteButton") }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AppPagination
            :current-page="projectPagination.currentPage"
            :total-pages="projectPagination.totalPages"
            :page-numbers="projectPagination.pageNumbers"
            :summary="projectPaginationSummary"
            :navigation-aria="t('portfolioPage.pagination.navigationAria')"
            :previous-aria="t('portfolioPage.pagination.previousAria')"
            :next-aria="t('portfolioPage.pagination.nextAria')"
            :page-aria="projectPageAria"
            @update:current-page="projectPagination.goToPage"
          />
        </div>
      </section>
    </div>

    <dialog ref="projectDialogRef" class="modal modal-bottom sm:modal-middle" @close="showAddModal = false">
      <div class="modal-box max-w-2xl">
        <h3 class="mb-4 text-lg font-bold">
          {{ editingProject ? t("portfolioPage.modal.editTitle") : t("portfolioPage.modal.addTitle") }}
        </h3>

        <div class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("portfolioPage.modal.projectTitleLegend") }}</legend>
            <input
              v-model="projectForm.title"
              type="text"
              :minlength="PORTFOLIO_PROJECT_TITLE_MIN_LENGTH"
              class="input validator w-full"
              :placeholder="t('portfolioPage.modal.projectTitlePlaceholder')"
              :aria-label="t('portfolioPage.modal.projectTitleAria')"
            />
            <p class="validator-hint">
              {{ t("portfolioPage.modal.projectTitleHint", { count: PORTFOLIO_PROJECT_TITLE_MIN_LENGTH }) }}
            </p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("portfolioPage.modal.descriptionLegend") }}</legend>
            <textarea
              v-model="projectForm.description"
              :minlength="PORTFOLIO_PROJECT_DESCRIPTION_MIN_LENGTH"
              class="textarea validator w-full"
              rows="4"
              :placeholder="t('portfolioPage.modal.descriptionPlaceholder')"
              :aria-label="t('portfolioPage.modal.descriptionAria')"
            ></textarea>
            <p class="validator-hint">
              {{ t("portfolioPage.modal.descriptionHint", { count: PORTFOLIO_PROJECT_DESCRIPTION_MIN_LENGTH }) }}
            </p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("portfolioPage.modal.projectUrlLegend") }}</legend>
            <input
              v-model="projectForm.liveUrl"
              type="url"
              class="input w-full"
              :placeholder="t('portfolioPage.modal.projectUrlPlaceholder')"
              :aria-label="t('portfolioPage.modal.projectUrlAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("portfolioPage.modal.imageUrlLegend") }}</legend>
            <input
              v-model="projectForm.image"
              type="url"
              class="input w-full"
              :placeholder="t('portfolioPage.modal.imageUrlPlaceholder')"
              :aria-label="t('portfolioPage.modal.imageUrlAria')"
            />
          </fieldset>

          <div>
            <span class="mb-2 block text-sm font-medium">{{ t("portfolioPage.modal.technologiesLegend") }}</span>
            <div class="mb-2 flex gap-2">
              <input
                v-model="newTech"
                type="text"
                class="input input-sm flex-1"
                :placeholder="t('portfolioPage.modal.technologiesPlaceholder')"
                :aria-label="t('portfolioPage.modal.technologiesAria')"
                list="portfolio-tech-suggestions"
                @keyup.enter="addTechnology"
              />
              <button class="btn btn-sm btn-primary" :aria-label="t('portfolioPage.modal.addTechnologyAria')" @click="addTechnology">
                {{ t("portfolioPage.modal.addTechnologyButton") }}
              </button>
            </div>

            <datalist id="portfolio-tech-suggestions">
              <option v-for="tech in projectTechnologySuggestions" :key="tech" :value="tech" />
            </datalist>

            <div class="flex flex-wrap gap-2">
              <div
                v-for="(tech, idx) in projectForm.technologies"
                :key="`${tech}-${idx}`"
                class="badge gap-2"
              >
                {{ tech }}
                <button
                  class="btn btn-ghost btn-xs btn-circle"
                  :aria-label="t('portfolioPage.modal.removeTechnologyAria', { tech })"
                  @click="removeTechnology(idx)"
                >
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <label class="label cursor-pointer justify-start gap-2">
            <input
              v-model="projectForm.featured"
              type="checkbox"
              class="checkbox checkbox-primary"
              :aria-label="t('portfolioPage.modal.featuredAria')"
            />
            <span class="label-text">{{ t("portfolioPage.modal.featuredLabel") }}</span>
          </label>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" :aria-label="t('portfolioPage.modal.cancelAria')" @click="showAddModal = false">
            {{ t("portfolioPage.modal.cancelButton") }}
          </button>
          <button
            class="btn btn-primary"
            :disabled="!projectForm.title || !projectForm.description"
            :aria-label="t('portfolioPage.modal.saveAria')"
            @click="handleSaveProject"
          >
            {{ editingProject ? t("portfolioPage.modal.updateButton") : t("portfolioPage.modal.createButton") }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button :aria-label="t('portfolioPage.modal.closeBackdropAria')" @click="showAddModal = false">
          {{ t("portfolioPage.modal.closeBackdropButton") }}
        </button>
      </form>
    </dialog>

    <ConfirmDialog
      id="portfolio-delete-project-dialog"
      v-model:open="showDeleteProjectDialog"
      :title="t('portfolioPage.deleteDialog.title')"
      :message="t('portfolioPage.deleteDialog.message')"
      :confirm-text="t('portfolioPage.deleteDialog.confirmButton')"
      :cancel-text="t('portfolioPage.deleteDialog.cancelButton')"
      variant="danger"
      focus-primary
      @confirm="handleDeleteProject"
      @cancel="clearDeleteProjectState"
    />
  </div>
</template>
