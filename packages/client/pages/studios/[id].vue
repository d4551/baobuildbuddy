<script setup lang="ts">
import { getErrorMessage } from "~/utils/errors";

const { $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const { studio, loading: studioLoading, fetchStudioById } = useStudio();

const pageError = ref<string | null>(null);
const studioId = computed(() => route.params.id as string);
const loading = computed(() => studioLoading.value);

onMounted(async () => {
  await loadStudio();
});

async function loadStudio() {
  pageError.value = null;
  try {
    await fetchStudioById(studioId.value);
    if (!studio.value) {
      pageError.value = "Studio not found";
      $toast.error(pageError.value);
    }
  } catch (error: unknown) {
    pageError.value = getErrorMessage(error, "Failed to load studio details");
    $toast.error(pageError.value);
  }
}

function startPracticeInterview() {
  router.push(`/interview?studio=${studioId.value}`);
}
</script>

<template>
  <div>
    <div class="mb-6">
      <button class="btn btn-ghost btn-sm" @click="router.back()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Studios
      </button>
    </div>

    <div v-if="pageError" class="alert alert-error mb-6">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ pageError }}</span>
      <button class="btn btn-sm" @click="loadStudio">Retry</button>
    </div>

    <LoadingSkeleton v-else-if="loading" :lines="10" />

    <div v-else-if="studio" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Header -->
        <div class="card bg-base-200">
          <div class="card-body">
            <div class="flex items-start gap-4">
              <div class="avatar placeholder">
                <div class="bg-neutral text-neutral-content rounded-full w-20">
                  <span class="text-3xl">{{ studio.name[0] }}</span>
                </div>
              </div>
              <div class="flex-1">
                <h1 class="text-3xl font-bold mb-2">{{ studio.name }}</h1>
                <p class="text-base-content/70 mb-3">{{ studio.description }}</p>
                <div class="flex flex-wrap gap-2">
                  <span class="badge badge-primary">{{ studio.type }}</span>
                  <span class="badge">{{ studio.size }}</span>
                  <span v-if="studio.remoteWork" class="badge badge-success">
                    Remote Friendly
                  </span>
                </div>
              </div>
            </div>

            <div class="card-actions mt-4">
              <button class="btn btn-primary" @click="startPracticeInterview">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Practice Interview
              </button>

              <a v-if="studio.website" :href="studio.website" target="_blank" class="btn btn-outline">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Visit Website
              </a>
            </div>
          </div>
        </div>

        <!-- Culture -->
        <div v-if="studio.culture" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">Studio Culture</h2>
            <p>{{ studio.culture }}</p>
          </div>
        </div>

        <!-- Interview Style -->
        <div v-if="studio.interviewStyle" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">Interview Process</h2>
            <p>{{ studio.interviewStyle }}</p>
          </div>
        </div>

        <!-- Technologies -->
        <div v-if="studio.technologies?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title">Technologies Used</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tech in studio.technologies"
                :key="tech"
                class="badge badge-lg badge-primary"
              >
                {{ tech }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Info -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">Studio Info</h2>

            <div class="space-y-3">
              <div>
                <p class="text-xs text-base-content/60">Location</p>
                <p class="font-medium">{{ studio.location }}</p>
              </div>

              <div>
                <p class="text-xs text-base-content/60">Studio Type</p>
                <p class="font-medium">{{ studio.type }}</p>
              </div>

              <div>
                <p class="text-xs text-base-content/60">Company Size</p>
                <p class="font-medium">{{ studio.size }}</p>
              </div>

              <div>
                <p class="text-xs text-base-content/60">Remote Work</p>
                <p class="font-medium">{{ studio.remoteWork ? 'Yes' : 'No' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Notable Games -->
        <div v-if="studio.games?.length" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">Notable Games</h2>
            <ul class="space-y-2">
              <li v-for="game in studio.games" :key="game" class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {{ game }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
