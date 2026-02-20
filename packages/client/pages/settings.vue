<script setup lang="ts">
import type { AppSettings, AutomationSettings, UserProfile } from "@bao/shared";
import {
  APP_LANGUAGE_OPTIONS,
  AUTOMATION_BROWSER_OPTIONS,
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_APP_LANGUAGE,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type AIProviderType,
  AI_PROVIDER_CATALOG,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { getErrorMessage } from "~/utils/errors";

type SettingsWithFlags = AppSettings & {
  hasGeminiKey?: boolean;
  hasOpenaiKey?: boolean;
  hasClaudeKey?: boolean;
  hasHuggingfaceToken?: boolean;
  hasLocalKey?: boolean;
};

type SaveState = "idle" | "saving" | "success" | "error";

type ProviderField =
  | "localModelEndpoint"
  | "localModelName"
  | "geminiApiKey"
  | "openaiApiKey"
  | "claudeApiKey"
  | "huggingfaceToken";

type ProviderInputConfig = {
  id: AIProviderType;
  label: string;
  description: string;
  field: ProviderField;
};

type ProfileUpdatePayload = Partial<UserProfile> &
  Pick<UserProfile, "name" | "technicalSkills" | "softSkills">;

const { settings, fetchSettings, updateSettings, updateApiKeys, testApiKey, loading: settingsLoading } =
  useSettings();
const { profile, fetchProfile, updateProfile, loading: profileLoading } = useUser();
const { theme, toggleTheme } = useTheme();
const { $toast } = useNuxtApp();
const { t } = useI18n();

const providerFieldById = {
  local: "localModelEndpoint",
  gemini: "geminiApiKey",
  openai: "openaiApiKey",
  claude: "claudeApiKey",
  huggingface: "huggingfaceToken",
} satisfies Record<AIProviderType, ProviderField>;

const providerInputs = computed<ProviderInputConfig[]>(() =>
  AI_PROVIDER_CATALOG.map((provider) => ({
    id: provider.id,
    label: provider.name,
    description: provider.description,
    field: providerFieldById[provider.id],
  })),
);

const languageOptions = APP_LANGUAGE_OPTIONS;
const automationBrowserOptions = AUTOMATION_BROWSER_OPTIONS;

const apiKeys = reactive<Record<ProviderField, string>>({
  geminiApiKey: "",
  openaiApiKey: "",
  claudeApiKey: "",
  huggingfaceToken: "",
  localModelEndpoint: LOCAL_AI_DEFAULT_ENDPOINT,
  localModelName: LOCAL_AI_DEFAULT_MODEL,
});

const testResults = reactive<Record<AIProviderType, { valid: boolean } | null>>({
  local: null,
  gemini: null,
  openai: null,
  claude: null,
  huggingface: null,
});

const testingProvider = ref<AIProviderType | null>(null);
const preferencesLanguage = ref(DEFAULT_APP_LANGUAGE);
const preferencesSaveState = ref<SaveState>("idle");
const profileSaveState = ref<SaveState>("idle");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const notificationForm = reactive({ ...DEFAULT_NOTIFICATION_PREFERENCES });
const automationForm = reactive<AutomationSettings>({ ...DEFAULT_AUTOMATION_SETTINGS });

const profileForm = reactive({
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
});

await useAsyncData("settings-bootstrap", async () => {
  await Promise.all([fetchSettings(), fetchProfile()]);
  return true;
});

watch(
  settings,
  (currentSettings) => {
    if (!currentSettings) return;

    apiKeys.localModelEndpoint = currentSettings.localModelEndpoint || LOCAL_AI_DEFAULT_ENDPOINT;
    apiKeys.localModelName = currentSettings.localModelName || LOCAL_AI_DEFAULT_MODEL;

    preferencesLanguage.value = currentSettings.language || DEFAULT_APP_LANGUAGE;

    notificationForm.achievements = currentSettings.notifications?.achievements ?? true;
    notificationForm.dailyChallenges = currentSettings.notifications?.dailyChallenges ?? true;
    notificationForm.levelUp = currentSettings.notifications?.levelUp ?? true;
    notificationForm.jobAlerts = currentSettings.notifications?.jobAlerts ?? true;

    if (currentSettings.automationSettings) {
      Object.assign(automationForm, {
        ...DEFAULT_AUTOMATION_SETTINGS,
        ...currentSettings.automationSettings,
      });
    }
  },
  { immediate: true },
);

watch(
  profile,
  (currentProfile) => {
    if (!currentProfile) return;

    profileForm.name = currentProfile.name || "";
    profileForm.email = currentProfile.email || "";
    profileForm.phone = currentProfile.phone || "";
    profileForm.location = currentProfile.location || "";
    profileForm.website = currentProfile.website || "";
    profileForm.linkedin = currentProfile.linkedin || "";
    profileForm.github = currentProfile.github || "";
    profileForm.summary = currentProfile.summary || "";
    profileForm.currentRole = currentProfile.currentRole || "";
    profileForm.currentCompany = currentProfile.currentCompany || "";
    profileForm.yearsExperience = currentProfile.yearsExperience || 0;
    profileForm.technicalSkillsText = currentProfile.technicalSkills.join(", ");
    profileForm.softSkillsText = currentProfile.softSkills.join(", ");
  },
  { immediate: true },
);

const getComputedSettings = (): SettingsWithFlags | null => settings.value as SettingsWithFlags | null;

function parseDelimitedList(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function showToastError(error: unknown, fallback: string): void {
  $toast.error(getErrorMessage(error, fallback));
}

function providerKeyLabel(providerId: AIProviderType): string {
  if (providerId === "local") {
    return t("settings.aiProviders.endpointLabel");
  }
  return t("settings.aiProviders.credentialLabel");
}

function providerPlaceholder(providerId: AIProviderType, providerLabel: string): string {
  if (providerId === "local") {
    return LOCAL_AI_DEFAULT_ENDPOINT;
  }
  if (providerId === "huggingface") {
    return t("settings.aiProviders.huggingFacePlaceholder");
  }
  return t("settings.aiProviders.apiKeyPlaceholder", { provider: providerLabel });
}

function saveStateLabel(value: SaveState): string {
  if (value === "saving") return t("settings.saveState.saving");
  if (value === "success") return t("settings.saveState.success");
  if (value === "error") return t("settings.saveState.error");
  return t("settings.saveState.idle");
}

function browserOptionLabel(browser: (typeof AUTOMATION_BROWSER_OPTIONS)[number]): string {
  if (browser === "chrome") return t("settings.automation.browserOptions.chrome");
  if (browser === "chromium") return t("settings.automation.browserOptions.chromium");
  return t("settings.automation.browserOptions.edge");
}

function isProviderConfigured(providerId: AIProviderType): boolean {
  const current = getComputedSettings();
  if (!current) return false;

  if (providerId === "local") {
    return current.hasLocalKey ?? true;
  }
  if (providerId === "gemini") return !!current.hasGeminiKey;
  if (providerId === "openai") return !!current.hasOpenaiKey;
  if (providerId === "claude") return !!current.hasClaudeKey;
  return !!current.hasHuggingfaceToken;
}

async function handleTest(providerId: AIProviderType) {
  const testInput =
    providerId === "local"
      ? apiKeys.localModelEndpoint || LOCAL_AI_DEFAULT_ENDPOINT
      : apiKeys[providerFieldById[providerId]]?.trim();

  if (!testInput && providerId !== "local") return;

  testingProvider.value = providerId;
  testResults[providerId] = null;

  try {
    const result = await testApiKey(providerId, testInput);
    testResults[providerId] = result;
    if (result?.valid) {
      $toast.success(t("settings.aiProviders.connectionSuccessful"));
    } else {
      $toast.error(t("settings.aiProviders.connectionFailed"));
    }
  } catch (error) {
    showToastError(error, t("settings.errors.failedToTestProvider"));
    testResults[providerId] = { valid: false };
  } finally {
    testingProvider.value = null;
  }
}

async function handleSaveKeys() {
  const payload: Record<string, string> = {
    localModelEndpoint: apiKeys.localModelEndpoint || LOCAL_AI_DEFAULT_ENDPOINT,
    localModelName: apiKeys.localModelName || LOCAL_AI_DEFAULT_MODEL,
  };

  if (apiKeys.geminiApiKey.trim()) payload.geminiApiKey = apiKeys.geminiApiKey.trim();
  if (apiKeys.openaiApiKey.trim()) payload.openaiApiKey = apiKeys.openaiApiKey.trim();
  if (apiKeys.claudeApiKey.trim()) payload.claudeApiKey = apiKeys.claudeApiKey.trim();
  if (apiKeys.huggingfaceToken.trim()) payload.huggingfaceToken = apiKeys.huggingfaceToken.trim();

  try {
    await updateApiKeys(payload);
    $toast.success(t("settings.toasts.apiKeysSaved"));
  } catch (error) {
    showToastError(error, t("settings.errors.failedToSaveApiKeys"));
  }
}

async function handleToggleTheme() {
  const nextTheme = theme.value === "bao-light" ? "bao-dark" : "bao-light";
  toggleTheme();

  try {
    await updateSettings({ theme: nextTheme });
    $toast.success(t("settings.toasts.themeSaved"));
  } catch (error) {
    showToastError(error, t("settings.errors.failedToSaveTheme"));
  }
}

async function handleSavePreferences() {
  preferencesSaveState.value = "saving";

  try {
    await updateSettings({
      language: preferencesLanguage.value || DEFAULT_APP_LANGUAGE,
      notifications: {
        achievements: notificationForm.achievements,
        dailyChallenges: notificationForm.dailyChallenges,
        levelUp: notificationForm.levelUp,
        jobAlerts: notificationForm.jobAlerts,
      },
    });

    preferencesSaveState.value = "success";
    $toast.success(t("settings.toasts.preferencesSaved"));
  } catch (error) {
    preferencesSaveState.value = "error";
    showToastError(error, t("settings.errors.failedToSavePreferences"));
  }
}

async function handleSaveProfile() {
  const name = profileForm.name.trim();
  if (name.length < 2) {
    profileSaveState.value = "error";
    $toast.error(t("settings.errors.nameTooShort"));
    return;
  }

  const email = profileForm.email.trim();
  if (!emailPattern.test(email)) {
    profileSaveState.value = "error";
    $toast.error(t("settings.errors.invalidEmail"));
    return;
  }

  profileSaveState.value = "saving";

  try {
    const profilePayload: ProfileUpdatePayload = {
      name,
      technicalSkills: parseDelimitedList(profileForm.technicalSkillsText),
      softSkills: parseDelimitedList(profileForm.softSkillsText),
      email,
    };

    const phone = profileForm.phone.trim();
    if (phone) profilePayload.phone = phone;

    const location = profileForm.location.trim();
    if (location) profilePayload.location = location;

    const website = profileForm.website.trim();
    if (website) profilePayload.website = website;

    const linkedin = profileForm.linkedin.trim();
    if (linkedin) profilePayload.linkedin = linkedin;

    const github = profileForm.github.trim();
    if (github) profilePayload.github = github;

    const summary = profileForm.summary.trim();
    if (summary) profilePayload.summary = summary;

    const currentRole = profileForm.currentRole.trim();
    if (currentRole) profilePayload.currentRole = currentRole;

    const currentCompany = profileForm.currentCompany.trim();
    if (currentCompany) profilePayload.currentCompany = currentCompany;

    if (Number.isFinite(profileForm.yearsExperience)) {
      profilePayload.yearsExperience = profileForm.yearsExperience;
    }

    await updateProfile(profilePayload);

    profileSaveState.value = "success";
    $toast.success(t("settings.toasts.profileSaved"));
  } catch (error) {
    profileSaveState.value = "error";
    showToastError(error, t("settings.errors.failedToSaveProfile"));
  }
}

async function handleSaveAutomation() {
  try {
    await updateSettings({ automationSettings: { ...automationForm } });
    $toast.success(t("settings.toasts.automationSaved"));
  } catch (error) {
    showToastError(error, t("settings.errors.failedToSaveAutomation"));
  }
}
</script>

<template>
  <div class="space-y-6">
    <section class="hero rounded-box bg-base-200 border border-base-300">
      <div class="hero-content w-full flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-3xl font-bold md:text-4xl">{{ t("settings.title") }}</h1>
          <p class="text-base-content/70 mt-2 max-w-2xl">
            {{ t("settings.subtitle") }}
          </p>
        </div>
      </div>
    </section>

    <LoadingSkeleton v-if="settingsLoading && profileLoading && !settings && !profile" :lines="8" />

    <div v-else class="space-y-6">
      <div class="card card-border bg-base-100">
        <div class="card-body">
          <div class="flex items-center justify-between gap-3">
            <h2 class="card-title">{{ t("settings.profile.title") }}</h2>
            <span class="badge" :class="profileSaveState === 'success' ? 'badge-success' : profileSaveState === 'error' ? 'badge-error' : 'badge-ghost'">
              {{ saveStateLabel(profileSaveState) }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="floating-label w-full">
              <span>{{ t("settings.profile.nameLegend") }}</span>
              <input
                v-model="profileForm.name"
                required
                minlength="2"
                class="input validator w-full"
                :aria-label="t('settings.profile.nameAria')"
              />
              <p class="validator-hint">{{ t("settings.profile.nameHint") }}</p>
            </label>

            <label class="floating-label w-full">
              <span>{{ t("settings.profile.emailLegend") }}</span>
              <input
                v-model="profileForm.email"
                type="email"
                required
                class="input validator w-full"
                :aria-label="t('settings.profile.emailAria')"
              />
              <p class="validator-hint">{{ t("settings.profile.emailHint") }}</p>
            </label>

            <label class="floating-label w-full">
              <span>{{ t("settings.profile.currentRoleLegend") }}</span>
              <input
                v-model="profileForm.currentRole"
                class="input w-full"
                :aria-label="t('settings.profile.currentRoleAria')"
              />
            </label>

            <label class="floating-label w-full">
              <span>{{ t("settings.profile.currentCompanyLegend") }}</span>
              <input
                v-model="profileForm.currentCompany"
                class="input w-full"
                :aria-label="t('settings.profile.currentCompanyAria')"
              />
            </label>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.profile.locationLegend") }}</legend>
              <input
                v-model="profileForm.location"
                class="input w-full"
                :aria-label="t('settings.profile.locationAria')"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.profile.yearsExperienceLegend") }}</legend>
              <input
                v-model.number="profileForm.yearsExperience"
                type="number"
                min="0"
                max="80"
                class="input w-full"
                :aria-label="t('settings.profile.yearsExperienceAria')"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.profile.githubLegend") }}</legend>
              <input v-model="profileForm.github" class="input w-full" :aria-label="t('settings.profile.githubAria')" />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.profile.linkedinLegend") }}</legend>
              <input
                v-model="profileForm.linkedin"
                class="input w-full"
                :aria-label="t('settings.profile.linkedinAria')"
              />
            </fieldset>

            <fieldset class="fieldset md:col-span-2">
              <legend class="fieldset-legend">{{ t("settings.profile.summaryLegend") }}</legend>
              <textarea
                v-model="profileForm.summary"
                class="textarea w-full"
                rows="4"
                :aria-label="t('settings.profile.summaryAria')"
              ></textarea>
            </fieldset>

            <fieldset class="fieldset md:col-span-2">
              <legend class="fieldset-legend">{{ t("settings.profile.technicalSkillsLegend") }}</legend>
              <input
                v-model="profileForm.technicalSkillsText"
                class="input w-full"
                :placeholder="t('settings.profile.technicalSkillsPlaceholder')"
                :aria-label="t('settings.profile.technicalSkillsAria')"
              />
            </fieldset>

            <fieldset class="fieldset md:col-span-2">
              <legend class="fieldset-legend">{{ t("settings.profile.softSkillsLegend") }}</legend>
              <input
                v-model="profileForm.softSkillsText"
                class="input w-full"
                :placeholder="t('settings.profile.softSkillsPlaceholder')"
                :aria-label="t('settings.profile.softSkillsAria')"
              />
            </fieldset>
          </div>

          <div class="card-actions justify-end">
            <button
              class="btn btn-primary"
              :aria-label="t('settings.profile.saveAria')"
              :disabled="profileSaveState === 'saving'"
              @click="handleSaveProfile"
            >
              <span v-if="profileSaveState === 'saving'" class="loading loading-spinner loading-xs"></span>
              {{ t("settings.profile.saveButton") }}
            </button>
          </div>
        </div>
      </div>

      <div class="divider divider-primary">{{ t("settings.preferences.title") }}</div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="card card-border bg-base-100">
          <div class="card-body">
            <h2 class="card-title">{{ t("settings.preferences.title") }}</h2>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span>{{ t("settings.preferences.themeLabel") }}</span>
                <label class="flex items-center gap-3 cursor-pointer">
                  <span class="text-sm">{{ t("settings.preferences.lightTheme") }}</span>
                  <input
                    type="checkbox"
                    class="toggle toggle-primary theme-controller"
                    value="bao-dark"
                    :checked="theme === 'bao-dark'"
                    :aria-label="t('settings.preferences.toggleThemeAria')"
                    @change="handleToggleTheme"
                  />
                  <span class="text-sm">{{ t("settings.preferences.darkTheme") }}</span>
                </label>
              </div>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t("settings.preferences.languageLegend") }}</legend>
                <select
                  v-model="preferencesLanguage"
                  class="select w-full"
                  :aria-label="t('settings.preferences.languageAria')"
                >
                  <option v-for="option in languageOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t("settings.preferences.notificationsLegend") }}</legend>
                <label class="label cursor-pointer justify-start gap-3">
                  <input
                    v-model="notificationForm.achievements"
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :aria-label="t('settings.preferences.notifications.achievementsAria')"
                  />
                  <span class="label-text">{{ t("settings.preferences.notifications.achievements") }}</span>
                </label>
                <label class="label cursor-pointer justify-start gap-3">
                  <input
                    v-model="notificationForm.dailyChallenges"
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :aria-label="t('settings.preferences.notifications.dailyChallengesAria')"
                  />
                  <span class="label-text">{{ t("settings.preferences.notifications.dailyChallenges") }}</span>
                </label>
                <label class="label cursor-pointer justify-start gap-3">
                  <input
                    v-model="notificationForm.levelUp"
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :aria-label="t('settings.preferences.notifications.levelUpAria')"
                  />
                  <span class="label-text">{{ t("settings.preferences.notifications.levelUp") }}</span>
                </label>
                <label class="label cursor-pointer justify-start gap-3">
                  <input
                    v-model="notificationForm.jobAlerts"
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :aria-label="t('settings.preferences.notifications.jobAlertsAria')"
                  />
                  <span class="label-text">{{ t("settings.preferences.notifications.jobAlerts") }}</span>
                </label>
              </fieldset>
            </div>

            <div class="card-actions justify-end mt-2">
              <button
                class="btn btn-primary"
                :aria-label="t('settings.preferences.saveAria')"
                :disabled="preferencesSaveState === 'saving'"
                @click="handleSavePreferences"
              >
                <span v-if="preferencesSaveState === 'saving'" class="loading loading-spinner loading-xs"></span>
                {{ t("settings.preferences.saveButton") }}
              </button>
            </div>
          </div>
        </div>

        <div class="card card-border bg-base-100">
          <div class="card-body">
            <h2 class="card-title">{{ t("settings.automation.title") }}</h2>
            <p class="text-sm text-base-content/70 mb-2">
              {{ t("settings.automation.subtitle") }}
            </p>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-medium">{{ t("settings.automation.headlessTitle") }}</span>
                  <p class="text-sm text-base-content/60">{{ t("settings.automation.headlessDescription") }}</p>
                </div>
                <input
                  v-model="automationForm.headless"
                  type="checkbox"
                  class="toggle toggle-primary"
                  :aria-label="t('settings.automation.headlessAria')"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <span class="font-medium">{{ t("settings.automation.smartSelectorsTitle") }}</span>
                  <p class="text-sm text-base-content/60">{{ t("settings.automation.smartSelectorsDescription") }}</p>
                </div>
                <input
                  v-model="automationForm.enableSmartSelectors"
                  type="checkbox"
                  class="toggle toggle-primary"
                  :aria-label="t('settings.automation.smartSelectorsAria')"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <span class="font-medium">{{ t("settings.automation.autoScreenshotsTitle") }}</span>
                  <p class="text-sm text-base-content/60">{{ t("settings.automation.autoScreenshotsDescription") }}</p>
                </div>
                <input
                  v-model="automationForm.autoSaveScreenshots"
                  type="checkbox"
                  class="toggle toggle-primary"
                  :aria-label="t('settings.automation.autoScreenshotsAria')"
                />
              </div>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t("settings.automation.timeoutLegend") }}</legend>
                <input
                  v-model.number="automationForm.defaultTimeout"
                  type="number"
                  min="1"
                  max="120"
                  class="input w-full"
                  :aria-label="t('settings.automation.timeoutAria')"
                />
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t("settings.automation.retentionLegend") }}</legend>
                <input
                  v-model.number="automationForm.screenshotRetention"
                  type="number"
                  min="1"
                  max="30"
                  class="input w-full"
                  :aria-label="t('settings.automation.retentionAria')"
                />
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t("settings.automation.concurrentRunsLegend") }}</legend>
                <input
                  v-model.number="automationForm.maxConcurrentRuns"
                  type="number"
                  min="1"
                  max="5"
                  class="input w-full"
                  :aria-label="t('settings.automation.concurrentRunsAria')"
                />
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t("settings.automation.defaultBrowserLegend") }}</legend>
                <select
                  v-model="automationForm.defaultBrowser"
                  class="select w-full"
                  :aria-label="t('settings.automation.defaultBrowserAria')"
                >
                  <option v-for="browser in automationBrowserOptions" :key="browser" :value="browser">
                    {{ browserOptionLabel(browser) }}
                  </option>
                </select>
              </fieldset>
            </div>

            <div class="card-actions justify-end mt-2">
              <button
                class="btn btn-primary"
                :aria-label="t('settings.automation.saveAria')"
                @click="handleSaveAutomation"
              >
                {{ t("settings.automation.saveButton") }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="divider divider-primary">{{ t("settings.aiProviders.title") }}</div>

      <div class="card card-border bg-base-100">
        <div class="card-body">
          <h2 class="card-title">{{ t("settings.aiProviders.title") }}</h2>
          <p class="text-sm text-base-content/70 mb-3">
            {{ t("settings.aiProviders.subtitle") }}
          </p>

          <div class="space-y-4">
            <div
              v-for="provider in providerInputs"
              :key="provider.id"
              class="collapse collapse-arrow border border-base-300 bg-base-100"
            >
              <input
                type="radio"
                name="provider-accordion"
                :aria-label="t('settings.aiProviders.expandAria', { provider: provider.label })"
              />
              <div class="collapse-title font-medium flex items-center gap-2">
                {{ provider.label }}
                <span v-if="isProviderConfigured(provider.id)" class="badge badge-success badge-xs">
                  {{ t("settings.aiProviders.configuredBadge") }}
                </span>
              </div>
              <div class="collapse-content space-y-3">
                <p class="text-sm text-base-content/60">{{ provider.description }}</p>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">{{ providerKeyLabel(provider.id) }}</legend>
                  <div class="join w-full">
                    <input
                      v-model="apiKeys[provider.field]"
                      :type="provider.id === 'local' ? 'text' : 'password'"
                      :placeholder="providerPlaceholder(provider.id, provider.label)"
                      class="input join-item w-full"
                      :aria-label="providerKeyLabel(provider.id)"
                    />
                    <button
                      class="btn btn-outline join-item"
                      :aria-label="t('settings.aiProviders.testAria')"
                      @click="handleTest(provider.id)"
                    >
                      <span v-if="testingProvider === provider.id" class="loading loading-spinner loading-xs"></span>
                      {{ t("settings.aiProviders.testButton") }}
                    </button>
                  </div>
                </fieldset>

                <fieldset v-if="provider.id === 'local'" class="fieldset">
                  <legend class="fieldset-legend">{{ t("settings.aiProviders.localModelLegend") }}</legend>
                  <input
                    v-model="apiKeys.localModelName"
                    type="text"
                    class="input w-full"
                    :placeholder="t('settings.aiProviders.localModelPlaceholder')"
                    :aria-label="t('settings.aiProviders.localModelAria')"
                  />
                </fieldset>

                <span
                  v-if="testResults[provider.id]"
                  class="badge"
                  :class="testResults[provider.id]?.valid ? 'badge-success' : 'badge-error'"
                >
                  {{ testResults[provider.id]?.valid ? t("settings.aiProviders.connectedBadge") : t("settings.aiProviders.failedBadge") }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-actions justify-end mt-4">
            <button
              class="btn btn-primary"
              :aria-label="t('settings.aiProviders.saveAria')"
              @click="handleSaveKeys"
            >
              {{ t("settings.aiProviders.saveButton") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
