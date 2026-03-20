import type { AppDataTheme } from "@bao/shared";
import { STATE_KEYS, THEME_NAMES, normalizeAppDataTheme } from "@bao/shared";
import { useState } from "#imports";
import { readonly } from "vue";

/**
 * Theme toggle: daisyUI `corporate` (light) / `business` (dark), driven by `data-theme`.
 * Persists to localStorage and stays aligned with settings on the server.
 */
export function useTheme() {
  const theme = useState<AppDataTheme>(STATE_KEYS.APP_THEME, () => THEME_NAMES.light);

  function setTheme(newTheme: AppDataTheme, options: { persistLocal?: boolean } = {}) {
    theme.value = newTheme;
    if (import.meta.client) {
      document.documentElement.setAttribute("data-theme", newTheme);
      if (options.persistLocal !== false) {
        localStorage.setItem(THEME_NAMES.storageKey, newTheme);
      }
    }
  }

  function toggleTheme() {
    setTheme(theme.value === THEME_NAMES.light ? THEME_NAMES.dark : THEME_NAMES.light);
  }

  function initTheme(preferredTheme?: AppDataTheme) {
    if (import.meta.client) {
      const savedRaw = localStorage.getItem(THEME_NAMES.storageKey);
      if (savedRaw) {
        const normalized = normalizeAppDataTheme(savedRaw);
        setTheme(normalized, { persistLocal: normalized !== savedRaw });
      } else if (preferredTheme) {
        setTheme(preferredTheme, { persistLocal: false });
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme(THEME_NAMES.dark, { persistLocal: false });
      }
    } else if (preferredTheme) {
      theme.value = preferredTheme;
    }
  }

  return {
    theme: readonly(theme),
    setTheme,
    toggleTheme,
    initTheme,
  };
}
