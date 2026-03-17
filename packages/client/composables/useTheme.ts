import { STATE_KEYS, THEME_NAMES } from "@bao/shared";

/**
 * Theme toggle composable for bao-light / bao-dark.
 */
export function useTheme() {
  const theme = useState<"bao-light" | "bao-dark">(STATE_KEYS.APP_THEME, () => THEME_NAMES.light);

  function setTheme(newTheme: "bao-light" | "bao-dark", options: { persistLocal?: boolean } = {}) {
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

  function initTheme(preferredTheme?: "bao-light" | "bao-dark") {
    if (import.meta.client) {
      const saved = localStorage.getItem(THEME_NAMES.storageKey) as "bao-light" | "bao-dark" | null;
      if (saved) {
        setTheme(saved, { persistLocal: false });
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
