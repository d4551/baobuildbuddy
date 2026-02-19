import { STATE_KEYS, THEME_NAMES } from "@navi/shared";

/**
 * Theme toggle composable for bao-light / bao-dark.
 */
export function useTheme() {
  const theme = useState<"bao-light" | "bao-dark">(STATE_KEYS.APP_THEME, () => THEME_NAMES.light);

  function applyTheme(newTheme: "bao-light" | "bao-dark") {
    theme.value = newTheme;
    if (import.meta.client) {
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem(THEME_NAMES.storageKey, newTheme);
    }
  }

  function toggleTheme() {
    applyTheme(theme.value === THEME_NAMES.light ? THEME_NAMES.dark : THEME_NAMES.light);
  }

  function initTheme() {
    if (import.meta.client) {
      const saved = localStorage.getItem(THEME_NAMES.storageKey) as "bao-light" | "bao-dark" | null;
      // Backward compatibility for legacy key after rebrand.
      const legacySaved = localStorage.getItem(THEME_NAMES.legacyStorageKey) as
        | typeof THEME_NAMES.legacyLight
        | typeof THEME_NAMES.legacyDark
        | null;
      if (saved) {
        applyTheme(saved);
      } else if (legacySaved) {
        applyTheme(legacySaved === THEME_NAMES.legacyDark ? THEME_NAMES.dark : THEME_NAMES.light);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        applyTheme(THEME_NAMES.dark);
      }
    }
  }

  return {
    theme: readonly(theme),
    toggleTheme,
    initTheme,
  };
}
