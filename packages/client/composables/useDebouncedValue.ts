import type { Ref } from "vue";
import { onScopeDispose, ref, watch } from "vue";

/**
 * Returns a debounced mirror of a source ref value.
 *
 * @param source Source reactive value to debounce.
 * @param delayMs Debounce duration in milliseconds.
 * @returns Debounced ref that updates after the provided delay.
 */
export function useDebouncedValue<T>(
  source: Readonly<Ref<T>>,
  delayMs: number,
): Ref<T> {
  const debouncedValue = ref(source.value) as Ref<T>;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  watch(
    source,
    (nextValue) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        debouncedValue.value = nextValue;
        timeoutId = null;
      }, delayMs);
    },
    { deep: true },
  );

  onScopeDispose(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });

  return debouncedValue;
}
