<script setup lang="ts">
import type { PortfolioProject } from "@bao/shared";

const props = defineProps<{
  project: PortfolioProject;
}>();

const emit = defineEmits<{
  edit: [];
  delete: [];
  toggleFeatured: [];
}>();

const truncatedDescription = computed(() => {
  const maxLength = 120;
  if (props.project.description.length <= maxLength) {
    return props.project.description;
  }
  return props.project.description.slice(0, maxLength) + "...";
});
</script>

<template>
  <div class="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
    <figure class="h-48 bg-base-300">
      <NuxtImg
        v-if="project.image"
        :src="project.image"
        :alt="project.title"
        class="w-full h-full object-cover"
        sizes="sm:100vw md:50vw lg:33vw"
        format="webp"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-base-content/30">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </figure>
    <div class="card-body">
      <div class="flex justify-between items-start">
        <h2 class="card-title">
          {{ project.title }}
          <button
            class="btn btn-ghost btn-xs btn-circle"
            @click="emit('toggleFeatured')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              :class="project.featured ? 'fill-warning' : 'fill-none'"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </h2>
      </div>

      <p class="text-sm text-base-content/70">{{ truncatedDescription }}</p>

      <div class="flex flex-wrap gap-2 mt-2">
        <div
          v-for="tech in project.technologies"
          :key="tech"
          class="badge badge-outline badge-sm"
        >
          {{ tech }}
        </div>
      </div>

      <div class="card-actions justify-between items-center mt-4">
        <div class="flex gap-2">
          <a
            v-if="project.liveUrl"
            :href="project.liveUrl"
            target="_blank"
            class="btn btn-ghost btn-xs"
            aria-label="Open live project"
          >
            <span class="sr-only">Open live project</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a
            v-if="project.githubUrl"
            :href="project.githubUrl"
            target="_blank"
            class="btn btn-ghost btn-xs"
            aria-label="Open GitHub repository"
          >
            <span class="sr-only">Open GitHub repository</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>

        <div class="flex gap-1">
          <button
            class="btn btn-ghost btn-xs"
            @click="emit('edit')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            class="btn btn-ghost btn-xs text-error"
            @click="emit('delete')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
