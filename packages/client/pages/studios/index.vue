<script setup lang="ts">
import { getErrorMessage } from "~/utils/errors";

const { $toast } = useNuxtApp();
const router = useRouter();
const { studios, loading: studioLoading, fetchStudios } = useStudio();

const pageError = ref<string | null>(null);
const searchQuery = ref("");
const filters = reactive({
  type: "",
  size: "",
  remoteWork: false,
});

const loading = computed(() => studioLoading.value);

onMounted(async () => {
  await loadStudios();
});

async function loadStudios() {
  pageError.value = null;
  try {
    await fetchStudios();
  } catch (error: unknown) {
    pageError.value = getErrorMessage(error, "Failed to load studios");
    $toast.error(pageError.value);
  }
}

const filteredStudios = computed(() => {
  if (!studios.value) return [];
  let result = [...studios.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.location?.toLowerCase().includes(query),
    );
  }

  if (filters.type) {
    result = result.filter((s) => s.type === filters.type);
  }

  if (filters.size) {
    result = result.filter((s) => s.size === filters.size);
  }

  if (filters.remoteWork) {
    result = result.filter((s) => s.remoteWork);
  }

  return result;
});

function viewStudio(id: string) {
  router.push(`/studios/${id}`);
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Studio Database</h1>

    <div v-if="pageError" class="alert alert-error mb-6">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ pageError }}</span>
      <button class="btn btn-sm" @click="loadStudios">Retry</button>
    </div>

    <div class="card bg-base-200 mb-6">
      <div class="card-body">
        <div class="flex flex-col sm:flex-row gap-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search studios by name, location..."
            class="input input-bordered flex-1"
            aria-label="Search studios by name, location..."/>
          <div class="flex gap-2">
            <select v-model="filters.type" class="select select-bordered" aria-label="Type">
              <option value="">All Types</option>
              <option value="AAA">AAA</option>
              <option value="Indie">Indie</option>
              <option value="Mobile">Mobile</option>
              <option value="Publisher">Publisher</option>
            </select>

            <select v-model="filters.size" class="select select-bordered" aria-label="Size">
              <option value="">All Sizes</option>
              <option value="Small (10-50)">Small (10-50)</option>
              <option value="Medium (300-1000)">Medium (300-1000)</option>
              <option value="Large (1000+)">Large (1000+)</option>
            </select>

            <label class="label cursor-pointer gap-2">
              <span class="label-text">Remote</span>
              <input
                v-model="filters.remoteWork"
                type="checkbox"
                class="toggle toggle-primary toggle-sm"
                aria-label="Remote Work"/>
            </label>
          </div>
        </div>
      </div>
    </div>

    <LoadingSkeleton v-if="loading && !studios.length" :lines="6" />

    <div v-else-if="filteredStudios.length === 0" class="alert">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>No studios found. Try adjusting your search or filters.</span>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="studio in filteredStudios"
        :key="studio.id"
        class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors"
        role="button"
        tabindex="0"
        @click="viewStudio(studio.id)"
        @keydown.enter="viewStudio(studio.id)"
        @keydown.space.prevent="viewStudio(studio.id)"
      >
        <div class="card-body">
          <div class="flex items-center gap-3 mb-2">
            <div class="avatar placeholder">
              <div class="bg-neutral text-neutral-content rounded-full w-12">
                <span class="text-xl">{{ studio.name[0] }}</span>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="card-title text-lg">{{ studio.name }}</h3>
            </div>
          </div>

          <p class="text-sm text-base-content/70 mb-3">{{ studio.description }}</p>

          <div class="flex flex-wrap gap-2 mb-3">
            <span class="badge badge-primary badge-sm">{{ studio.type }}</span>
            <span class="badge badge-sm">{{ studio.size }}</span>
            <span v-if="studio.remoteWork" class="badge badge-success badge-sm">
              Remote
            </span>
          </div>

          <div class="flex items-center gap-2 text-sm text-base-content/60 mb-3">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{{ studio.location }}</span>
          </div>

          <div class="card-actions justify-end">
            <button class="btn btn-primary btn-sm" @click.stop="viewStudio(studio.id)">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
