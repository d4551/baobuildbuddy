import type {
  AppSettings,
  AutomationSettings,
  BrandSettings,
  EmailTransportSettings,
} from "@bao/shared";
import {
  AI_PROVIDER_DEFAULT,
  type AIProviderType,
  type AppLanguageCode,
  brandSettingsSchema,
  DEFAULT_APP_LANGUAGE,
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
} from "@bao/shared";
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAsyncData, useNuxtApp } from "#imports";
import type { SaveState } from "~/components/settings/save-state";
import { resolveAIRoutingPreference } from "~/utils/ai-control-plane";
import { useBrand } from "../useBrand";
import { useSettings } from "../useSettings";
import { useTheme } from "../useTheme";
import { useUser } from "../useUser";
import {
  assignAiRoutingDraft,
  createDefaultAiRoutingDraft,
  type AIRoutingDraft,
  type BrandEditorPanel,
  type ProviderTestState,
} from "./shared";

export type SettingsPageServices = ReturnType<typeof createSettingsPageServices>;
export type ProviderRuntimeState = ReturnType<typeof createSettingsPageProviderRuntimeState>;
export type SaveRuntimeState = ReturnType<typeof createSettingsPageSaveRuntimeState>;
export type BrandRuntimeState = ReturnType<typeof createSettingsPageBrandRuntimeState>;
export type ProfileRuntimeState = ReturnType<typeof createSettingsPageProfileRuntimeState>;

export function createSettingsPageServices() {
  const settingsApi = useSettings();
  const userApi = useUser();
  const brandState = useBrand();
  const themeState = useTheme();
  const nuxtApp = useNuxtApp();
  const i18n = useI18n();

  return {
    rawSettings: settingsApi.settings,
    fetchSettings: settingsApi.fetchSettings,
    updateSettings: settingsApi.updateSettings,
    updateApiKeys: settingsApi.updateApiKeys,
    testApiKey: settingsApi.testApiKey,
    settingsLoading: settingsApi.loading,
    providerDiagnostics: settingsApi.providerDiagnostics,
    profile: userApi.profile,
    fetchProfile: userApi.fetchProfile,
    updateProfile: userApi.updateProfile,
    profileLoading: userApi.loading,
    resolvedBrand: brandState.resolvedBrand,
    theme: themeState.theme,
    toggleTheme: themeState.toggleTheme,
    $toast: nuxtApp.$toast,
    t: i18n.t,
  };
}

export function createSettingsPageProviderRuntimeState() {
  return {
    apiKeys: reactive({
      geminiApiKey: "",
      openaiApiKey: "",
      claudeApiKey: "",
      huggingfaceToken: "",
      localModelEndpoint: LOCAL_AI_DEFAULT_ENDPOINT,
      localModelName: LOCAL_AI_DEFAULT_MODEL,
    }),
    testResults: reactive<Record<AIProviderType, ProviderTestState>>({
      local: null,
      gemini: null,
      openai: null,
      claude: null,
      huggingface: null,
    }),
    testingProvider: ref<AIProviderType | null>(null),
    preferencesLanguage: ref<AppLanguageCode>(DEFAULT_APP_LANGUAGE),
    preferredProviderSelection: ref<AIProviderType>(AI_PROVIDER_DEFAULT),
    emailTransportPasswordDraft: ref(""),
    aiRoutingDraft: reactive<AIRoutingDraft>(createDefaultAiRoutingDraft()),
  };
}

export function createSettingsPageSaveRuntimeState() {
  return {
    preferencesSaveState: ref<SaveState>("idle"),
    profileSaveState: ref<SaveState>("idle"),
    brandSaveState: ref<SaveState>("idle"),
    notificationForm: reactive({ ...DEFAULT_NOTIFICATION_PREFERENCES }),
    automationForm: reactive<AutomationSettings>({ ...DEFAULT_AUTOMATION_SETTINGS }),
    emailTransportForm: reactive<EmailTransportSettings>({
      ...DEFAULT_EMAIL_TRANSPORT_SETTINGS,
    }),
  };
}

export function createSettingsPageBrandRuntimeState() {
  const brandDefaults: BrandSettings = brandSettingsSchema.parse(DEFAULT_BRAND_SETTINGS);

  return {
    brandEditorPanel: ref<BrandEditorPanel>("identity"),
    brandDefaults,
    brandForm: reactive({
      name: brandDefaults.name,
      assistantName: brandDefaults.assistantName,
      apiName: brandDefaults.apiName,
      logoPath: brandDefaults.logoPath,
      faviconPath: brandDefaults.faviconPath,
      fontStylesheetUrl: brandDefaults.typography.fontStylesheetUrl,
      displayFontFamily: brandDefaults.typography.displayFontFamily,
      bodyFontFamily: brandDefaults.typography.bodyFontFamily,
      monoFontFamily: brandDefaults.typography.monoFontFamily,
      tagline: brandDefaults.content.tagline,
      defaultTitle: brandDefaults.content.defaultTitle,
      defaultDescription: brandDefaults.content.defaultDescription,
      lightThemeJson: JSON.stringify(brandDefaults.lightTheme, null, 2),
      darkThemeJson: JSON.stringify(brandDefaults.darkTheme, null, 2),
      contentOverridesJson: JSON.stringify(brandDefaults.content.contentOverrides, null, 2),
    }),
  };
}

export function createSettingsPageProfileRuntimeState() {
  return {
    profileForm: reactive({
      name: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
      summary: "",
      currentRole: "",
      currentCompany: "",
      yearsExperience: 0,
      technicalSkillsText: "",
      softSkillsText: "",
    }),
  };
}

export async function useSettingsPageBootstrap(services: SettingsPageServices) {
  return await useAsyncData("settings-bootstrap", async () => {
    await Promise.all([services.fetchSettings(), services.fetchProfile()]);
    return true;
  });
}

export function syncBrandForm(
  currentSettings: AppSettings,
  brandState: BrandRuntimeState,
) {
  const nextBrand = currentSettings.brandSettings ?? brandState.brandDefaults;
  brandState.brandForm.name = nextBrand.name;
  brandState.brandForm.assistantName = nextBrand.assistantName;
  brandState.brandForm.apiName = nextBrand.apiName;
  brandState.brandForm.logoPath = nextBrand.logoPath;
  brandState.brandForm.faviconPath = nextBrand.faviconPath;
  brandState.brandForm.fontStylesheetUrl = nextBrand.typography.fontStylesheetUrl;
  brandState.brandForm.displayFontFamily = nextBrand.typography.displayFontFamily;
  brandState.brandForm.bodyFontFamily = nextBrand.typography.bodyFontFamily;
  brandState.brandForm.monoFontFamily = nextBrand.typography.monoFontFamily;
  brandState.brandForm.tagline = nextBrand.content.tagline;
  brandState.brandForm.defaultTitle = nextBrand.content.defaultTitle;
  brandState.brandForm.defaultDescription = nextBrand.content.defaultDescription;
  brandState.brandForm.lightThemeJson = JSON.stringify(nextBrand.lightTheme, null, 2);
  brandState.brandForm.darkThemeJson = JSON.stringify(nextBrand.darkTheme, null, 2);
  brandState.brandForm.contentOverridesJson = JSON.stringify(
    nextBrand.content.contentOverrides,
    null,
    2,
  );
}

export function syncSettingsState(
  currentSettings: AppSettings,
  providerState: ProviderRuntimeState,
  saveState: SaveRuntimeState,
  brandState: BrandRuntimeState,
) {
  providerState.apiKeys.localModelEndpoint =
    currentSettings.localModelEndpoint || LOCAL_AI_DEFAULT_ENDPOINT;
  providerState.apiKeys.localModelName =
    currentSettings.localModelName || LOCAL_AI_DEFAULT_MODEL;
  providerState.preferencesLanguage.value = currentSettings.language || DEFAULT_APP_LANGUAGE;
  providerState.preferredProviderSelection.value = resolveAIRoutingPreference(
    currentSettings,
    "chat",
  ).provider;
  assignAiRoutingDraft(providerState.aiRoutingDraft, currentSettings.aiRouting);
  saveState.notificationForm.achievements = currentSettings.notifications?.achievements ?? true;
  saveState.notificationForm.dailyChallenges =
    currentSettings.notifications?.dailyChallenges ?? true;
  saveState.notificationForm.levelUp = currentSettings.notifications?.levelUp ?? true;
  saveState.notificationForm.jobAlerts = currentSettings.notifications?.jobAlerts ?? true;

  if (currentSettings.automationSettings) {
    Object.assign(saveState.automationForm, {
      ...DEFAULT_AUTOMATION_SETTINGS,
      ...currentSettings.automationSettings,
    });
  }

  Object.assign(saveState.emailTransportForm, {
    ...DEFAULT_EMAIL_TRANSPORT_SETTINGS,
    ...currentSettings.emailTransportSettings,
  });
  syncBrandForm(currentSettings, brandState);
}
