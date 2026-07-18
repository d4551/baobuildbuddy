<script setup lang="ts">
import {  FLUID_WIDTH_CLASS, PADDING_TOKEN_CLASS, MARGIN_TOKEN_CLASS, FLEX_GAP_TOKEN_CLASS, STACK_SPACE_Y_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {  FLUID_WIDTH_CLASS, PADDING_TOKEN_CLASS, MARGIN_TOKEN_CLASS, FLEX_GAP_TOKEN_CLASS, STACK_SPACE_Y_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS, useI18n } from "vue-i18n";
import {  FLUID_WIDTH_CLASS, PADDING_TOKEN_CLASS, MARGIN_TOKEN_CLASS, FLEX_GAP_TOKEN_CLASS, STACK_SPACE_Y_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS, studioTypeLabel as formatStudioTypeLabel } from "~/utils/labels";

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
    activeOptionIndex.value = (activeOptionIndex.value + step + optionCount) % optionCount;
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
  <div class="dropdown" :class="[FLUID_WIDTH_CLASS, { 'dropdown-open': isOpen }]">
    <button
      type="button"
      class="btn btn-outline justify-between" :class="[FLUID_WIDTH_CLASS]"
      :aria-label="t('studioSelector.toggleAria')"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      aria-haspopup="listbox"
      @click="toggleDropdown"
      @keydown.esc.stop.prevent="onEscape"
    >
      <span v-if="selectedStudio" class="flex items-center truncate" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
        <span class="truncate">{{ selectedStudio.name }}</span>
        <span class="badge badge-sm" :class="studioTypeBadgeClass(selectedStudio.type)">
          {{ resolvedStudioTypeLabel(selectedStudio.type) }}
        </span>
      </span>
      <span v-else class="text-muted">{{ t("studioSelector.selectPlaceholder") }}</span>
      <IconChevronDown class="h-5 w-5 shrink-0" />
    </button>

    <div
      v-if="isOpen"
      class="dropdown-content z-10 max-h-96 overflow-auto rounded-box bg-base-100" :class="[FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS.mt2, SHADOW_TOKEN_CLASS.lg, PADDING_TOKEN_CLASS.p2]"
    >
      <div class="sticky top-0 bg-base-100 z-10" :class="[PADDING_TOKEN_CLASS.p2]">
        <input
          ref="studioSelectorSearchInput"
          v-model="searchQuery"
          :id="comboboxId"
          type="search"
          class="input input-sm" :class="[FLUID_WIDTH_CLASS]"
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
        class="menu" :class="[FLUID_WIDTH_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack1]"
        :aria-label="t('studioSelector.menuAria')"
      >
        <li v-for="(studio, index) in filteredStudios" :key="studio.id">
          <button
            :id="optionId(studio.id)"
            type="button"
            role="option"
            class="flex cursor-pointer flex-col items-start rounded-box text-left"
            :aria-label="t('studioSelector.optionAria', { studio: studio.name })"
            :aria-selected="studio.id === modelValue"
            :class="[FLUID_WIDTH_CLASS, FLEX_GAP_TOKEN_CLASS.gap1, PADDING_TOKEN_CLASS.px3, PADDING_TOKEN_CLASS.py2, {
              'bg-base-200': index === activeOptionIndex,
              'ring-1 ring-primary': studio.id === modelValue,
            }]"
            @mouseenter="activeOptionIndex = index"
            @focus="activeOptionIndex = index"
            @click="selectStudio(studio.id)"
          >
            <div class="flex items-center" :class="[FLUID_WIDTH_CLASS, FLEX_GAP_TOKEN_CLASS.gap2]">
              <span class="font-medium truncate">{{ studio.name }}</span>
              <span class="badge badge-sm" :class="studioTypeBadgeClass(studio.type)">
                {{ resolvedStudioTypeLabel(studio.type) }}
              </span>
            </div>
            <span class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ studioLocationLabel(studio.location) }}</span>
          </button>
        </li>
        <li v-if="filteredStudios.length === 0">
          <span class="text-muted">{{ t("studioSelector.emptyState") }}</span>
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
