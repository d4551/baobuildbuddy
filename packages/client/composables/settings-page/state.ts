import type { AppSettings } from "@bao/shared";
import { THEME_NAMES } from "@bao/shared";
import { computed, watch, type Ref } from "vue";
import { toAppSettings } from "../api-normalizer-settings";
import { createSettingsPageDerivedState } from "./derived";
import { createSettingsPageOptionState } from "./options";
import {
  type BrandRuntimeState,
  createSettingsPageBrandRuntimeState,
  type ProfileRuntimeState,
  createSettingsPageProfileRuntimeState,
  type ProviderRuntimeState,
  createSettingsPageProviderRuntimeState,
  type SaveRuntimeState,
  createSettingsPageSaveRuntimeState,
  type SettingsPageServices,
  createSettingsPageServices,
  syncSettingsState,
  useSettingsPageBootstrap,
} from "./runtime";

type SettingsPageBootstrapState = Awaited<ReturnType<typeof useSettingsPageBootstrap>>;
type SettingsPageOptionState = ReturnType<typeof createSettingsPageOptionState>;
type SettingsPageDerivedState = ReturnType<typeof createSettingsPageDerivedState>;
type UserProfileSnapshot = {
  name: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  website?: string | null;
  linkedin?: string | null;
  github?: string | null;
  summary?: string | null;
  currentRole?: string | null;
  currentCompany?: string | null;
  yearsExperience?: number | null;
  technicalSkills: readonly string[];
  softSkills: readonly string[];
};

type WatcherSetupOptions = {
  settings: Readonly<Ref<AppSettings | null>>;
  profile: Readonly<Ref<UserProfileSnapshot | null | undefined>>;
  providerState: ProviderRuntimeState;
  saveState: SaveRuntimeState;
  brandState: BrandRuntimeState;
  profileState: ProfileRuntimeState;
};

type SettingsPageStateResultOptions = {
  services: SettingsPageServices;
  settings: { value: AppSettings | null };
  optionState: SettingsPageOptionState;
  providerState: ProviderRuntimeState;
  saveState: SaveRuntimeState;
  brandState: BrandRuntimeState;
  profileState: ProfileRuntimeState;
  bootstrapState: SettingsPageBootstrapState;
  derivedState: SettingsPageDerivedState;
};

function syncProfileState(currentProfile: UserProfileSnapshot, profileState: ProfileRuntimeState) {
  profileState.profileForm.name = currentProfile.name || "";
  profileState.profileForm.email = currentProfile.email || "";
  profileState.profileForm.phone = currentProfile.phone || "";
  profileState.profileForm.location = currentProfile.location || "";
  profileState.profileForm.website = currentProfile.website || "";
  profileState.profileForm.linkedin = currentProfile.linkedin || "";
  profileState.profileForm.github = currentProfile.github || "";
  profileState.profileForm.summary = currentProfile.summary || "";
  profileState.profileForm.currentRole = currentProfile.currentRole || "";
  profileState.profileForm.currentCompany = currentProfile.currentCompany || "";
  profileState.profileForm.yearsExperience = currentProfile.yearsExperience || 0;
  profileState.profileForm.technicalSkillsText = currentProfile.technicalSkills.join(", ");
  profileState.profileForm.softSkillsText = currentProfile.softSkills.join(", ");
}

function setupSettingsPageWatchers(options: WatcherSetupOptions) {
  watch(
    options.settings,
    (currentSettings) => {
      if (currentSettings) {
        syncSettingsState(
          currentSettings,
          options.providerState,
          options.saveState,
          options.brandState,
        );
      }
    },
    { immediate: true },
  );

  watch(options.providerState.preferredProviderSelection, (provider) => {
    if (options.providerState.aiRoutingDraft.chat.provider !== provider) {
      options.providerState.aiRoutingDraft.chat.provider = provider;
    }
  });

  watch(
    () => options.providerState.aiRoutingDraft.chat.provider,
    (provider) => {
      if (options.providerState.preferredProviderSelection.value !== provider) {
        options.providerState.preferredProviderSelection.value = provider;
      }
    },
  );

  watch(
    options.profile,
    (currentProfile) => {
      if (currentProfile) {
        syncProfileState(currentProfile, options.profileState);
      }
    },
    { immediate: true },
  );
}

function buildSettingsPageStateResult(options: SettingsPageStateResultOptions) {
  return {
    t: options.services.t,
    settings: options.settings,
    profile: options.services.profile,
    resolvedBrand: options.services.resolvedBrand,
    theme: options.services.theme,
    toggleTheme: options.services.toggleTheme,
    THEME_NAMES,
    fetchSettings: options.services.fetchSettings,
    updateSettings: options.services.updateSettings,
    updateJobTaxonomy: options.services.updateJobTaxonomy,
    updateApiKeys: options.services.updateApiKeys,
    testApiKey: options.services.testApiKey,
    updateProfile: options.services.updateProfile,
    settingsLoading: options.services.settingsLoading,
    profileLoading: options.services.profileLoading,
    providerDiagnostics: options.services.providerDiagnostics,
    ...options.optionState,
    ...options.providerState,
    ...options.saveState,
    ...options.brandState,
    ...options.profileState,
    settingsBootstrapError: options.bootstrapState.error,
    settingsBootstrapStatus: options.bootstrapState.status,
    refreshSettingsBootstrap: options.bootstrapState.refresh,
    ...options.derivedState,
    $toast: options.services.$toast,
  };
}

export async function useSettingsPageState() {
  const services = createSettingsPageServices();
  const settings = computed(() => toAppSettings(services.rawSettings.value));

  const optionState = createSettingsPageOptionState(services.t);
  const providerState = createSettingsPageProviderRuntimeState();
  const saveState = createSettingsPageSaveRuntimeState();
  const brandState = createSettingsPageBrandRuntimeState();
  const profileState = createSettingsPageProfileRuntimeState();
  const bootstrapState = await useSettingsPageBootstrap(services);

  setupSettingsPageWatchers({
    settings,
    profile: services.profile,
    providerState,
    saveState,
    brandState,
    profileState,
  });

  const derivedState = createSettingsPageDerivedState({
    t: services.t,
    settings,
    emailTransportForm: saveState.emailTransportForm,
    aiRoutingDraft: providerState.aiRoutingDraft,
    apiKeys: providerState.apiKeys,
    brandForm: brandState.brandForm,
    brandDefaults: brandState.brandDefaults,
  });

  return buildSettingsPageStateResult({
    services,
    settings,
    optionState,
    providerState,
    saveState,
    brandState,
    profileState,
    bootstrapState,
    derivedState,
  });
}

export type SettingsPageState = Awaited<ReturnType<typeof useSettingsPageState>>;
