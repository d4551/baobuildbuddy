<script setup lang="ts">
import { computed } from "vue";

type PageAriaResolver = (page: number) => string;

interface AppPaginationProps {
  currentPage: number;
  totalPages: number;
  pageNumbers: readonly number[];
  summary: string;
  navigationAria: string;
  previousAria: string;
  nextAria: string;
  pageAria: PageAriaResolver;
}

const props = defineProps<AppPaginationProps>();

const emit = defineEmits<{
  "update:currentPage": [page: number];
}>();

const canGoPrevious = computed(() => props.currentPage > 1);
const canGoNext = computed(() => props.currentPage < props.totalPages);
const hasPages = computed(() => props.totalPages > 1);

function selectPage(page: number): void {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return;
  emit("update:currentPage", page);
}

function selectPreviousPage(): void {
  if (!canGoPrevious.value) return;
  selectPage(props.currentPage - 1);
}

function selectNextPage(): void {
  if (!canGoNext.value) return;
  selectPage(props.currentPage + 1);
}
</script>

<template>
  <div v-if="hasPages" class="card card-border bg-base-100">
    <div class="card-body gap-3 py-4 md:flex-row md:items-center md:justify-between">
      <p class="text-xs text-base-content/70">{{ summary }}</p>

      <nav class="join" :aria-label="navigationAria">
        <button
          type="button"
          class="join-item btn btn-sm btn-outline"
          :aria-label="previousAria"
          :disabled="!canGoPrevious"
          @click="selectPreviousPage"
        >
          <span aria-hidden="true">«</span>
          <span class="sr-only">{{ previousAria }}</span>
        </button>

        <button
          v-for="page in pageNumbers"
          :key="page"
          type="button"
          class="join-item btn btn-sm"
          :class="{ 'btn-active': page === currentPage }"
          :aria-label="pageAria(page)"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="selectPage(page)"
        >
          {{ page }}
        </button>

        <button
          type="button"
          class="join-item btn btn-sm btn-outline"
          :aria-label="nextAria"
          :disabled="!canGoNext"
          @click="selectNextPage"
        >
          <span aria-hidden="true">»</span>
          <span class="sr-only">{{ nextAria }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>
