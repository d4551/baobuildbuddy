export const APP_BRAND = {
  name: "BaoBuildBuddy",
  assistantName: "BaoBuildBuddy",
  apiName: "BaoBuildBuddy API",
} as const;

export const APP_SEO = {
  setupTitle: `${APP_BRAND.name} Setup`,
  setupDescription: `Configure your profile, local AI endpoint, and optional cloud providers for ${APP_BRAND.name}.`,
  chatTitle: `${APP_BRAND.name} AI Chat`,
  chatDescription: `Chat with ${APP_BRAND.assistantName} for gaming career advice on resumes, interviews, and job strategy.`,
} as const;

export const THEME_NAMES = {
  light: "bao-light",
  dark: "bao-dark",
  storageKey: "bao-theme",
  legacyStorageKey: "navi-theme",
  legacyLight: "navi-light",
  legacyDark: "navi-dark",
} as const;
