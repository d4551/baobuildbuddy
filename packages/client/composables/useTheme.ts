import {
  THEME_NAMES,
  normalizeAppDataTheme,
  type AppDataTheme,
} from "@bao/shared/constants/branding";
import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import { readonly } from "vue";
import { useCookie, useState } from "#imports";

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
    maxAge: 60 * 60 * 24 * 365,
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
    if (preferredTheme) {
      setTheme(preferredTheme, { persist: true });
      return;
    }

    const savedRaw = themeCookie.value;
    if (savedRaw) {
      const normalized = normalizeAppDataTheme(savedRaw);
      setTheme(normalized, { persist: normalized !== savedRaw });
      return;
    }

    if (import.meta.client && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme(THEME_NAMES.dark, { persist: false });
    }
  }

  return {
    theme: readonly(theme),
    setTheme,
    toggleTheme,
    initTheme,
  };
}
