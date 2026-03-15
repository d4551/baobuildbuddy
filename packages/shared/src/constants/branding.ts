/**
 * Canonical product-brand labels shared across client and server surfaces.
 */
export const APP_BRAND = {
  name: "BaoBuildBuddy",
  assistantName: "Bao",
  apiName: "BaoBuildBuddy API",
  logoPath: "/favicon.svg",
} as const;

/**
 * Shared SEO defaults for first-party product surfaces.
 */
export const APP_SEO = {
  setupTitle: `${APP_BRAND.name} Setup`,
  setupDescription: `Configure your profile, local AI, and provider fallbacks for a production-ready ${APP_BRAND.name} workspace.`,
  chatTitle: `${APP_BRAND.assistantName} Chat`,
  chatDescription: `Work with ${APP_BRAND.assistantName} on resume strategy, interview preparation, opportunity research, and application execution.`,
} as const;

/**
 * Canonical client theme identifiers.
 */
export const THEME_NAMES = {
  light: "bao-light",
  dark: "bao-dark",
  storageKey: "bao-theme",
} as const;
