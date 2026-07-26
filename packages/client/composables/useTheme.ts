import {
  type AppDataTheme,
  normalizeAppDataTheme,
  THEME_NAMES,
} from "@bao/shared/constants/branding";
import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import { SECONDS_PER_DAY } from "@bao/shared/constants/time";
import { readonly } from "vue";
import { useCookie, useState } from "#imports";
import { THEME_COOKIE_MAX_AGE_DAYS } from "~/constants/numeric-ui";

/**
 * Theme toggle: daisyUI `corporate` (light) / `business` (dark), driven by `data-theme`.
 * Persists via cookie (SSOT with settings sync).
 *
 * `data-theme` is rendered onto `<html>` by `app.vue`'s `useHead` — the single owner.
 * Never re-declare `data-theme` on a descendant: a nested `[data-theme=…]` match re-applies
 * daisyUI's stock palette and discards the brand palette that `plugins/brand-css.client.ts`
 * sets on `documentElement` (rules on an element beat inherited custom properties).
 * `scripts/validate-theme-attribute-ownership.ts` enforces this.
 */
export function useTheme() {
  const themeCookie = useCookie<string | null>(THEME_NAMES.storageKey, {
    default: () => null,
    path: "/",
    sameSite: "lax",
    maxAge: SECONDS_PER_DAY * THEME_COOKIE_MAX_AGE_DAYS,
  });
  // Seeded from the cookie so server-rendered markup already carries the right theme.
  const theme = useState<AppDataTheme>(STATE_KEYS.APP_THEME, () =>
    themeCookie.value ? normalizeAppDataTheme(themeCookie.value) : THEME_NAMES.light,
  );

  function setTheme(newTheme: AppDataTheme, options: { persist?: boolean } = {}) {
    theme.value = newTheme;
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
