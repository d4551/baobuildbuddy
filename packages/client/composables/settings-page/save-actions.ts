import {
  companyBoardApiTemplatesSchema,
  companyBoardConfigSchema,
  DEFAULT_APP_LANGUAGE,
  greenhouseBoardConfigSchema,
  isValidEmail,
  jobTaxonomyKeywordEntrySchema,
  parseJson,
  studioClassificationRuleSchema,
  gamingPortalConfigSchema,
  leverCompanyConfigSchema,
} from "@bao/shared";
import z from "zod";
import { buildBrandPayload } from "./save-brand-payload";
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
] as const satisfies readonly (readonly [
  keyof SettingsPageState["profileForm"],
  keyof ProfilePayload,
])[];

function buildProfilePayload(
  state: SettingsPageState,
  name: string,
  email: string,
): ProfilePayload {
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

function createHandleToggleTheme(state: SettingsPageState) {
  return async () => {
    const nextTheme =
      state.theme.value === state.THEME_NAMES.light
        ? state.THEME_NAMES.dark
        : state.THEME_NAMES.light;
    state.toggleTheme();
    const savedTheme = await runToastTask(
      state.updateSettings({ theme: nextTheme }),
      state.t("settings.errors.failedToSaveTheme"),
      state.$toast,
    );
    if (savedTheme !== null) state.$toast.success(state.t("settings.toasts.themeSaved"));
  };
}

function createHandleSavePreferences(state: SettingsPageState) {
  return () =>
    runStatefulSave({
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
    if (savedAutomation !== null) state.$toast.success(state.t("settings.toasts.automationSaved"));
  };
}

function parseJobProviderCollections(state: SettingsPageState) {
  const greenhouseBoards = parseJson(
    state.jobProviderForm.greenhouseBoardsJson,
    z.array(greenhouseBoardConfigSchema),
  );
  const leverCompanies = parseJson(
    state.jobProviderForm.leverCompaniesJson,
    z.array(leverCompanyConfigSchema),
  );
  const companyBoards = parseJson(
    state.jobProviderForm.companyBoardsJson,
    z.array(companyBoardConfigSchema),
  );
  const companyBoardApiTemplates = parseJson(
    state.jobProviderForm.companyBoardApiTemplatesJson,
    companyBoardApiTemplatesSchema,
  );
  const gamingPortals = parseJson(
    state.jobProviderForm.gamingPortalsJson,
    z.array(gamingPortalConfigSchema),
  );
  if (
    !(
      greenhouseBoards &&
      leverCompanies &&
      companyBoards &&
      companyBoardApiTemplates &&
      gamingPortals
    )
  )
    return null;

  return {
    greenhouseBoards,
    leverCompanies,
    companyBoards,
    companyBoardApiTemplates,
    gamingPortals,
  };
}

function buildJobProvidersPayload(state: SettingsPageState) {
  const collections = parseJobProviderCollections(state);
  if (!collections) {
    return null;
  }

  return {
    providerTimeoutMs: state.jobProviderForm.providerTimeoutMs,
    companyBoardResultLimit: state.jobProviderForm.companyBoardResultLimit,
    gamingBoardResultLimit: state.jobProviderForm.gamingBoardResultLimit,
    unknownLocationLabel: state.jobProviderForm.unknownLocationLabel.trim(),
    unknownCompanyLabel: state.jobProviderForm.unknownCompanyLabel.trim(),
    hitmarkerEnabled: state.jobProviderForm.hitmarkerEnabled,
    hitmarkerApiBaseUrl: state.jobProviderForm.hitmarkerApiBaseUrl.trim(),
    hitmarkerDefaultQuery: state.jobProviderForm.hitmarkerDefaultQuery.trim(),
    hitmarkerDefaultLocation: state.jobProviderForm.hitmarkerDefaultLocation.trim(),
    greenhouseApiBaseUrl: state.jobProviderForm.greenhouseApiBaseUrl.trim(),
    greenhouseMaxPages: state.jobProviderForm.greenhouseMaxPages,
    greenhouseBoards: collections.greenhouseBoards,
    leverApiBaseUrl: state.jobProviderForm.leverApiBaseUrl.trim(),
    leverMaxPages: state.jobProviderForm.leverMaxPages,
    leverCompanies: collections.leverCompanies,
    companyBoardApiTemplates: collections.companyBoardApiTemplates,
    companyBoards: collections.companyBoards,
    gamingPortals: collections.gamingPortals,
  };
}

function createHandleSaveJobProviders(state: SettingsPageState) {
  return async () => {
    const payload = buildJobProvidersPayload(state);
    if (!payload) {
      state.jobProvidersSaveState.value = "error";
      state.$toast.error(state.t("settings.jobIntelligence.errors.invalidProviderConfig"));
      return;
    }
    await runStatefulSave({
      state: state.jobProvidersSaveState,
      task: state.updateSettings({
        automationSettings: { ...state.automationForm, jobProviders: payload },
      }),
      failureMessage: state.t("settings.jobIntelligence.errors.failedToSaveProviders"),
      successMessage: state.t("settings.jobIntelligence.toasts.providersSaved"),
      toast: state.$toast,
    });
  };
}

function buildJobTaxonomyPayload(state: SettingsPageState) {
  const keywords = parseJson(
    state.jobTaxonomyForm.keywordsJson,
    z.array(jobTaxonomyKeywordEntrySchema),
  );
  const studioRules = parseJson(
    state.jobTaxonomyForm.studioRulesJson,
    z.array(studioClassificationRuleSchema),
  );
  if (!(keywords && studioRules)) return null;

  return { keywords, studioRules };
}

function createHandleSaveJobTaxonomy(state: SettingsPageState) {
  return async () => {
    const payload = buildJobTaxonomyPayload(state);
    if (!payload) {
      state.jobTaxonomySaveState.value = "error";
      state.$toast.error(state.t("settings.jobIntelligence.errors.invalidTaxonomy"));
      return;
    }
    await runStatefulSave({
      state: state.jobTaxonomySaveState,
      task: state.updateJobTaxonomy(payload),
      failureMessage: state.t("settings.jobIntelligence.errors.failedToSaveTaxonomy"),
      successMessage: state.t("settings.jobIntelligence.toasts.taxonomySaved"),
      toast: state.$toast,
    });
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
    if (savedEmailDelivery !== null)
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
    if (savedPassword === null) return;
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
    if (clearedPassword === null) return;
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
  const handleSaveJobProviders = createHandleSaveJobProviders(state);
  const handleSaveJobTaxonomy = createHandleSaveJobTaxonomy(state);
  const handleSaveEmailDeliverySettings = createHandleSaveEmailDeliverySettings(state);
  const handleSaveEmailDeliveryPassword = createHandleSaveEmailDeliveryPassword(state);
  const handleClearEmailDeliveryPassword = createHandleClearEmailDeliveryPassword(state);

  return {
    handleToggleTheme,
    handleSavePreferences,
    handleSaveProfile,
    handleSaveBrand,
    handleSaveAutomation,
    handleSaveJobProviders,
    handleSaveJobTaxonomy,
    handleSaveEmailDeliverySettings,
    handleSaveEmailDeliveryPassword,
    handleClearEmailDeliveryPassword,
  };
}
