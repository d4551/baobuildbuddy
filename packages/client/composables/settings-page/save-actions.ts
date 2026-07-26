import { DEFAULT_APP_LANGUAGE } from "@bao/shared/constants/settings";
import {
  jobTaxonomyKeywordEntrySchema,
  studioClassificationRuleSchema,
} from "@bao/shared/schemas/jobs-taxonomy.schema";
import {
  companyBoardApiTemplatesSchema,
  companyBoardConfigSchema,
  gamingPortalConfigSchema,
  greenhouseBoardConfigSchema,
  leverCompanyConfigSchema,
} from "@bao/shared/schemas/settings.schema";
import { parseJson } from "@bao/shared/utils/json";
import { parseJsonExplained } from "@bao/shared/utils/json-explained";
import { isValidEmail } from "@bao/shared/utils/validation";
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
    const previousTheme = state.theme.value;
    const nextTheme =
      previousTheme === state.THEME_NAMES.light ? state.THEME_NAMES.dark : state.THEME_NAMES.light;
    // Preview locally; persist cookie only after settings SSOT save succeeds.
    state.setTheme(nextTheme, { persist: false });
    const savedTheme = await runToastTask(
      state.updateSettings({ theme: nextTheme }),
      state.t("settings.errors.failedToSaveTheme"),
      state.$toast,
    );
    if (savedTheme === null) {
      state.setTheme(previousTheme, { persist: false });
      return;
    }
    state.setTheme(nextTheme, { persist: true });
    state.$toast.success(state.t("settings.toasts.themeSaved"));
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

interface JobProviderCollections {
  readonly greenhouseBoards: z.infer<z.ZodArray<typeof greenhouseBoardConfigSchema>>;
  readonly leverCompanies: z.infer<z.ZodArray<typeof leverCompanyConfigSchema>>;
  readonly companyBoards: z.infer<z.ZodArray<typeof companyBoardConfigSchema>>;
  readonly companyBoardApiTemplates: z.infer<typeof companyBoardApiTemplatesSchema>;
  readonly gamingPortals: z.infer<z.ZodArray<typeof gamingPortalConfigSchema>>;
}

/**
 * Parses every provider collection, naming the first one that fails.
 *
 * These used to collapse to a bare `null`, so the save aborted with
 * "Provider configuration JSON is invalid" and no way to tell which of the five
 * datasets — or which field inside it — was at fault.
 */
function parseJobProviderCollections(
  state: SettingsPageState,
): { collections: JobProviderCollections } | { failure: string } {
  const greenhouseBoards = parseJsonExplained(
    state.jobProviderForm.greenhouseBoardsJson,
    z.array(greenhouseBoardConfigSchema),
  );
  if (!greenhouseBoards.ok) return { failure: `greenhouseBoards — ${greenhouseBoards.reason}` };

  const leverCompanies = parseJsonExplained(
    state.jobProviderForm.leverCompaniesJson,
    z.array(leverCompanyConfigSchema),
  );
  if (!leverCompanies.ok) return { failure: `leverCompanies — ${leverCompanies.reason}` };

  const companyBoards = parseJsonExplained(
    state.jobProviderForm.companyBoardsJson,
    z.array(companyBoardConfigSchema),
  );
  if (!companyBoards.ok) return { failure: `companyBoards — ${companyBoards.reason}` };

  const companyBoardApiTemplates = parseJsonExplained(
    state.jobProviderForm.companyBoardApiTemplatesJson,
    companyBoardApiTemplatesSchema,
  );
  if (!companyBoardApiTemplates.ok) {
    return { failure: `companyBoardApiTemplates — ${companyBoardApiTemplates.reason}` };
  }

  const gamingPortals = parseJsonExplained(
    state.jobProviderForm.gamingPortalsJson,
    z.array(gamingPortalConfigSchema),
  );
  if (!gamingPortals.ok) return { failure: `gamingPortals — ${gamingPortals.reason}` };

  return {
    collections: {
      greenhouseBoards: greenhouseBoards.value,
      leverCompanies: leverCompanies.value,
      companyBoards: companyBoards.value,
      companyBoardApiTemplates: companyBoardApiTemplates.value,
      gamingPortals: gamingPortals.value,
    },
  };
}

function buildJobProvidersPayload(state: SettingsPageState) {
  const parsed = parseJobProviderCollections(state);
  if ("failure" in parsed) {
    return { failure: parsed.failure };
  }
  const collections = parsed.collections;

  return {
    payload: {
      providerTimeoutMs: state.jobProviderForm.providerTimeoutMs,
      companyBoardResultLimit: state.jobProviderForm.companyBoardResultLimit,
      gamingBoardResultLimit: state.jobProviderForm.gamingBoardResultLimit,
      unknownLocationLabel: state.jobProviderForm.unknownLocationLabel.trim(),
      unknownCompanyLabel: state.jobProviderForm.unknownCompanyLabel.trim(),
      greenhouseApiBaseUrl: state.jobProviderForm.greenhouseApiBaseUrl.trim(),
      greenhouseMaxPages: state.jobProviderForm.greenhouseMaxPages,
      greenhouseBoards: collections.greenhouseBoards,
      leverApiBaseUrl: state.jobProviderForm.leverApiBaseUrl.trim(),
      leverMaxPages: state.jobProviderForm.leverMaxPages,
      leverCompanies: collections.leverCompanies,
      companyBoardApiTemplates: collections.companyBoardApiTemplates,
      companyBoards: collections.companyBoards,
      gamingPortals: collections.gamingPortals,
    },
  };
}

function createHandleSaveJobProviders(state: SettingsPageState) {
  return async () => {
    const built = buildJobProvidersPayload(state);
    if ("failure" in built) {
      state.jobProvidersSaveState.value = "error";
      // Name the offending dataset and field instead of a blanket "invalid".
      state.$toast.error(
        `${state.t("settings.jobIntelligence.errors.invalidProviderConfig")} ${built.failure}`,
      );
      return;
    }
    await runStatefulSave({
      state: state.jobProvidersSaveState,
      task: state.updateSettings({
        automationSettings: { ...state.automationForm, jobProviders: built.payload },
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
