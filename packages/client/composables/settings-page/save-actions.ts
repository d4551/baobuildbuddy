import { brandContentSettingsSchema, brandThemePaletteSchema, DEFAULT_APP_LANGUAGE, isValidEmail, parseJson } from "@bao/shared";
import { parseDelimitedList, runStatefulSave, runToastTask } from "./shared";
import type { SettingsPageState } from "./state";

type ProfilePayload = Parameters<SettingsPageState["updateProfile"]>[0];

const PROFILE_OPTIONAL_FIELDS = [
  ["phone", "phone"],
  ["location", "location"],
  ["website", "website"],
  ["linkedin", "linkedin"],
  ["github", "github"],
  ["summary", "summary"],
  ["currentRole", "currentRole"],
  ["currentCompany", "currentCompany"],
] as const satisfies readonly (readonly [keyof SettingsPageState["profileForm"], keyof ProfilePayload])[];

function buildProfilePayload(state: SettingsPageState, name: string, email: string): ProfilePayload {
  const payload: ProfilePayload = {
    name,
    technicalSkills: parseDelimitedList(state.profileForm.technicalSkillsText),
    softSkills: parseDelimitedList(state.profileForm.softSkillsText),
    email,
  };

  for (const [formField, payloadField] of PROFILE_OPTIONAL_FIELDS) {
    const value = state.profileForm[formField];
    if (typeof value === "string") {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0) {
        payload[payloadField] = trimmedValue;
      }
    }
  }

  if (Number.isFinite(state.profileForm.yearsExperience)) {
    payload.yearsExperience = state.profileForm.yearsExperience;
  }

  return payload;
}

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

function createHandleToggleTheme(state: SettingsPageState) {
  return async () => {
    const nextTheme =
      state.theme.value === state.THEME_NAMES.light ? state.THEME_NAMES.dark : state.THEME_NAMES.light;
    state.toggleTheme();

    const savedTheme = await runToastTask(
      state.updateSettings({ theme: nextTheme }),
      state.t("settings.errors.failedToSaveTheme"),
      state.$toast,
    );
    if (savedTheme === null) {
      return;
    }

    state.$toast.success(state.t("settings.toasts.themeSaved"));
  };
}

function createHandleSavePreferences(state: SettingsPageState) {
  return async () =>
    await runStatefulSave({
      state: state.preferencesSaveState,
      task: state.updateSettings({
        language: state.preferencesLanguage.value || DEFAULT_APP_LANGUAGE,
        notifications: {
          achievements: state.notificationForm.achievements,
          dailyChallenges: state.notificationForm.dailyChallenges,
          levelUp: state.notificationForm.levelUp,
          jobAlerts: state.notificationForm.jobAlerts,
        },
      }),
      failureMessage: state.t("settings.errors.failedToSavePreferences"),
      successMessage: state.t("settings.toasts.preferencesSaved"),
      toast: state.$toast,
    });
}

function createHandleSaveProfile(state: SettingsPageState) {
  return async () => {
    const name = state.profileForm.name.trim();
    if (name.length < 2) {
      state.profileSaveState.value = "error";
      state.$toast.error(state.t("settings.errors.nameTooShort"));
      return;
    }

    const email = state.profileForm.email.trim();
    if (!isValidEmail(email)) {
      state.profileSaveState.value = "error";
      state.$toast.error(state.t("settings.errors.invalidEmail"));
      return;
    }

    await runStatefulSave({
      state: state.profileSaveState,
      task: state.updateProfile(buildProfilePayload(state, name, email)),
      failureMessage: state.t("settings.errors.failedToSaveProfile"),
      successMessage: state.t("settings.toasts.profileSaved"),
      toast: state.$toast,
    });
  };
}

function resolveBrandThemes(state: SettingsPageState) {
  const lightTheme = parseJson(state.brandForm.lightThemeJson, brandThemePaletteSchema);
  if (!lightTheme) {
    state.$toast.error(state.t("settings.brand.errors.invalidLightTheme"));
    return null;
  }

  const darkTheme = parseJson(state.brandForm.darkThemeJson, brandThemePaletteSchema);
  if (!darkTheme) {
    state.$toast.error(state.t("settings.brand.errors.invalidDarkTheme"));
    return null;
  }

  return { lightTheme, darkTheme };
}

function buildBrandPayload(state: SettingsPageState) {
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
        state.brandForm.displayFontFamily.trim() || state.brandDefaults.typography.displayFontFamily,
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

function createHandleSaveBrand(state: SettingsPageState) {
  return async () => {
    const brandPayload = buildBrandPayload(state);
    if (!brandPayload) {
      state.brandSaveState.value = "error";
      return;
    }

    await runStatefulSave({
      state: state.brandSaveState,
      task: state.updateSettings({ brandSettings: brandPayload }),
      failureMessage: state.t("settings.brand.errors.failedToSave"),
      successMessage: state.t("settings.toasts.brandSaved"),
      toast: state.$toast,
    });
  };
}

function createHandleSaveAutomation(state: SettingsPageState) {
  return async () => {
    const savedAutomation = await runToastTask(
      state.updateSettings({ automationSettings: { ...state.automationForm } }),
      state.t("settings.errors.failedToSaveAutomation"),
      state.$toast,
    );
    if (savedAutomation === null) {
      return;
    }

    state.$toast.success(state.t("settings.toasts.automationSaved"));
  };
}

function createHandleSaveEmailDeliverySettings(state: SettingsPageState) {
  return async () => {
    const senderEmail = state.emailTransportForm.fromEmail.trim();
    if (senderEmail.length > 0 && !isValidEmail(senderEmail)) {
      state.$toast.error(state.t("settings.errors.invalidEmailDeliverySender"));
      return;
    }

    const savedEmailDelivery = await runToastTask(
      state.updateSettings({
        emailTransportSettings: {
          ...state.emailTransportForm,
          host: state.emailTransportForm.host.trim(),
          username: state.emailTransportForm.username.trim(),
          fromEmail: senderEmail,
          fromName: state.emailTransportForm.fromName.trim(),
        },
      }),
      state.t("settings.errors.failedToSaveEmailDelivery"),
      state.$toast,
    );
    if (savedEmailDelivery === null) {
      return;
    }

    state.$toast.success(state.t("settings.toasts.emailDeliverySaved"));
  };
}

function createHandleSaveEmailDeliveryPassword(state: SettingsPageState) {
  return async () => {
    const savedPassword = await runToastTask(
      state.updateApiKeys({ emailTransportPassword: state.emailTransportPasswordDraft.value }),
      state.t("settings.errors.failedToSaveEmailDeliveryPassword"),
      state.$toast,
    );
    if (savedPassword === null) {
      return;
    }

    state.emailTransportPasswordDraft.value = "";
    state.$toast.success(state.t("settings.toasts.emailDeliveryPasswordSaved"));
  };
}

function createHandleClearEmailDeliveryPassword(state: SettingsPageState) {
  return async () => {
    const clearedPassword = await runToastTask(
      state.updateApiKeys({ emailTransportPassword: "" }),
      state.t("settings.errors.failedToSaveEmailDeliveryPassword"),
      state.$toast,
    );
    if (clearedPassword === null) {
      return;
    }

    state.emailTransportPasswordDraft.value = "";
    state.$toast.success(state.t("settings.toasts.emailDeliveryPasswordCleared"));
  };
}

export function createSettingsPageSaveActions(state: SettingsPageState) {
  const handleToggleTheme = createHandleToggleTheme(state);
  const handleSavePreferences = createHandleSavePreferences(state);
  const handleSaveProfile = createHandleSaveProfile(state);
  const handleSaveBrand = createHandleSaveBrand(state);
  const handleSaveAutomation = createHandleSaveAutomation(state);
  const handleSaveEmailDeliverySettings = createHandleSaveEmailDeliverySettings(state);
  const handleSaveEmailDeliveryPassword = createHandleSaveEmailDeliveryPassword(state);
  const handleClearEmailDeliveryPassword = createHandleClearEmailDeliveryPassword(state);

  return {
    handleToggleTheme,
    handleSavePreferences,
    handleSaveProfile,
    handleSaveBrand,
    handleSaveAutomation,
    handleSaveEmailDeliverySettings,
    handleSaveEmailDeliveryPassword,
    handleClearEmailDeliveryPassword,
  };
}
