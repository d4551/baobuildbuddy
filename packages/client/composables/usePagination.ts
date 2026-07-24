import type { ComputedRef, Ref, WatchSource } from "vue";
import { computed, ref, watch } from "vue";

const FIRST_PAGE = 1;
const MIN_PAGE_SIZE = 1;

function clampToRange(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

interface PaginationComputeds<T> {
  totalItems: ComputedRef<number>;
  totalPages: ComputedRef<number>;
  pageNumbers: ComputedRef<readonly number[]>;
  itemsForCurrentPage: ComputedRef<readonly T[]>;
  rangeStart: ComputedRef<number>;
  rangeEnd: ComputedRef<number>;
  hasMultiplePages: ComputedRef<boolean>;
}

function createPaginationComputeds<T>(
  items: ComputedRef<readonly T[]>,
  currentPage: Ref<number>,
  normalizedPageSize: number,
): PaginationComputeds<T> {
  const totalItems = computed(() => items.value.length);
  const totalPages = computed(() =>
    totalItems.value === 0 ? FIRST_PAGE : Math.ceil(totalItems.value / normalizedPageSize),
  );
  const pageNumbers = computed(() => {
    const length = totalPages.value;
    const pages: number[] = [];
    for (let pageNumber = FIRST_PAGE; pageNumber <= length; pageNumber += 1) {
      pages.push(pageNumber);
    }
    return pages;
  });
  const itemsForCurrentPage = computed(() => {
    const startIndex = (currentPage.value - FIRST_PAGE) * normalizedPageSize;
    return items.value.slice(startIndex, startIndex + normalizedPageSize);
  });
  const rangeStart = computed(() =>
    totalItems.value === 0 ? 0 : (currentPage.value - FIRST_PAGE) * normalizedPageSize + FIRST_PAGE,
  );
  const rangeEnd = computed(() =>
    totalItems.value === 0
      ? 0
      : Math.min(totalItems.value, rangeStart.value + normalizedPageSize - FIRST_PAGE),
  );

  return {
    totalItems,
    totalPages,
    pageNumbers,
    itemsForCurrentPage,
    rangeStart,
    rangeEnd,
    hasMultiplePages: computed(() => totalPages.value > FIRST_PAGE),
  };
}

function registerPaginationWatchers(
  currentPage: Ref<number>,
  totalPages: ComputedRef<number>,
  resetSources: readonly WatchSource[],
): void {
  watch(totalPages, (nextTotalPages) => {
    if (currentPage.value > nextTotalPages) {
      currentPage.value = nextTotalPages;
    }
  });

  if (resetSources.length > 0) {
    watch([...resetSources], () => {
      currentPage.value = FIRST_PAGE;
    });
  }
}

/**
 * Reactive pagination state derived from a computed item collection.
 */
export interface PaginationState<T> {
  currentPage: Ref<number>;
  totalPages: ComputedRef<number>;
  pageNumbers: ComputedRef<readonly number[]>;
  totalItems: ComputedRef<number>;
  rangeStart: ComputedRef<number>;
  rangeEnd: ComputedRef<number>;
  hasMultiplePages: ComputedRef<boolean>;
  items: ComputedRef<readonly T[]>;
  goToPage: (page: number) => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
}

/**
 * Build deterministic pagination state for a computed list.
 *
 * @param items Reactive list source.
 * @param pageSize Number of items per page.
 * @param resetSources Reactive sources that reset to page 1 when changed.
 * @returns Reactive pagination values and navigation helpers.
 */
export function usePagination<T>(
  items: ComputedRef<readonly T[]>,
  pageSize: number,
  resetSources: readonly WatchSource[] = [],
): PaginationState<T> {
  const normalizedPageSize = Math.max(MIN_PAGE_SIZE, Math.trunc(pageSize));
  const currentPage = ref(FIRST_PAGE);
  const computedState = createPaginationComputeds(items, currentPage, normalizedPageSize);

  const goToPage = (page: number): void => {
    currentPage.value = clampToRange(page, FIRST_PAGE, computedState.totalPages.value);
  };
  const goToPreviousPage = (): void => {
    goToPage(currentPage.value - FIRST_PAGE);
  };
  const goToNextPage = (): void => {
    goToPage(currentPage.value + FIRST_PAGE);
  };

  registerPaginationWatchers(currentPage, computedState.totalPages, resetSources);

  return {
    currentPage,
    totalPages: computedState.totalPages,
    pageNumbers: computedState.pageNumbers,
    totalItems: computedState.totalItems,
    rangeStart: computedState.rangeStart,
    rangeEnd: computedState.rangeEnd,
    hasMultiplePages: computedState.hasMultiplePages,
    items: computedState.itemsForCurrentPage,
    goToPage,
    goToPreviousPage,
    goToNextPage,
  };
}
