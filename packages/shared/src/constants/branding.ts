import type { BrandSettings, BrandSettingsPatch, BrandThemePalette } from "../types/settings";

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
 * daisyUI theme names registered in `packages/client/assets/css/main.css`
 * (`corporate` default light, `business` prefers-dark).
 */
export type AppDataTheme = "corporate" | "business";

/**
 * Canonical client theme identifiers (matches `data-theme` values).
 */
export const THEME_NAMES = {
  light: "corporate",
  dark: "business",
  storageKey: "bao-theme",
} as const;

const PREVIOUS_DARK_THEME_ALIASES = new Set<string>(["bao-dark", THEME_NAMES.dark]);
const PREVIOUS_LIGHT_THEME_ALIASES = new Set<string>(["bao-light", THEME_NAMES.light]);

/**
 * Maps persisted theme strings (including previous `bao-*` ids) to daisyUI theme ids.
 */
export function normalizeAppDataTheme(value: string | null | undefined): AppDataTheme {
  const trimmed = value?.trim();
  if (trimmed && PREVIOUS_DARK_THEME_ALIASES.has(trimmed)) {
    return THEME_NAMES.dark;
  }
  if (trimmed && PREVIOUS_LIGHT_THEME_ALIASES.has(trimmed)) {
    return THEME_NAMES.light;
  }
  return THEME_NAMES.light;
}

/**
 * Default light brand palette used when no white-label override exists.
 */
export const DEFAULT_BRAND_LIGHT_THEME: BrandThemePalette = {
  base100: "oklch(99% 0.005 255)",
  base200: "oklch(96% 0.008 255)",
  base300: "oklch(92% 0.012 255)",
  baseContent: "oklch(22% 0.025 255)",
  primary: "oklch(42% 0.17 260)",
  primaryContent: "oklch(98% 0.01 260)",
  secondary: "oklch(40% 0.11 210)",
  secondaryContent: "oklch(98% 0.01 210)",
  accent: "oklch(45% 0.13 150)",
  accentContent: "oklch(98% 0.01 150)",
  neutral: "oklch(30% 0.02 260)",
  neutralContent: "oklch(95% 0.01 260)",
  info: "oklch(44% 0.13 240)",
  infoContent: "oklch(98% 0.01 240)",
  success: "oklch(44% 0.12 155)",
  successContent: "oklch(98% 0.01 155)",
  warning: "oklch(78% 0.15 90)",
  warningContent: "oklch(18% 0.035 90)",
  error: "oklch(45% 0.16 30)",
  errorContent: "oklch(98% 0.01 30)",
  radiusSelector: "0.5rem",
  radiusField: "0.5rem",
  radiusBox: "1rem",
  sizeSelector: "0.25rem",
  sizeField: "0.25rem",
  border: "1px",
  depth: "1",
  noise: "0",
};

/**
 * Default dark brand palette used when no white-label override exists.
 */
export const DEFAULT_BRAND_DARK_THEME: BrandThemePalette = {
  base100: "oklch(14% 0.02 260)",
  base200: "oklch(11% 0.024 260)",
  base300: "oklch(8% 0.028 260)",
  baseContent: "oklch(95% 0.015 260)",
  primary: "oklch(72% 0.16 260)",
  primaryContent: "oklch(16% 0.02 260)",
  secondary: "oklch(70% 0.11 210)",
  secondaryContent: "oklch(16% 0.02 210)",
  accent: "oklch(74% 0.13 150)",
  accentContent: "oklch(16% 0.02 150)",
  neutral: "oklch(26% 0.02 260)",
  neutralContent: "oklch(92% 0.01 260)",
  info: "oklch(72% 0.12 240)",
  infoContent: "oklch(15% 0.02 240)",
  success: "oklch(74% 0.12 155)",
  successContent: "oklch(15% 0.02 155)",
  warning: "oklch(82% 0.14 90)",
  warningContent: "oklch(15% 0.03 90)",
  error: "oklch(72% 0.15 30)",
  errorContent: "oklch(15% 0.03 30)",
  radiusSelector: "0.5rem",
  radiusField: "0.5rem",
  radiusBox: "1rem",
  sizeSelector: "0.25rem",
  sizeField: "0.25rem",
  border: "1px",
  depth: "1",
  noise: "1",
};

/**
 * Default white-label brand settings.
 */
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  name: APP_BRAND.name,
  assistantName: APP_BRAND.assistantName,
  apiName: APP_BRAND.apiName,
  logoPath: APP_BRAND.logoPath,
  faviconPath: APP_BRAND.logoPath,
  typography: {
    fontStylesheetUrl: "",
    displayFontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif',
    bodyFontFamily: '"DM Sans", "Inter", "Segoe UI", sans-serif',
    monoFontFamily:
      '"JetBrains Mono", "SFMono-Regular", "SF Mono", Consolas, "Liberation Mono", monospace',
  },
  lightTheme: DEFAULT_BRAND_LIGHT_THEME,
  darkTheme: DEFAULT_BRAND_DARK_THEME,
  content: {
    tagline: "Career OS for Game Industry Hiring",
    defaultTitle: "Career OS for Game Industry Hiring",
    defaultDescription:
      "Plan applications, tailor resumes, prep interviews, and run job-search automation from one workspace built for game industry hiring.",
    contentOverrides: {},
  },
};

function mergeBrandThemePalette(
  base: BrandThemePalette,
  override: Partial<BrandThemePalette> | undefined,
): BrandThemePalette {
  return {
    ...base,
    ...override,
  };
}

/**
 * Merges a partial white-label override onto a base brand configuration.
 *
 * @param base Base brand configuration.
 * @param override Partial override payload.
 * @returns Fully resolved brand settings.
 */
export function mergeBrandSettings(
  base: BrandSettings,
  override: BrandSettingsPatch | null | undefined,
): BrandSettings {
  if (!override) {
    return {
      ...base,
      typography: { ...base.typography },
      content: {
        ...base.content,
        contentOverrides: { ...base.content.contentOverrides },
      },
      lightTheme: { ...base.lightTheme },
      darkTheme: { ...base.darkTheme },
    };
  }

  return {
    ...base,
    ...override,
    typography: {
      ...base.typography,
      ...override.typography,
    },
    content: {
      ...base.content,
      ...override.content,
      contentOverrides: {
        ...base.content.contentOverrides,
        ...override.content?.contentOverrides,
      },
    },
    lightTheme: mergeBrandThemePalette(base.lightTheme, override.lightTheme),
    darkTheme: mergeBrandThemePalette(base.darkTheme, override.darkTheme),
  };
}

/**
 * Resolves any partial brand payload into the canonical white-label settings object.
 *
 * @param override Partial override payload.
 * @returns Fully resolved brand settings.
 */
export function resolveBrandSettings(
  override: BrandSettingsPatch | null | undefined,
): BrandSettings {
  return mergeBrandSettings(DEFAULT_BRAND_SETTINGS, override);
}
