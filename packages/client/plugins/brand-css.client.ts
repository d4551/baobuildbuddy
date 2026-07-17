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
    const appliedKeys = Object.keys(nextVars);
    for (const [key, value] of Object.entries(nextVars)) {
      root.style.setProperty(key, value);
    }
    onCleanup(() => {
      for (const key of appliedKeys) {
        root.style.removeProperty(key);
      }
    });
  });
});
