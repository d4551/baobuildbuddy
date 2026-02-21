<script setup lang="ts">
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  search: [];
}>();

const { t } = useI18n();
const searchValue = ref(props.modelValue);
let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.modelValue,
  (newValue) => {
    searchValue.value = newValue;
  },
);

watch(searchValue, (newValue) => {
  emit("update:modelValue", newValue);

  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

  debounceTimeout = setTimeout(() => {
    emit("search");
  }, 300);
});

function clearSearch() {
  searchValue.value = "";
  emit("update:modelValue", "");
  emit("search");
}

function handleSubmit() {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  emit("search");
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="form-control">
    <div class="input-group">
      <span class="bg-base-200">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        v-model="searchValue"
        type="text"
        :placeholder="t('jobsPage.searchPlaceholder')"
        class="input input-bordered w-full"
        :aria-label="t('jobsPage.searchAria')"
      />
      <button
        v-if="searchValue"
        type="button"
        class="btn btn-ghost btn-square"
        :aria-label="t('jobsPage.clearSearchAria')"
        @click="clearSearch"
      >
        <CloseIcon class="h-5 w-5" />
      </button>
    </div>
  </form>
</template>
