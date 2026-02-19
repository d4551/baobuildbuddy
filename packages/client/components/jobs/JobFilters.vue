<script setup lang="ts">
const props = defineProps<{
  filters: {
    location?: string;
    remote?: boolean;
    experienceLevel?: string;
    studioType?: string;
    platforms?: string[];
    genres?: string[];
  };
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:filters": [filters: typeof props.filters];
}>();

const localFilters = ref({ ...props.filters });

const experienceLevels = ["Entry", "Mid", "Senior", "Lead"];
const studioTypes = ["AAA", "Indie", "Mobile", "Publishing", "Startup"];
const platforms = ["PC", "Console", "Mobile", "VR", "Web"];
const genres = ["Action", "RPG", "Strategy", "Simulation", "Casual", "Multiplayer"];

watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters };
  },
  { deep: true },
);

function applyFilters() {
  emit("update:filters", { ...localFilters.value });
}

function clearFilters() {
  localFilters.value = {
    location: "",
    remote: false,
    experienceLevel: "",
    studioType: "",
    platforms: [],
    genres: [],
  };
  emit("update:filters", { ...localFilters.value });
}

function togglePlatform(platform: string) {
  if (!localFilters.value.platforms) localFilters.value.platforms = [];
  const index = localFilters.value.platforms.indexOf(platform);
  if (index > -1) {
    localFilters.value.platforms.splice(index, 1);
  } else {
    localFilters.value.platforms.push(platform);
  }
}

function toggleGenre(genre: string) {
  if (!localFilters.value.genres) localFilters.value.genres = [];
  const index = localFilters.value.genres.indexOf(genre);
  if (index > -1) {
    localFilters.value.genres.splice(index, 1);
  } else {
    localFilters.value.genres.push(genre);
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Location -->
    <div class="collapse collapse-arrow bg-base-200">
      <input type="checkbox" checked />
      <div class="collapse-title font-medium">Location</div>
      <div class="collapse-content">
        <input
          v-model="localFilters.location"
          type="text"
          placeholder="City, State, or Country"
          class="input input-bordered w-full"
        />
        <div class="form-control mt-2">
          <label class="label cursor-pointer">
            <span class="label-text">Remote Only</span>
            <input v-model="localFilters.remote" type="checkbox" class="checkbox checkbox-primary" />
          </label>
        </div>
      </div>
    </div>

    <!-- Experience Level -->
    <div class="collapse collapse-arrow bg-base-200">
      <input type="checkbox" checked />
      <div class="collapse-title font-medium">Experience Level</div>
      <div class="collapse-content">
        <select v-model="localFilters.experienceLevel" class="select select-bordered w-full">
          <option value="">Any Level</option>
          <option v-for="level in experienceLevels" :key="level" :value="level">
            {{ level }}
          </option>
        </select>
      </div>
    </div>

    <!-- Studio Type -->
    <div class="collapse collapse-arrow bg-base-200">
      <input type="checkbox" />
      <div class="collapse-title font-medium">Studio Type</div>
      <div class="collapse-content">
        <select v-model="localFilters.studioType" class="select select-bordered w-full">
          <option value="">Any Type</option>
          <option v-for="type in studioTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>
    </div>

    <!-- Platforms -->
    <div class="collapse collapse-arrow bg-base-200">
      <input type="checkbox" />
      <div class="collapse-title font-medium">Platforms</div>
      <div class="collapse-content flex flex-col gap-2">
        <label
          v-for="platform in platforms"
          :key="platform"
          class="label cursor-pointer"
        >
          <span class="label-text">{{ platform }}</span>
          <input
            type="checkbox"
            :checked="localFilters.platforms?.includes(platform)"
            @change="togglePlatform(platform)"
            class="checkbox checkbox-primary checkbox-sm"
          />
        </label>
      </div>
    </div>

    <!-- Genres -->
    <div class="collapse collapse-arrow bg-base-200">
      <input type="checkbox" />
      <div class="collapse-title font-medium">Genres</div>
      <div class="collapse-content flex flex-col gap-2">
        <label
          v-for="genre in genres"
          :key="genre"
          class="label cursor-pointer"
        >
          <span class="label-text">{{ genre }}</span>
          <input
            type="checkbox"
            :checked="localFilters.genres?.includes(genre)"
            @change="toggleGenre(genre)"
            class="checkbox checkbox-primary checkbox-sm"
          />
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <button
        class="btn btn-ghost flex-1"
        :disabled="loading"
        @click="clearFilters"
      >
        Clear
      </button>
      <button
        class="btn btn-primary flex-1"
        :disabled="loading"
        @click="applyFilters"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        <span v-else>Apply</span>
      </button>
    </div>
  </div>
</template>
