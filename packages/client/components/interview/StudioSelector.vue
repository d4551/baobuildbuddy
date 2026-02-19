<script setup lang="ts">
interface Studio {
  id: string;
  name: string;
  type: string;
  location: string;
}

const props = defineProps<{
  modelValue: string;
  studios: Studio[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const searchQuery = ref("");
const isOpen = ref(false);

const selectedStudio = computed(() => {
  return props.studios.find((s) => s.id === props.modelValue);
});

const filteredStudios = computed(() => {
  if (!searchQuery.value) return props.studios;

  const query = searchQuery.value.toLowerCase();
  return props.studios.filter(
    (studio) =>
      studio.name.toLowerCase().includes(query) ||
      studio.type.toLowerCase().includes(query) ||
      studio.location.toLowerCase().includes(query),
  );
});

function selectStudio(studioId: string) {
  emit("update:modelValue", studioId);
  isOpen.value = false;
  searchQuery.value = "";
}

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function closeDropdown() {
  isOpen.value = false;
}

const studioTypeBadgeClass = (type: string) => {
  const typeMap: Record<string, string> = {
    AAA: "badge-primary",
    Indie: "badge-secondary",
    Mobile: "badge-accent",
    Publishing: "badge-info",
    Startup: "badge-success",
  };
  return typeMap[type] || "badge-ghost";
};
</script>

<template>
  <div class="dropdown w-full" :class="{ 'dropdown-open': isOpen }">
    <label
      tabindex="0"
      class="btn btn-outline w-full justify-between"
      @click="toggleDropdown"
    >
      <span v-if="selectedStudio" class="flex items-center gap-2">
        {{ selectedStudio.name }}
        <span class="badge badge-sm" :class="studioTypeBadgeClass(selectedStudio.type)">
          {{ selectedStudio.type }}
        </span>
      </span>
      <span v-else class="text-base-content/50">Select a studio...</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </label>

    <div
      v-if="isOpen"
      tabindex="0"
      class="dropdown-content z-10 menu p-2 shadow-lg bg-base-100 rounded-box w-full mt-2 max-h-96 overflow-auto flex-nowrap"
    >
      <div class="p-2 sticky top-0 bg-base-100 z-10">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search studios..."
          class="input input-bordered input-sm w-full"
          @click.stop
        />
      </div>

      <ul class="space-y-1">
        <li v-for="studio in filteredStudios" :key="studio.id">
          <a
            class="flex flex-col items-start gap-1"
            :class="{ 'active': studio.id === modelValue }"
            @click="selectStudio(studio.id)"
          >
            <div class="flex items-center gap-2 w-full">
              <span class="font-medium">{{ studio.name }}</span>
              <span class="badge badge-sm" :class="studioTypeBadgeClass(studio.type)">
                {{ studio.type }}
              </span>
            </div>
            <span class="text-xs text-base-content/60">{{ studio.location }}</span>
          </a>
        </li>
        <li v-if="filteredStudios.length === 0">
          <span class="text-base-content/50">No studios found</span>
        </li>
      </ul>
    </div>
  </div>

  <div
    v-if="isOpen"
    class="fixed inset-0 z-0"
    @click="closeDropdown"
  ></div>
</template>
