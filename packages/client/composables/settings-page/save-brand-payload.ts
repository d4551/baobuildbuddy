import { brandContentSettingsSchema, brandThemePaletteSchema, parseJson } from "@bao/shared";
import type { SettingsPageState } from "./state";

function buildBrandContentPayload(state: SettingsPageState) {
  return parseJson(
    JSON.stringify({
      tagline: state.brandForm.tagline.trim() || state.brandDefaults.content.tagline,
      defaultTitle: state.brandForm.defaultTitle.trim() || state.brandDefaults.content.defaultTitle,
      defaultDescription:
        state.brandForm.defaultDescription.trim() || state.brandDefaults.content.defaultDescription,
      contentOverrides: state.parseBrandContentOverrides(),
    }),
    brandContentSettingsSchema,
  );
}

function resolveBrandThemes(state: SettingsPageState) {
  const lightTheme = parseJson(state.brandForm.lightThemeJson, brandThemePaletteSchema);
  const darkTheme = parseJson(state.brandForm.darkThemeJson, brandThemePaletteSchema);
  if (!lightTheme) {
    state.$toast.error(state.t("settings.brand.errors.invalidLightTheme"));
    return null;
  }
  if (!darkTheme) {
    state.$toast.error(state.t("settings.brand.errors.invalidDarkTheme"));
    return null;
  }

  return { lightTheme, darkTheme };
}

export function buildBrandPayload(state: SettingsPageState) {
  const themes = resolveBrandThemes(state);
  if (!themes) {
    return null;
  }

  const contentCandidate = buildBrandContentPayload(state);
  if (!contentCandidate) {
    state.$toast.error(state.t("settings.brand.errors.invalidContentOverrides"));
    return null;
  }

  return {
    name: state.brandForm.name.trim() || state.brandDefaults.name,
    assistantName: state.brandForm.assistantName.trim() || state.brandDefaults.assistantName,
    apiName: state.brandForm.apiName.trim() || state.brandDefaults.apiName,
    logoPath: state.brandForm.logoPath.trim() || state.brandDefaults.logoPath,
    faviconPath: state.brandForm.faviconPath.trim() || state.brandDefaults.faviconPath,
    typography: {
      fontStylesheetUrl: state.brandForm.fontStylesheetUrl.trim(),
      displayFontFamily:
        state.brandForm.displayFontFamily.trim() ||
        state.brandDefaults.typography.displayFontFamily,
      bodyFontFamily:
        state.brandForm.bodyFontFamily.trim() || state.brandDefaults.typography.bodyFontFamily,
      monoFontFamily:
        state.brandForm.monoFontFamily.trim() || state.brandDefaults.typography.monoFontFamily,
    },
    lightTheme: themes.lightTheme,
    darkTheme: themes.darkTheme,
    content: contentCandidate,
  };
}
