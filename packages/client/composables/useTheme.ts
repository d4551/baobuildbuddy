import {
  type AppDataTheme,
  normalizeAppDataTheme,
  THEME_NAMES,
} from "@bao/shared/constants/branding";
import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import { readonly } from "vue";
import { useCookie, useState } from "#imports";
const NUM_365 = 365;

/**
 * Theme toggle: daisyUI `corporate` (light) / `business` (dark), driven by `data-theme`.
 * Persists via cookie (SSOT with settings sync).
 */
export function useTheme() {
  const theme = useState<AppDataTheme>(STATE_KEYS.APP_THEME, () => THEME_NAMES.light);
  const themeCookie = useCookie<string | null>(THEME_NAMES.storageKey, {
    default: () => null,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * NUM_365,
  });

  function setTheme(newTheme: AppDataTheme, options: { persist?: boolean } = {}) {
    theme.value = newTheme;
    if (import.meta.client) {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
    if (options.persist !== false) {
      themeCookie.value = newTheme;
    }
  }

  function toggleTheme() {
    setTheme(theme.value === THEME_NAMES.light ? THEME_NAMES.dark : THEME_NAMES.light);
  }

  function initTheme(preferredTheme?: AppDataTheme) {
    // Settings are the persisted SSOT; cookie is a hydration cache only.
    // Never apply prefers-color-scheme here — that diverges SSR vs client first paint
    // (hydration mismatch on auth-shell / first visit without cookie).
    if (preferredTheme) {
      setTheme(preferredTheme, { persist: true });
      return;
    }

    const savedRaw = themeCookie.value;
    if (savedRaw) {
      const normalized = normalizeAppDataTheme(savedRaw);
      setTheme(normalized, { persist: normalized !== savedRaw });
    }
  }

  /**
   * Post-hydrate only: honor OS dark preference when user has no cookie yet.
   * Safe after hydration — does not run during setup/SSR.
   */
  function applySystemThemePreferenceIfUnset(): void {
    if (!import.meta.client) return;
    if (themeCookie.value) return;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme(THEME_NAMES.dark, { persist: false });
    }
  }

  return {
    theme: readonly(theme),
    setTheme,
    toggleTheme,
    initTheme,
    applySystemThemePreferenceIfUnset,
  };
}
