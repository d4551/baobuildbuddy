<script setup lang="ts">
import type { PortfolioProject } from "@bao/shared";

const props = defineProps<{
  projects: PortfolioProject[];
}>();

const emit = defineEmits<{
  edit: [project: PortfolioProject];
  delete: [project: PortfolioProject];
  toggleFeatured: [project: PortfolioProject];
  reorder: [projects: PortfolioProject[]];
}>();

const draggedIndex = ref<number | null>(null);
const localProjects = ref<PortfolioProject[]>([...props.projects]);

watch(
  () => props.projects,
  (newProjects) => {
    localProjects.value = [...newProjects];
  },
  { deep: true },
);

function handleDragStart(event: DragEvent, index: number) {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function handleDrop(event: DragEvent, dropIndex: number) {
  event.preventDefault();

  if (draggedIndex.value === null || draggedIndex.value === dropIndex) {
    return;
  }

  const draggedProject = localProjects.value[draggedIndex.value];
  localProjects.value.splice(draggedIndex.value, 1);
  localProjects.value.splice(dropIndex, 0, draggedProject);

  emit("reorder", [...localProjects.value]);
  draggedIndex.value = null;
}

function handleEdit(project: PortfolioProject) {
  emit("edit", project);
}

function handleDelete(project: PortfolioProject) {
  emit("delete", project);
}

function handleToggleFeatured(project: PortfolioProject) {
  emit("toggleFeatured", project);
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div
      v-for="(project, index) in localProjects"
      :key="project.id"
      role="button"
      tabindex="0"
      draggable="true"
      @dragstart="handleDragStart($event, index)"
      @dragover="handleDragOver"
      @drop="handleDrop($event, index)"
      @keydown.enter.prevent
      @keydown.space.prevent
      class="cursor-move"
    >
      <ProjectCard
        :project="project"
        @edit="handleEdit(project)"
        @delete="handleDelete(project)"
        @toggle-featured="handleToggleFeatured(project)"
      />
    </div>
  </div>
</template>
