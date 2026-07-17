import { watchEffect } from "vue";

/**
 * Single owner for brand CSS variables on `documentElement`.
 * `useBrand()` is read-only for consumers; this plugin applies vars once.
 */
export default defineNuxtPlugin(() => {
  const { brandCssVars } = useBrand();

  watchEffect((onCleanup) => {
    const nextVars = brandCssVars.value;
    const root = document.documentElement;
    const appliedEntries = Object.entries(nextVars).map(
      ([key, value]) => [key, typeof value === "string" ? value : String(value)] as const,
    );
    for (const [key, value] of appliedEntries) {
      root.style.setProperty(key, value);
    }
    onCleanup(() => {
      for (const [key] of appliedEntries) {
        root.style.removeProperty(key);
      }
    });
  });
});
