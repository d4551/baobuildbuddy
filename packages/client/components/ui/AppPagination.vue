<script setup lang="ts">
import { computed, ref, watch } from "vue";

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
const activePageIndex = ref(0);
const pageButtonRefs = ref<(HTMLButtonElement | null)[]>([]);

const normalizedPageNumbers = computed(() => {
  const seen = new Set<number>();
  const normalizedPages: number[] = [];

  for (const page of props.pageNumbers) {
    if (!Number.isInteger(page) || page < 1 || page > props.totalPages) {
      continue;
    }

    if (!seen.has(page)) {
      seen.add(page);
      normalizedPages.push(page);
    }
  }

  return normalizedPages;
});
const hasNormalizedPages = computed(() => normalizedPageNumbers.value.length > 0);

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

function getPageButtons(): HTMLButtonElement[] {
  return pageButtonRefs.value.filter((element): element is HTMLButtonElement => element !== null);
}

function getPageIndex(page: number): number {
  const index = normalizedPageNumbers.value.findIndex((item) => item === page);
  return index >= 0 ? index : 0;
}

function setActivePageIndex(page: number): void {
  activePageIndex.value = getPageIndex(page);
}

function setPageRef(index: number, element: Element | null): void {
  pageButtonRefs.value[index] = element instanceof HTMLButtonElement ? element : null;
}

function clampPageIndex(index: number): number {
  const maxIndex = normalizedPageNumbers.value.length - 1;
  if (maxIndex < 0) return 0;
  if (index > maxIndex) return 0;
  return index < 0 ? maxIndex : index;
}

function handleNavigationKeydown(event: KeyboardEvent): void {
  if (!normalizedPageNumbers.value.length) return;

  if (
    event.key !== "ArrowLeft" &&
    event.key !== "ArrowRight" &&
    event.key !== "Home" &&
    event.key !== "End"
  ) {
    return;
  }

  event.preventDefault();

  if (event.key === "Home") {
    activePageIndex.value = 0;
    selectPage(normalizedPageNumbers.value[0] ?? 1);
    getPageButtons()[0]?.focus();
    return;
  }

  if (event.key === "End") {
    const lastIndex = normalizedPageNumbers.value.length - 1;
    activePageIndex.value = lastIndex;
    selectPage(normalizedPageNumbers.value[lastIndex] ?? 1);
    getPageButtons()[lastIndex]?.focus();
    return;
  }

  const direction = event.key === "ArrowRight" ? 1 : -1;
  const nextIndex = clampPageIndex(activePageIndex.value + direction);
  activePageIndex.value = nextIndex;
  selectPage(normalizedPageNumbers.value[nextIndex] ?? 1);
  getPageButtons()[nextIndex]?.focus();
}

watch(
  () => props.currentPage,
  (nextPage) => {
    activePageIndex.value = getPageIndex(nextPage);
  },
  { immediate: true },
);

watch(
  () => normalizedPageNumbers.value,
  () => {
    const count = normalizedPageNumbers.value.length;
    pageButtonRefs.value = new Array<HTMLButtonElement | null>(count).fill(null);
    activePageIndex.value = getPageIndex(props.currentPage);
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="hasPages && hasNormalizedPages" class="card card-border bg-base-100">
    <div class="card-body gap-3 py-4 md:flex-row md:items-center md:justify-between">
      <p class="text-xs text-base-content/70">{{ summary }}</p>

      <nav class="join" :aria-label="navigationAria">
        <button
          type="button"
          class="join-item btn btn-sm btn-outline"
          :aria-label="previousAria"
          :disabled="!canGoPrevious"
          @keydown="handleNavigationKeydown"
          @click="selectPreviousPage"
        >
          <span aria-hidden="true">«</span>
          <span class="sr-only">{{ previousAria }}</span>
        </button>

        <button
          v-for="(page, index) in normalizedPageNumbers"
          :key="page"
          type="button"
          class="join-item btn btn-sm btn-ghost"
          :class="{ 'btn-active': page === currentPage }"
          :aria-label="pageAria(page)"
          :aria-current="page === currentPage ? 'page' : undefined"
          :tabindex="page === currentPage ? 0 : -1"
          :ref="(element) => setPageRef(index, element as Element | null)"
          @focus="setActivePageIndex(page)"
          @keydown="handleNavigationKeydown"
          @click="selectPage(page)"
        >
          {{ page }}
        </button>

        <button
          type="button"
          class="join-item btn btn-sm btn-outline"
          :aria-label="nextAria"
          :disabled="!canGoNext"
          @keydown="handleNavigationKeydown"
          @click="selectNextPage"
        >
          <span aria-hidden="true">»</span>
          <span class="sr-only">{{ nextAria }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>
