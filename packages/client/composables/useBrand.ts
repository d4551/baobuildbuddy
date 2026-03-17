import { computed, readonly } from "vue";
import type { BrandSettings } from "@bao/shared";
import { resolveBrandSettings } from "@bao/shared";
import { useSettings } from "./useSettings";

function toFontCssVars(brand: BrandSettings): Record<string, string> {
  return {
    "--brand-font-display": brand.typography.displayFontFamily,
    "--brand-font-body": brand.typography.bodyFontFamily,
    "--brand-font-mono": brand.typography.monoFontFamily,
  };
}

function toLightThemeCssVars(brand: BrandSettings): Record<string, string> {
  return {
    "--bao-light-base-100": brand.lightTheme.base100,
    "--bao-light-base-200": brand.lightTheme.base200,
    "--bao-light-base-300": brand.lightTheme.base300,
    "--bao-light-base-content": brand.lightTheme.baseContent,
    "--bao-light-primary": brand.lightTheme.primary,
    "--bao-light-primary-content": brand.lightTheme.primaryContent,
    "--bao-light-secondary": brand.lightTheme.secondary,
    "--bao-light-secondary-content": brand.lightTheme.secondaryContent,
    "--bao-light-accent": brand.lightTheme.accent,
    "--bao-light-accent-content": brand.lightTheme.accentContent,
    "--bao-light-neutral": brand.lightTheme.neutral,
    "--bao-light-neutral-content": brand.lightTheme.neutralContent,
    "--bao-light-info": brand.lightTheme.info,
    "--bao-light-info-content": brand.lightTheme.infoContent,
    "--bao-light-success": brand.lightTheme.success,
    "--bao-light-success-content": brand.lightTheme.successContent,
    "--bao-light-warning": brand.lightTheme.warning,
    "--bao-light-warning-content": brand.lightTheme.warningContent,
    "--bao-light-error": brand.lightTheme.error,
    "--bao-light-error-content": brand.lightTheme.errorContent,
    "--bao-light-radius-selector": brand.lightTheme.radiusSelector,
    "--bao-light-radius-field": brand.lightTheme.radiusField,
    "--bao-light-radius-box": brand.lightTheme.radiusBox,
    "--bao-light-size-selector": brand.lightTheme.sizeSelector,
    "--bao-light-size-field": brand.lightTheme.sizeField,
    "--bao-light-border-size": brand.lightTheme.border,
    "--bao-light-depth": brand.lightTheme.depth,
    "--bao-light-noise": brand.lightTheme.noise,
  };
}

function toDarkThemeCssVars(brand: BrandSettings): Record<string, string> {
  return {
    "--bao-dark-base-100": brand.darkTheme.base100,
    "--bao-dark-base-200": brand.darkTheme.base200,
    "--bao-dark-base-300": brand.darkTheme.base300,
    "--bao-dark-base-content": brand.darkTheme.baseContent,
    "--bao-dark-primary": brand.darkTheme.primary,
    "--bao-dark-primary-content": brand.darkTheme.primaryContent,
    "--bao-dark-secondary": brand.darkTheme.secondary,
    "--bao-dark-secondary-content": brand.darkTheme.secondaryContent,
    "--bao-dark-accent": brand.darkTheme.accent,
    "--bao-dark-accent-content": brand.darkTheme.accentContent,
    "--bao-dark-neutral": brand.darkTheme.neutral,
    "--bao-dark-neutral-content": brand.darkTheme.neutralContent,
    "--bao-dark-info": brand.darkTheme.info,
    "--bao-dark-info-content": brand.darkTheme.infoContent,
    "--bao-dark-success": brand.darkTheme.success,
    "--bao-dark-success-content": brand.darkTheme.successContent,
    "--bao-dark-warning": brand.darkTheme.warning,
    "--bao-dark-warning-content": brand.darkTheme.warningContent,
    "--bao-dark-error": brand.darkTheme.error,
    "--bao-dark-error-content": brand.darkTheme.errorContent,
    "--bao-dark-radius-selector": brand.darkTheme.radiusSelector,
    "--bao-dark-radius-field": brand.darkTheme.radiusField,
    "--bao-dark-radius-box": brand.darkTheme.radiusBox,
    "--bao-dark-size-selector": brand.darkTheme.sizeSelector,
    "--bao-dark-size-field": brand.darkTheme.sizeField,
    "--bao-dark-border-size": brand.darkTheme.border,
    "--bao-dark-depth": brand.darkTheme.depth,
    "--bao-dark-noise": brand.darkTheme.noise,
  };
}

function toBrandCssVars(brand: BrandSettings): Record<string, string> {
  return {
    ...toFontCssVars(brand),
    ...toLightThemeCssVars(brand),
    ...toDarkThemeCssVars(brand),
  };
}

/**
 * Resolves persisted brand settings and runtime CSS variables for the app shell.
 *
 * @returns White-label brand settings and CSS variable map.
 */
export function useBrand() {
  const { settings } = useSettings();

  const resolvedBrand = computed(() => resolveBrandSettings(settings.value?.brandSettings));
  const brandCssVars = computed(() => toBrandCssVars(resolvedBrand.value));

  return {
    resolvedBrand: readonly(resolvedBrand),
    brandCssVars: readonly(brandCssVars),
  };
}
