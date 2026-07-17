import { resolveBrandSettings, THEME_NAMES } from "@bao/shared/constants/branding";
import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import type { AppSettings, BrandSettings, BrandThemePalette } from "@bao/shared/types/settings-contracts";
import { computed, readonly } from "vue";
import { useNuxtState } from "./nuxtRuntime";
import { useTheme } from "./useTheme";

function toFontCssVars(brand: BrandSettings): Record<string, string> {
  return {
    "--brand-font-display": brand.typography.displayFontFamily,
    "--brand-font-body": brand.typography.bodyFontFamily,
    "--brand-font-mono": brand.typography.monoFontFamily,
  };
}

/**
 * Maps a brand palette to daisyUI v5 semantic color/size tokens for the active `data-theme`.
 */
function toDaisySemanticColorVars(palette: BrandThemePalette): Record<string, string> {
  return {
    "--color-base-100": palette.base100,
    "--color-base-200": palette.base200,
    "--color-base-300": palette.base300,
    "--color-base-content": palette.baseContent,
    "--color-primary": palette.primary,
    "--color-primary-content": palette.primaryContent,
    "--color-secondary": palette.secondary,
    "--color-secondary-content": palette.secondaryContent,
    "--color-accent": palette.accent,
    "--color-accent-content": palette.accentContent,
    "--color-neutral": palette.neutral,
    "--color-neutral-content": palette.neutralContent,
    "--color-info": palette.info,
    "--color-info-content": palette.infoContent,
    "--color-success": palette.success,
    "--color-success-content": palette.successContent,
    "--color-warning": palette.warning,
    "--color-warning-content": palette.warningContent,
    "--color-error": palette.error,
    "--color-error-content": palette.errorContent,
    "--radius-selector": palette.radiusSelector,
    "--radius-field": palette.radiusField,
    "--radius-box": palette.radiusBox,
    "--size-selector": palette.sizeSelector,
    "--size-field": palette.sizeField,
    "--border": palette.border,
    "--depth": palette.depth,
    "--noise": palette.noise,
  };
}

/**
 * Resolves persisted brand settings and derived CSS variables.
 * Document CSS application is owned exclusively by `plugins/brand-css.client.ts`.
 *
 * Reads the shared settings state key directly so it is safe outside Vue component
 * setup (Nuxt plugins) without pulling `useI18n` via `useSettings`.
 *
 * @returns White-label brand settings and CSS var map (read-only).
 */
export function useBrand() {
  const settings = useNuxtState<AppSettings | null>(STATE_KEYS.APP_SETTINGS, () => null);
  const { theme } = useTheme();

  const resolvedBrand = computed(() => resolveBrandSettings(settings.value?.brandSettings));
  const brandCssVars = computed(() => {
    const brand = resolvedBrand.value;
    const palette = theme.value === THEME_NAMES.dark ? brand.darkTheme : brand.lightTheme;
    return {
      ...toFontCssVars(brand),
      ...toDaisySemanticColorVars(palette),
    };
  });

  return {
    resolvedBrand: readonly(resolvedBrand),
    brandCssVars: readonly(brandCssVars),
  };
}
