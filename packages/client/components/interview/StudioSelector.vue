<script setup lang="ts">
import { useI18n } from "vue-i18n";

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

const { t } = useI18n();
const searchQuery = ref("");
const isOpen = ref(false);
const searchInputRef = useTemplateRef<HTMLInputElement>("studioSelectorSearchInput");
const selectorId = useId();
const listboxId = `studio-selector-listbox-${selectorId}`;

const selectedStudio = computed(() => props.studios.find((studio) => studio.id === props.modelValue));

const filteredStudios = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return props.studios;

  return props.studios.filter(
    (studio) =>
      studio.name.toLowerCase().includes(query) ||
      studio.type.toLowerCase().includes(query) ||
      studio.location.toLowerCase().includes(query),
  );
});

watch(isOpen, (open) => {
  if (!open) return;
  nextTick(() => {
    searchInputRef.value?.focus();
  });
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

function onEscape() {
  closeDropdown();
}

function studioTypeBadgeClass(type: string): string {
  const normalizedType = type.trim();
  return normalizedType.length > 0 ? "badge-outline" : "badge-ghost";
}

function studioTypeLabel(type: string): string {
  const normalized = type.trim();
  return normalized.length > 0 ? normalized : t("studioSelector.unknownType");
}

function studioLocationLabel(location: string): string {
  const normalized = location.trim();
  return normalized.length > 0 ? normalized : t("studioSelector.unknownLocation");
}
</script>

<template>
  <div class="dropdown w-full" :class="{ 'dropdown-open': isOpen }">
    <button
      type="button"
      class="btn btn-outline w-full justify-between"
      :aria-label="t('studioSelector.toggleAria')"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      aria-haspopup="listbox"
      @click="toggleDropdown"
      @keydown.esc.stop.prevent="onEscape"
    >
      <span v-if="selectedStudio" class="flex items-center gap-2 truncate">
        <span class="truncate">{{ selectedStudio.name }}</span>
        <span class="badge badge-sm" :class="studioTypeBadgeClass(selectedStudio.type)">
          {{ studioTypeLabel(selectedStudio.type) }}
        </span>
      </span>
      <span v-else class="text-base-content/50">{{ t("studioSelector.selectPlaceholder") }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div
      v-if="isOpen"
      :id="listboxId"
      tabindex="0"
      role="listbox"
      class="dropdown-content z-10 menu p-2 shadow-lg bg-base-100 rounded-box w-full mt-2 max-h-96 overflow-auto flex-nowrap"
      :aria-label="t('studioSelector.listboxAria')"
      @keydown.esc.stop.prevent="onEscape"
    >
      <div class="p-2 sticky top-0 bg-base-100 z-10">
        <input
          ref="studioSelectorSearchInput"
          v-model="searchQuery"
          type="search"
          class="input input-bordered input-sm w-full"
          :placeholder="t('studioSelector.searchPlaceholder')"
          :aria-label="t('studioSelector.searchAria')"
          @click.stop
        />
      </div>

      <ul class="space-y-1">
        <li v-for="studio in filteredStudios" :key="studio.id">
          <button
            type="button"
            role="option"
            class="flex flex-col items-start gap-1"
            :aria-selected="studio.id === modelValue"
            :class="{ active: studio.id === modelValue }"
            @click="selectStudio(studio.id)"
          >
            <div class="flex items-center gap-2 w-full">
              <span class="font-medium truncate">{{ studio.name }}</span>
              <span class="badge badge-sm" :class="studioTypeBadgeClass(studio.type)">
                {{ studioTypeLabel(studio.type) }}
              </span>
            </div>
            <span class="text-xs text-base-content/60">{{ studioLocationLabel(studio.location) }}</span>
          </button>
        </li>
        <li v-if="filteredStudios.length === 0">
          <span class="text-base-content/50">{{ t("studioSelector.emptyState") }}</span>
        </li>
      </ul>
    </div>
  </div>

  <button
    v-if="isOpen"
    type="button"
    class="fixed inset-0 z-0"
    :aria-label="t('studioSelector.closeAria')"
    @click="closeDropdown"
  ></button>
</template>
