import { computed, ref, watch } from "vue";
import type { ComputedRef, Ref, WatchSource } from "vue";

const FIRST_PAGE = 1;
const MIN_PAGE_SIZE = 1;

function clampToRange(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
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

  const totalItems = computed(() => items.value.length);
  const totalPages = computed(() => {
    if (totalItems.value === 0) return FIRST_PAGE;
    return Math.ceil(totalItems.value / normalizedPageSize);
  });

  const pageNumbers = computed(() =>
    Array.from({ length: totalPages.value }, (_, index) => index + FIRST_PAGE),
  );

  const itemsForCurrentPage = computed(() => {
    const startIndex = (currentPage.value - FIRST_PAGE) * normalizedPageSize;
    const endIndex = startIndex + normalizedPageSize;
    return items.value.slice(startIndex, endIndex);
  });

  const rangeStart = computed(() => {
    if (totalItems.value === 0) return 0;
    return (currentPage.value - FIRST_PAGE) * normalizedPageSize + FIRST_PAGE;
  });

  const rangeEnd = computed(() => {
    if (totalItems.value === 0) return 0;
    return Math.min(totalItems.value, rangeStart.value + normalizedPageSize - FIRST_PAGE);
  });

  const hasMultiplePages = computed(() => totalPages.value > FIRST_PAGE);

  function goToPage(page: number): void {
    currentPage.value = clampToRange(page, FIRST_PAGE, totalPages.value);
  }

  function goToPreviousPage(): void {
    goToPage(currentPage.value - FIRST_PAGE);
  }

  function goToNextPage(): void {
    goToPage(currentPage.value + FIRST_PAGE);
  }

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

  return {
    currentPage,
    totalPages,
    pageNumbers,
    totalItems,
    rangeStart,
    rangeEnd,
    hasMultiplePages,
    items: itemsForCurrentPage,
    goToPage,
    goToPreviousPage,
    goToNextPage,
  };
}
