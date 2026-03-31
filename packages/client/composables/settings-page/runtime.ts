import {
  AI_PROVIDER_DEFAULT,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
} from "@bao/shared/constants/ai-provider";
import { DEFAULT_BRAND_SETTINGS } from "@bao/shared/constants/branding";
import { DEFAULT_JOB_TAXONOMY_SETTINGS } from "@bao/shared/constants/jobs-taxonomy";
import { DEFAULT_APP_LANGUAGE, type AppLanguageCode } from "@bao/shared/constants/settings";
import { brandSettingsSchema } from "@bao/shared/schemas/settings.schema";
import type { AIProviderType } from "@bao/shared/types/ai";
import type { JobTaxonomySettings } from "@bao/shared/types/jobs-taxonomy";
import type {
  AppSettings,
  AutomationSettings,
  BrandSettings,
  EmailTransportSettings,
} from "@bao/shared/types/settings-contracts";
import {
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@bao/shared/types/settings-defaults";
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
    updateJobTaxonomy: settingsApi.updateJobTaxonomy,
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

function createDefaultNotificationForm() {
  return reactive({ ...DEFAULT_NOTIFICATION_PREFERENCES });
}

function createDefaultAutomationForm() {
  return reactive<AutomationSettings>({ ...DEFAULT_AUTOMATION_SETTINGS });
}

function createDefaultJobProviderForm() {
  return reactive({
    providerTimeoutMs: DEFAULT_AUTOMATION_SETTINGS.jobProviders.providerTimeoutMs,
    companyBoardResultLimit: DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardResultLimit,
    gamingBoardResultLimit: DEFAULT_AUTOMATION_SETTINGS.jobProviders.gamingBoardResultLimit,
    unknownLocationLabel: DEFAULT_AUTOMATION_SETTINGS.jobProviders.unknownLocationLabel,
    unknownCompanyLabel: DEFAULT_AUTOMATION_SETTINGS.jobProviders.unknownCompanyLabel,
    hitmarkerEnabled: DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerEnabled,
    hitmarkerApiBaseUrl: DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerApiBaseUrl,
    hitmarkerDefaultQuery: DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerDefaultQuery,
    hitmarkerDefaultLocation: DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerDefaultLocation,
    greenhouseApiBaseUrl: DEFAULT_AUTOMATION_SETTINGS.jobProviders.greenhouseApiBaseUrl,
    greenhouseMaxPages: DEFAULT_AUTOMATION_SETTINGS.jobProviders.greenhouseMaxPages,
    leverApiBaseUrl: DEFAULT_AUTOMATION_SETTINGS.jobProviders.leverApiBaseUrl,
    leverMaxPages: DEFAULT_AUTOMATION_SETTINGS.jobProviders.leverMaxPages,
    greenhouseBoardsJson: JSON.stringify(
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.greenhouseBoards,
      null,
      2,
    ),
    leverCompaniesJson: JSON.stringify(
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.leverCompanies,
      null,
      2,
    ),
    companyBoardsJson: JSON.stringify(
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoards,
      null,
      2,
    ),
    companyBoardApiTemplatesJson: JSON.stringify(
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates,
      null,
      2,
    ),
    gamingPortalsJson: JSON.stringify(
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.gamingPortals,
      null,
      2,
    ),
  });
}

function createDefaultJobTaxonomyForm() {
  return reactive({
    keywordsJson: JSON.stringify(DEFAULT_JOB_TAXONOMY_SETTINGS.keywords, null, 2),
    studioRulesJson: JSON.stringify(DEFAULT_JOB_TAXONOMY_SETTINGS.studioRules, null, 2),
  });
}

function createDefaultEmailTransportForm() {
  return reactive<EmailTransportSettings>({
    ...DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  });
}

export function createSettingsPageSaveRuntimeState() {
  return {
    preferencesSaveState: ref<SaveState>("idle"),
    profileSaveState: ref<SaveState>("idle"),
    brandSaveState: ref<SaveState>("idle"),
    jobProvidersSaveState: ref<SaveState>("idle"),
    jobTaxonomySaveState: ref<SaveState>("idle"),
    notificationForm: createDefaultNotificationForm(),
    automationForm: createDefaultAutomationForm(),
    jobProviderForm: createDefaultJobProviderForm(),
    jobTaxonomyForm: createDefaultJobTaxonomyForm(),
    emailTransportForm: createDefaultEmailTransportForm(),
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

export function syncBrandForm(currentSettings: AppSettings, brandState: BrandRuntimeState) {
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

function syncProviderSettingsState(
  currentSettings: AppSettings,
  providerState: ProviderRuntimeState,
) {
  providerState.apiKeys.localModelEndpoint =
    currentSettings.localModelEndpoint || LOCAL_AI_DEFAULT_ENDPOINT;
  providerState.apiKeys.localModelName = currentSettings.localModelName || LOCAL_AI_DEFAULT_MODEL;
  providerState.preferencesLanguage.value = currentSettings.language || DEFAULT_APP_LANGUAGE;
  providerState.preferredProviderSelection.value = resolveAIRoutingPreference(
    currentSettings,
    "chat",
  ).provider;
  assignAiRoutingDraft(providerState.aiRoutingDraft, currentSettings.aiRouting);
}

function syncNotificationSettingsState(currentSettings: AppSettings, saveState: SaveRuntimeState) {
  saveState.notificationForm.achievements = currentSettings.notifications?.achievements ?? true;
  saveState.notificationForm.dailyChallenges =
    currentSettings.notifications?.dailyChallenges ?? true;
  saveState.notificationForm.levelUp = currentSettings.notifications?.levelUp ?? true;
  saveState.notificationForm.jobAlerts = currentSettings.notifications?.jobAlerts ?? true;
}

function syncAutomationSettingsState(currentSettings: AppSettings, saveState: SaveRuntimeState) {
  if (!currentSettings.automationSettings) {
    return;
  }

  Object.assign(saveState.automationForm, {
    ...DEFAULT_AUTOMATION_SETTINGS,
    ...currentSettings.automationSettings,
  });
}

function syncJobProviderSettingsState(currentSettings: AppSettings, saveState: SaveRuntimeState) {
  if (!currentSettings.automationSettings) {
    return;
  }

  const { jobProviders } = currentSettings.automationSettings;
  Object.assign(saveState.jobProviderForm, {
    providerTimeoutMs: jobProviders.providerTimeoutMs,
    companyBoardResultLimit: jobProviders.companyBoardResultLimit,
    gamingBoardResultLimit: jobProviders.gamingBoardResultLimit,
    unknownLocationLabel: jobProviders.unknownLocationLabel,
    unknownCompanyLabel: jobProviders.unknownCompanyLabel,
    hitmarkerEnabled: jobProviders.hitmarkerEnabled,
    hitmarkerApiBaseUrl: jobProviders.hitmarkerApiBaseUrl,
    hitmarkerDefaultQuery: jobProviders.hitmarkerDefaultQuery,
    hitmarkerDefaultLocation: jobProviders.hitmarkerDefaultLocation,
    greenhouseApiBaseUrl: jobProviders.greenhouseApiBaseUrl,
    greenhouseMaxPages: jobProviders.greenhouseMaxPages,
    leverApiBaseUrl: jobProviders.leverApiBaseUrl,
    leverMaxPages: jobProviders.leverMaxPages,
    greenhouseBoardsJson: JSON.stringify(jobProviders.greenhouseBoards, null, 2),
    leverCompaniesJson: JSON.stringify(jobProviders.leverCompanies, null, 2),
    companyBoardsJson: JSON.stringify(jobProviders.companyBoards, null, 2),
    companyBoardApiTemplatesJson: JSON.stringify(jobProviders.companyBoardApiTemplates, null, 2),
    gamingPortalsJson: JSON.stringify(jobProviders.gamingPortals, null, 2),
  });
}

function syncJobTaxonomySettingsState(currentSettings: AppSettings, saveState: SaveRuntimeState) {
  const jobTaxonomy: JobTaxonomySettings =
    currentSettings.jobTaxonomy ?? DEFAULT_JOB_TAXONOMY_SETTINGS;
  saveState.jobTaxonomyForm.keywordsJson = JSON.stringify(jobTaxonomy.keywords, null, 2);
  saveState.jobTaxonomyForm.studioRulesJson = JSON.stringify(jobTaxonomy.studioRules, null, 2);
}

function syncEmailTransportSettingsState(
  currentSettings: AppSettings,
  saveState: SaveRuntimeState,
) {
  Object.assign(saveState.emailTransportForm, {
    ...DEFAULT_EMAIL_TRANSPORT_SETTINGS,
    ...currentSettings.emailTransportSettings,
  });
}

export function syncSettingsState(
  currentSettings: AppSettings,
  providerState: ProviderRuntimeState,
  saveState: SaveRuntimeState,
  brandState: BrandRuntimeState,
) {
  syncProviderSettingsState(currentSettings, providerState);
  syncNotificationSettingsState(currentSettings, saveState);
  syncAutomationSettingsState(currentSettings, saveState);
  syncJobProviderSettingsState(currentSettings, saveState);
  syncJobTaxonomySettingsState(currentSettings, saveState);
  syncEmailTransportSettingsState(currentSettings, saveState);
  syncBrandForm(currentSettings, brandState);
}
