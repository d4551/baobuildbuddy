<script setup lang="ts">
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import { useDebouncedValue } from "~/composables/useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 300;

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  search: [];
}>();

const { t } = useI18n();
const searchValue = ref(props.modelValue);
const debouncedSearchValue = useDebouncedValue(searchValue, SEARCH_DEBOUNCE_MS);

function emitSearch(): void {
  emit("search");
}

watch(
  () => props.modelValue,
  (newValue) => {
    searchValue.value = newValue;
  },
);

watch(searchValue, (newValue) => {
  emit("update:modelValue", newValue);
});

function clearSearch() {
  searchValue.value = "";
  emit("update:modelValue", "");
  emitSearch();
}

function handleSubmit() {
  emitSearch();
}

watch(debouncedSearchValue, emitSearch, { immediate: false });
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="join">
      <span class="join-item bg-base-200">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        v-model="searchValue"
        type="text"
        :placeholder="t('jobsPage.searchPlaceholder')"
        class="input join-item w-full"
        :aria-label="t('jobsPage.searchAria')"
      />
      <button
        v-if="searchValue"
        type="button"
        class="btn btn-ghost btn-square join-item"
        :aria-label="t('jobsPage.clearSearchAria')"
        @click="clearSearch"
      >
        <CloseIcon class="h-5 w-5" />
      </button>
    </div>
  </form>
</template>
