<script setup lang="ts">
import type { PortfolioProject } from "@bao/shared";
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
  addProject,
  updateProject,
  deleteProject,
  exportPortfolio,
} = usePortfolio();
const router = useRouter();
const { $toast } = useNuxtApp();

const showAddModal = ref(false);
const editingProject = ref<PortfolioProject | null>(null);
const draggedIndex = ref<number | null>(null);
const projectDialogRef = ref<HTMLDialogElement | null>(null);

const portfolioForm = reactive({
  title: "",
  bio: "",
  email: "",
  website: "",
});

const projectForm = reactive({
  name: "",
  description: "",
  technologies: [] as string[],
  imageUrl: "",
  projectUrl: "",
  featured: false,
});

onMounted(async () => {
  await fetchPortfolio();
  if (portfolio.value) {
    portfolioForm.title = portfolio.value.title || "";
    portfolioForm.bio = portfolio.value.bio || "";
    portfolioForm.email = portfolio.value.email || "";
    portfolioForm.website = portfolio.value.website || "";
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

async function handleSavePortfolio() {
  try {
    await updatePortfolio(portfolioForm);
    $toast.success("Portfolio saved");
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to save portfolio"));
  }
}

function openAddModal() {
  editingProject.value = null;
  projectForm.name = "";
  projectForm.description = "";
  projectForm.technologies = [];
  projectForm.imageUrl = "";
  projectForm.projectUrl = "";
  projectForm.featured = false;
  showAddModal.value = true;
}

function openEditModal(project: PortfolioProject) {
  editingProject.value = project;
  projectForm.name = project.name || "";
  projectForm.description = project.description || "";
  projectForm.technologies = project.technologies || [];
  projectForm.imageUrl = project.imageUrl || "";
  projectForm.projectUrl = project.projectUrl || "";
  projectForm.featured = project.featured || false;
  showAddModal.value = true;
}

async function handleSaveProject() {
  if (projectForm.name.trim().length < 2) {
    $toast.error("Project title must be at least 2 characters");
    return;
  }

  try {
    if (editingProject.value) {
      await updateProject(editingProject.value.id, projectForm);
      $toast.success("Project updated");
    } else {
      await addProject(projectForm);
      $toast.success("Project added");
    }
    showAddModal.value = false;
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to save project"));
  }
}

async function handleDeleteProject(id: string) {
  if (confirm("Are you sure you want to delete this project?")) {
    try {
      await deleteProject(id);
      $toast.success("Project deleted");
    } catch (error: unknown) {
      $toast.error(getErrorMessage(error, "Failed to delete project"));
    }
  }
}

async function handleExport() {
  try {
    await exportPortfolio();
    $toast.success("Portfolio exported");
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to export portfolio"));
  }
}

function handleDragStart(index: number) {
  draggedIndex.value = index;
}

function handleDrop(targetIndex: number) {
  if (draggedIndex.value === null) return;

  const newProjects = [...projects.value];
  const [removed] = newProjects.splice(draggedIndex.value, 1);
  newProjects.splice(targetIndex, 0, removed);

  updatePortfolio({ projects: newProjects });
  draggedIndex.value = null;
}

const newTech = ref("");

function addTechnology() {
  if (newTech.value.trim()) {
    projectForm.technologies.push(newTech.value.trim());
    newTech.value = "";
  }
}

function removeTechnology(index: number) {
  projectForm.technologies.splice(index, 1);
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Portfolio Builder</h1>
      <div class="flex gap-2">
        <NuxtLink to="/portfolio/preview" class="btn btn-outline btn-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview
        </NuxtLink>
        <button class="btn btn-primary btn-sm" @click="handleExport">
          Export
        </button>
      </div>
    </div>

    <LoadingSkeleton v-if="loading && !portfolio" :lines="8" />

    <div v-else class="space-y-6">
      <!-- Portfolio Metadata -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">Portfolio Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Portfolio Title</legend>
              <input
                v-model="portfolioForm.title"
                type="text"
                placeholder="e.g. John Doe - Game Developer"
                class="input w-full"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Email</legend>
              <input
                v-model="portfolioForm.email"
                type="email"
                placeholder="contact@example.com"
                class="input w-full"
              />
            </fieldset>

            <fieldset class="fieldset md:col-span-2">
              <legend class="fieldset-legend">Website</legend>
              <input
                v-model="portfolioForm.website"
                type="url"
                placeholder="https://yourwebsite.com"
                class="input w-full"
              />
            </fieldset>

            <fieldset class="fieldset md:col-span-2">
              <legend class="fieldset-legend">Bio</legend>
              <textarea
                v-model="portfolioForm.bio"
                class="textarea w-full"
                rows="4"
                placeholder="Tell the world about yourself and your game development experience..."
              ></textarea>
            </fieldset>
          </div>

          <div class="card-actions justify-end mt-4">
            <button class="btn btn-primary btn-sm" @click="handleSavePortfolio">
              Save Portfolio Info
            </button>
          </div>
        </div>
      </div>

      <!-- Projects -->
      <div class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">Projects</h2>
            <button class="btn btn-primary btn-sm" @click="openAddModal">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Project
            </button>
          </div>

          <div v-if="projects.length === 0" class="alert">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No projects yet. Add your first project to showcase your work.</span>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(project, idx) in projects"
              :key="project.id"
              class="card bg-base-100 cursor-move"
              draggable="true"
              @dragstart="handleDragStart(idx)"
              @dragover.prevent
              @drop="handleDrop(idx)"
            >
              <figure v-if="project.imageUrl" class="h-48">
                <NuxtImg
                  :src="project.imageUrl"
                  :alt="project.name"
                  class="w-full h-full object-cover"
                  sizes="sm:100vw md:50vw lg:33vw"
                  format="webp"
                />
              </figure>
              <div class="card-body">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="card-title text-base">{{ project.name }}</h3>
                  <svg class="w-5 h-5 text-base-content/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                  </svg>
                </div>

                <p class="text-sm text-base-content/70 line-clamp-3">{{ project.description }}</p>

                <div v-if="project.technologies?.length" class="flex flex-wrap gap-1 mt-2">
                  <span
                    v-for="tech in project.technologies.slice(0, 3)"
                    :key="tech"
                    class="badge badge-xs"
                  >
                    {{ tech }}
                  </span>
                  <span v-if="project.technologies.length > 3" class="badge badge-xs">
                    +{{ project.technologies.length - 3 }}
                  </span>
                </div>

                <div class="flex items-center gap-2 mt-2">
                  <span v-if="project.featured" class="badge badge-primary badge-xs">
                    Featured
                  </span>
                  <a v-if="project.projectUrl" :href="project.projectUrl" target="_blank" class="link link-primary text-xs">
                    View Project
                  </a>
                </div>

                <div class="card-actions justify-end mt-4">
                  <button
                    class="btn btn-xs btn-outline"
                    @click="openEditModal(project)"
                  >
                    Edit
                  </button>
                  <button
                    class="btn btn-xs btn-error btn-outline"
                    @click="handleDeleteProject(project.id)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Project Modal -->
    <dialog ref="projectDialogRef" class="modal" @close="showAddModal = false">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          {{ editingProject ? "Edit Project" : "Add Project" }}
        </h3>

        <div class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Project Name</legend>
            <input
              v-model="projectForm.name"
              type="text"
              placeholder="e.g. Dungeon Crawler RPG"
              class="input w-full"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Description</legend>
            <textarea
              v-model="projectForm.description"
              class="textarea textarea-bordered w-full"
              rows="4"
              placeholder="Describe your project, your role, and key achievements..."
            ></textarea>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Project URL (Optional)</legend>
            <input
              v-model="projectForm.projectUrl"
              type="url"
              placeholder="https://..."
              class="input w-full"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Image URL (Optional)</legend>
            <input
              v-model="projectForm.imageUrl"
              type="url"
              placeholder="https://..."
              class="input w-full"
            />
          </fieldset>

          <div>
            <label class="fieldset-legend mb-2 block">Technologies</label>
            <div class="flex gap-2 mb-2">
              <input
                v-model="newTech"
                type="text"
                placeholder="Add technology"
                class="input input-sm flex-1"
                @keyup.enter="addTechnology"
              />
              <button class="btn btn-sm btn-primary" @click="addTechnology">
                Add
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(tech, idx) in projectForm.technologies"
                :key="idx"
                class="badge gap-2"
              >
                {{ tech }}
                <button class="btn btn-ghost btn-xs btn-circle" @click="removeTechnology(idx)">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-2">
              <input
                v-model="projectForm.featured"
                type="checkbox"
                class="checkbox checkbox-primary"
              />
              <span class="label-text">Featured Project</span>
            </label>
          </div>
        </div>

        <div class="modal-action">
          <button
            class="btn btn-ghost"
            @click="showAddModal = false"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="!projectForm.name || !projectForm.description"
            @click="handleSaveProject"
          >
            {{ editingProject ? "Update" : "Add" }} Project
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showAddModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
