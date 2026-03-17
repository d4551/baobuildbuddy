<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { studioTypeLabel as formatStudioTypeLabel } from "~/utils/labels";

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
const comboboxId = `studio-selector-combobox-${selectorId}`;
const listboxId = `studio-selector-listbox-${selectorId}`;
const activeOptionIndex = ref(-1);

const selectedStudio = computed(() =>
  props.studios.find((studio) => studio.id === props.modelValue),
);

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
  if (open) {
    activeOptionIndex.value = getSelectedOrFirstOptionIndex();
    requestAnimationFrame(() => {
      searchInputRef.value?.focus();
    });
    return;
  }

  searchQuery.value = "";
  activeOptionIndex.value = -1;
});

watch(filteredStudios, (studios) => {
  if (studios.length === 0) {
    activeOptionIndex.value = -1;
    return;
  }

  if (activeOptionIndex.value < 0 || activeOptionIndex.value >= studios.length) {
    activeOptionIndex.value = getSelectedOrFirstOptionIndex();
  }
});

function getSelectedOrFirstOptionIndex(): number {
  const selectedIndex = filteredStudios.value.findIndex((studio) => studio.id === props.modelValue);
  if (selectedIndex >= 0) {
    return selectedIndex;
  }

  return filteredStudios.value.length > 0 ? 0 : -1;
}

function optionId(studioId: string): string {
  return `${listboxId}-option-${studioId}`;
}

const activeOptionId = computed(() => {
  const activeStudio = filteredStudios.value[activeOptionIndex.value];
  return activeStudio ? optionId(activeStudio.id) : undefined;
});

function selectStudio(studioId: string): void {
  emit("update:modelValue", studioId);
  closeDropdown();
}

function toggleDropdown(): void {
  isOpen.value = !isOpen.value;
}

function closeDropdown(): void {
  isOpen.value = false;
}

function onEscape(): void {
  closeDropdown();
}

function focusActiveOption(): void {
  const activeStudio = filteredStudios.value[activeOptionIndex.value];
  if (!activeStudio) {
    return;
  }

  document.getElementById(optionId(activeStudio.id))?.scrollIntoView({
    block: "nearest",
  });
}

function moveActiveOption(step: 1 | -1): void {
  const optionCount = filteredStudios.value.length;
  if (optionCount === 0) {
    activeOptionIndex.value = -1;
    return;
  }

  if (activeOptionIndex.value === -1) {
    activeOptionIndex.value = step === 1 ? 0 : optionCount - 1;
  } else {
    activeOptionIndex.value =
      (activeOptionIndex.value + step + optionCount) % optionCount;
  }

  focusActiveOption();
}

function selectActiveOption(): void {
  const activeStudio = filteredStudios.value[activeOptionIndex.value];
  if (activeStudio) {
    selectStudio(activeStudio.id);
  }
}

function handleComboboxKeydown(event: KeyboardEvent): void {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!isOpen.value) {
      isOpen.value = true;
      return;
    }
    moveActiveOption(1);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!isOpen.value) {
      isOpen.value = true;
      return;
    }
    moveActiveOption(-1);
    return;
  }

  if (event.key === "Enter") {
    if (!isOpen.value) {
      isOpen.value = true;
      return;
    }
    event.preventDefault();
    selectActiveOption();
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeDropdown();
  }
}

function studioTypeBadgeClass(type: string): string {
  const normalizedType = type.trim();
  return normalizedType.length > 0 ? "badge-outline" : "badge-ghost";
}

function resolvedStudioTypeLabel(type: string): string {
  const normalized = type.trim();
  return normalized.length > 0
    ? formatStudioTypeLabel(t, normalized)
    : t("studioSelector.unknownType");
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
          {{ resolvedStudioTypeLabel(selectedStudio.type) }}
        </span>
      </span>
      <span v-else class="text-base-content/50">{{ t("studioSelector.selectPlaceholder") }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="dropdown-content z-10 mt-2 max-h-96 w-full overflow-auto rounded-box bg-base-100 p-2 shadow-lg"
    >
      <div class="p-2 sticky top-0 bg-base-100 z-10">
        <input
          ref="studioSelectorSearchInput"
          v-model="searchQuery"
          :id="comboboxId"
          type="search"
          class="input input-bordered input-sm w-full"
          role="combobox"
          aria-autocomplete="list"
          :aria-controls="listboxId"
          :aria-expanded="isOpen"
          :aria-activedescendant="activeOptionId"
          :placeholder="t('studioSelector.searchPlaceholder')"
          :aria-label="t('studioSelector.searchAria')"
          @focus="isOpen = true"
          @keydown="handleComboboxKeydown"
          @click.stop
        />
      </div>

      <ul
        :id="listboxId"
        role="listbox"
        class="menu w-full space-y-1"
        :aria-label="t('studioSelector.menuAria')"
      >
        <li v-for="(studio, index) in filteredStudios" :key="studio.id">
          <button
            :id="optionId(studio.id)"
            type="button"
            role="option"
            class="flex w-full cursor-pointer flex-col items-start gap-1 rounded-box px-3 py-2 text-left"
            :aria-label="t('studioSelector.optionAria', { studio: studio.name })"
            :aria-selected="studio.id === modelValue"
            :class="{
              'bg-base-200': index === activeOptionIndex,
              'ring-1 ring-primary': studio.id === modelValue,
            }"
            @mouseenter="activeOptionIndex = index"
            @focus="activeOptionIndex = index"
            @click="selectStudio(studio.id)"
          >
            <div class="flex w-full items-center gap-2">
              <span class="font-medium truncate">{{ studio.name }}</span>
              <span class="badge badge-sm" :class="studioTypeBadgeClass(studio.type)">
                {{ resolvedStudioTypeLabel(studio.type) }}
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
