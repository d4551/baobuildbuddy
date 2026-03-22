<script setup lang="ts">
import type {
  AutomationSettings,
  BrandSettings,
  BrandSettingsPatch,
  EmailTransportSettings,
} from "@bao/shared";
import {
  AI_PROVIDER_CATALOG,
  type AIProviderType,
  APP_LANGUAGE_LABELS,
  APP_LANGUAGE_OPTIONS,
  type AppLanguageCode,
  AUTOMATION_BROWSER_OPTIONS,
  brandContentSettingsSchema,
  brandSettingsSchema,
  brandThemePaletteSchema,
  DEFAULT_APP_LANGUAGE,
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  EMAIL_TRANSPORT_AUTH_MODE_OPTIONS,
  EMAIL_TRANSPORT_SECURITY_OPTIONS,
  isEmailTransportConfigured,
  isValidEmail,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
  OLLAMA_WEBSITE_URL,
  parseJson,
  resolveBrandSettings,
  THEME_NAMES,
} from "@bao/shared";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAsyncData, useNuxtApp, useServerSeoMeta } from "#imports";
import { settlePromise } from "~/composables/async-flow";
import { useBrand } from "~/composables/useBrand";
import { useSettings } from "~/composables/useSettings";
import { useTheme } from "~/composables/useTheme";
import { useUser } from "~/composables/useUser";
import { getErrorMessage } from "~/utils/errors";

type SaveState = "idle" | "saving" | "success" | "error";
type BrandEditorPanel = "identity" | "typography" | "themes" | "content";

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

const BRAND_EDITOR_PANELS = [
  { id: "identity", labelKey: "settings.brand.tabs.identity" },
  { id: "typography", labelKey: "settings.brand.tabs.typography" },
  { id: "themes", labelKey: "settings.brand.tabs.themes" },
  { id: "content", labelKey: "settings.brand.tabs.content" },
] as const satisfies ReadonlyArray<{
  id: BrandEditorPanel;
  labelKey: string;
}>;

const {
  settings,
  fetchSettings,
  updateSettings,
  updateApiKeys,
  testApiKey,
  loading: settingsLoading,
} = useSettings();
const { profile, fetchProfile, updateProfile, loading: profileLoading } = useUser();
const { resolvedBrand } = useBrand();
const { theme, toggleTheme } = useTheme();
const { $toast } = useNuxtApp();
const { t } = useI18n();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("settings.seoTitle"),
    description: t("settings.seoDescription"),
  });
}

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
    label: t(provider.nameKey),
    description: t(provider.descriptionKey),
    field: providerFieldById[provider.id],
  })),
);

const buildLanguageLabel = (value: AppLanguageCode): string => APP_LANGUAGE_LABELS[value] || value;

const languageOptions = computed(() =>
  APP_LANGUAGE_OPTIONS.map((option) => ({
    value: option.value,
    label: buildLanguageLabel(option.value),
  })),
);
const automationBrowserOptions = AUTOMATION_BROWSER_OPTIONS;
const emailTransportSecurityOptions = EMAIL_TRANSPORT_SECURITY_OPTIONS;
const emailTransportAuthModeOptions = EMAIL_TRANSPORT_AUTH_MODE_OPTIONS;

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
const preferredProviderSelection = ref<AIProviderType>("local");
const preferencesSaveState = ref<SaveState>("idle");
const profileSaveState = ref<SaveState>("idle");
const brandSaveState = ref<SaveState>("idle");
const brandEditorPanel = ref<BrandEditorPanel>("identity");

const brandFieldsetClass =
  "fieldset min-w-0 gap-2 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm";
const BRAND_DEFAULTS: BrandSettings = brandSettingsSchema.parse(DEFAULT_BRAND_SETTINGS);
const BRAND_HINT_IDS = {
  logoPath: "settings-brand-logo-path-hint",
  faviconPath: "settings-brand-favicon-path-hint",
  fontStylesheet: "settings-brand-font-stylesheet-hint",
  lightTheme: "settings-brand-light-theme-hint",
  darkTheme: "settings-brand-dark-theme-hint",
  contentOverrides: "settings-brand-content-overrides-hint",
} as const;

const notificationForm = reactive({ ...DEFAULT_NOTIFICATION_PREFERENCES });
const automationForm = reactive<AutomationSettings>({
  ...DEFAULT_AUTOMATION_SETTINGS,
});
const emailTransportForm = reactive<EmailTransportSettings>({
  ...DEFAULT_EMAIL_TRANSPORT_SETTINGS,
});
const emailTransportPasswordDraft = ref("");
const brandForm = reactive({
  name: BRAND_DEFAULTS.name,
  assistantName: BRAND_DEFAULTS.assistantName,
  apiName: BRAND_DEFAULTS.apiName,
  logoPath: BRAND_DEFAULTS.logoPath,
  faviconPath: BRAND_DEFAULTS.faviconPath,
  fontStylesheetUrl: BRAND_DEFAULTS.typography.fontStylesheetUrl,
  displayFontFamily: BRAND_DEFAULTS.typography.displayFontFamily,
  bodyFontFamily: BRAND_DEFAULTS.typography.bodyFontFamily,
  monoFontFamily: BRAND_DEFAULTS.typography.monoFontFamily,
  tagline: BRAND_DEFAULTS.content.tagline,
  defaultTitle: BRAND_DEFAULTS.content.defaultTitle,
  defaultDescription: BRAND_DEFAULTS.content.defaultDescription,
  lightThemeJson: JSON.stringify(BRAND_DEFAULTS.lightTheme, null, 2),
  darkThemeJson: JSON.stringify(BRAND_DEFAULTS.darkTheme, null, 2),
  contentOverridesJson: JSON.stringify(BRAND_DEFAULTS.content.contentOverrides, null, 2),
});

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

const {
  error: settingsBootstrapError,
  status: settingsBootstrapStatus,
  refresh: refreshSettingsBootstrap,
} = await useAsyncData("settings-bootstrap", async () => {
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
    const isKnownProvider = (v: string): v is AIProviderType => v in providerFieldById;
    const saved = currentSettings.preferredProvider ?? "";
    preferredProviderSelection.value = isKnownProvider(saved) ? saved : "local";

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

    Object.assign(emailTransportForm, {
      ...DEFAULT_EMAIL_TRANSPORT_SETTINGS,
      ...currentSettings.emailTransportSettings,
    });

    const nextBrand = currentSettings.brandSettings ?? BRAND_DEFAULTS;
    brandForm.name = nextBrand.name;
    brandForm.assistantName = nextBrand.assistantName;
    brandForm.apiName = nextBrand.apiName;
    brandForm.logoPath = nextBrand.logoPath;
    brandForm.faviconPath = nextBrand.faviconPath;
    brandForm.fontStylesheetUrl = nextBrand.typography.fontStylesheetUrl;
    brandForm.displayFontFamily = nextBrand.typography.displayFontFamily;
    brandForm.bodyFontFamily = nextBrand.typography.bodyFontFamily;
    brandForm.monoFontFamily = nextBrand.typography.monoFontFamily;
    brandForm.tagline = nextBrand.content.tagline;
    brandForm.defaultTitle = nextBrand.content.defaultTitle;
    brandForm.defaultDescription = nextBrand.content.defaultDescription;
    brandForm.lightThemeJson = JSON.stringify(nextBrand.lightTheme, null, 2);
    brandForm.darkThemeJson = JSON.stringify(nextBrand.darkTheme, null, 2);
    brandForm.contentOverridesJson = JSON.stringify(nextBrand.content.contentOverrides, null, 2);
  },
  { immediate: true },
);

const emailDeliveryConfigured = computed(() =>
  isEmailTransportConfigured(
    settings.value?.emailTransportSettings ?? emailTransportForm,
    settings.value?.hasEmailTransportPassword ?? false,
  ),
);

const showOllamaHotTip = computed(() => preferredProviderSelection.value === "local");

function parseBrandContentOverrides(): Record<string, string> {
  return (
    parseJson(brandForm.contentOverridesJson, brandContentSettingsSchema.shape.contentOverrides) ??
    {}
  );
}

const brandDraft = computed<BrandSettings>(() =>
  resolveBrandSettings({
    name: brandForm.name.trim() || BRAND_DEFAULTS.name,
    assistantName: brandForm.assistantName.trim() || BRAND_DEFAULTS.assistantName,
    apiName: brandForm.apiName.trim() || BRAND_DEFAULTS.apiName,
    logoPath: brandForm.logoPath.trim() || BRAND_DEFAULTS.logoPath,
    faviconPath: brandForm.faviconPath.trim() || BRAND_DEFAULTS.faviconPath,
    typography: {
      fontStylesheetUrl: brandForm.fontStylesheetUrl.trim(),
      displayFontFamily:
        brandForm.displayFontFamily.trim() || BRAND_DEFAULTS.typography.displayFontFamily,
      bodyFontFamily: brandForm.bodyFontFamily.trim() || BRAND_DEFAULTS.typography.bodyFontFamily,
      monoFontFamily: brandForm.monoFontFamily.trim() || BRAND_DEFAULTS.typography.monoFontFamily,
    },
    lightTheme:
      parseJson(brandForm.lightThemeJson, brandThemePaletteSchema) ?? BRAND_DEFAULTS.lightTheme,
    darkTheme:
      parseJson(brandForm.darkThemeJson, brandThemePaletteSchema) ?? BRAND_DEFAULTS.darkTheme,
    content: {
      tagline: brandForm.tagline.trim() || BRAND_DEFAULTS.content.tagline,
      defaultTitle: brandForm.defaultTitle.trim() || BRAND_DEFAULTS.content.defaultTitle,
      defaultDescription:
        brandForm.defaultDescription.trim() || BRAND_DEFAULTS.content.defaultDescription,
      contentOverrides: parseBrandContentOverrides(),
    },
  }),
);

const brandPreviewInitial = computed(() => {
  const value = brandDraft.value.name.trim().charAt(0).toUpperCase();
  return value.length > 0 ? value : BRAND_DEFAULTS.name.trim().charAt(0).toUpperCase();
});

const brandPreviewShellStyle = computed<Record<string, string>>(() => ({
  background: `linear-gradient(135deg, ${brandDraft.value.lightTheme.base100}, ${brandDraft.value.lightTheme.base200})`,
  color: brandDraft.value.lightTheme.baseContent,
  fontFamily: brandDraft.value.typography.bodyFontFamily,
}));

const brandPreviewHeadingStyle = computed<Record<string, string>>(() => ({
  fontFamily: brandDraft.value.typography.displayFontFamily,
  color: brandDraft.value.lightTheme.baseContent,
}));

const brandPreviewPrimaryBadgeStyle = computed<Record<string, string>>(() => ({
  backgroundColor: brandDraft.value.lightTheme.primary,
  color: brandDraft.value.lightTheme.primaryContent,
}));

const brandPreviewSecondaryBadgeStyle = computed<Record<string, string>>(() => ({
  backgroundColor: brandDraft.value.lightTheme.base100,
  borderColor: brandDraft.value.lightTheme.base300,
  color: brandDraft.value.lightTheme.baseContent,
}));

const brandPreviewPrimaryActionStyle = computed<Record<string, string>>(() => ({
  backgroundColor: brandDraft.value.lightTheme.accent,
  color: brandDraft.value.lightTheme.accentContent,
}));

const brandPreviewSecondaryActionStyle = computed<Record<string, string>>(() => ({
  backgroundColor: brandDraft.value.lightTheme.base100,
  borderColor: brandDraft.value.lightTheme.base300,
  color: brandDraft.value.lightTheme.baseContent,
}));

const brandLightSwatchStyle = computed<Record<string, string>>(() => ({
  background: `linear-gradient(135deg, ${brandDraft.value.lightTheme.base100}, ${brandDraft.value.lightTheme.primary})`,
}));

const brandDarkSwatchStyle = computed<Record<string, string>>(() => ({
  background: `linear-gradient(135deg, ${brandDraft.value.darkTheme.base100}, ${brandDraft.value.darkTheme.primary})`,
}));

const brandOverrideCount = computed(
  () => Object.keys(brandDraft.value.content.contentOverrides).length,
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
  return t("settings.aiProviders.apiKeyPlaceholder", {
    provider: providerLabel,
  });
}

function saveStateLabel(value: SaveState): string {
  if (value === "saving") return t("settings.saveState.saving");
  if (value === "success") return t("settings.saveState.success");
  if (value === "error") return t("settings.saveState.error");
  return t("settings.saveState.idle");
}

function focusBrandEditorTab(panel: BrandEditorPanel): void {
  if (!import.meta.client) return;

  requestAnimationFrame(() => {
    document.getElementById(`brand-tab-${panel}`)?.focus();
  });
}

function setBrandEditorPanel(panel: BrandEditorPanel, options?: { focusTab?: boolean }): void {
  brandEditorPanel.value = panel;
  if (options?.focusTab) {
    focusBrandEditorTab(panel);
  }
}

function handleBrandTabKeydown(event: KeyboardEvent, panel: BrandEditorPanel): void {
  const currentIndex = BRAND_EDITOR_PANELS.findIndex((entry) => entry.id === panel);
  if (currentIndex === -1) return;

  let nextPanel: BrandEditorPanel | null = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextPanel = BRAND_EDITOR_PANELS[(currentIndex + 1) % BRAND_EDITOR_PANELS.length]?.id ?? null;
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextPanel =
      BRAND_EDITOR_PANELS[
        (currentIndex - 1 + BRAND_EDITOR_PANELS.length) % BRAND_EDITOR_PANELS.length
      ]?.id ?? null;
  } else if (event.key === "Home") {
    nextPanel = BRAND_EDITOR_PANELS[0]?.id ?? null;
  } else if (event.key === "End") {
    nextPanel = BRAND_EDITOR_PANELS[BRAND_EDITOR_PANELS.length - 1]?.id ?? null;
  }

  if (!nextPanel) return;

  event.preventDefault();
  setBrandEditorPanel(nextPanel, { focusTab: true });
}

function browserOptionLabel(browser: (typeof AUTOMATION_BROWSER_OPTIONS)[number]): string {
  if (browser === "chrome") return t("settings.automation.browserOptions.chrome");
  if (browser === "chromium") return t("settings.automation.browserOptions.chromium");
  return t("settings.automation.browserOptions.edge");
}

function emailTransportSecurityLabel(
  security: (typeof EMAIL_TRANSPORT_SECURITY_OPTIONS)[number],
): string {
  if (security === "tls") {
    return t("settings.emailDelivery.securityOptions.tls");
  }
  if (security === "plain") {
    return t("settings.emailDelivery.securityOptions.plain");
  }
  return t("settings.emailDelivery.securityOptions.starttls");
}

function emailTransportAuthModeLabel(
  authMode: (typeof EMAIL_TRANSPORT_AUTH_MODE_OPTIONS)[number],
): string {
  if (authMode === "login") {
    return t("settings.emailDelivery.authOptions.login");
  }
  return t("settings.emailDelivery.authOptions.plain");
}

function isProviderConfigured(providerId: AIProviderType): boolean {
  const current = settings.value;
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

  const providerTestResult = await settlePromise(
    testApiKey(providerId, testInput),
    t("settings.errors.failedToTestProvider"),
  );
  testingProvider.value = null;

  if (!providerTestResult.ok) {
    showToastError(providerTestResult.error, t("settings.errors.failedToTestProvider"));
    testResults[providerId] = { valid: false };
    return;
  }

  const result = providerTestResult.value;
  testResults[providerId] = result;
  if (result?.valid) {
    $toast.success(t("settings.aiProviders.connectionSuccessful"));
  } else {
    $toast.error(t("settings.aiProviders.connectionFailed"));
  }
}

async function handleSavePreferredProvider() {
  const providerSaveResult = await settlePromise(
    updateSettings({ preferredProvider: preferredProviderSelection.value }),
    t("settings.errors.failedToSavePreferences"),
  );
  if (!providerSaveResult.ok) {
    showToastError(providerSaveResult.error, t("settings.errors.failedToSavePreferences"));
    return;
  }
  $toast.success(t("settings.aiProviders.preferredProviderSaved"));
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

  const saveKeysResult = await settlePromise(
    updateApiKeys(payload),
    t("settings.errors.failedToSaveApiKeys"),
  );
  if (!saveKeysResult.ok) {
    showToastError(saveKeysResult.error, t("settings.errors.failedToSaveApiKeys"));
    return;
  }
  $toast.success(t("settings.toasts.apiKeysSaved"));
}

async function handleToggleTheme() {
  const nextTheme = theme.value === THEME_NAMES.light ? THEME_NAMES.dark : THEME_NAMES.light;
  toggleTheme();

  const themeSaveResult = await settlePromise(
    updateSettings({ theme: nextTheme }),
    t("settings.errors.failedToSaveTheme"),
  );
  if (!themeSaveResult.ok) {
    showToastError(themeSaveResult.error, t("settings.errors.failedToSaveTheme"));
    return;
  }
  $toast.success(t("settings.toasts.themeSaved"));
}

async function handleSavePreferences() {
  preferencesSaveState.value = "saving";

  const preferenceSaveResult = await settlePromise(
    updateSettings({
      language: preferencesLanguage.value || DEFAULT_APP_LANGUAGE,
      notifications: {
        achievements: notificationForm.achievements,
        dailyChallenges: notificationForm.dailyChallenges,
        levelUp: notificationForm.levelUp,
        jobAlerts: notificationForm.jobAlerts,
      },
    }),
    t("settings.errors.failedToSavePreferences"),
  );

  if (!preferenceSaveResult.ok) {
    preferencesSaveState.value = "error";
    showToastError(preferenceSaveResult.error, t("settings.errors.failedToSavePreferences"));
    return;
  }

  preferencesSaveState.value = "success";
  $toast.success(t("settings.toasts.preferencesSaved"));
}

async function handleSaveProfile() {
  const name = profileForm.name.trim();
  if (name.length < 2) {
    profileSaveState.value = "error";
    $toast.error(t("settings.errors.nameTooShort"));
    return;
  }

  const email = profileForm.email.trim();
  if (!isValidEmail(email)) {
    profileSaveState.value = "error";
    $toast.error(t("settings.errors.invalidEmail"));
    return;
  }

  profileSaveState.value = "saving";

  const profilePayload: Parameters<typeof updateProfile>[0] = {
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

  const profileSaveResult = await settlePromise(
    updateProfile(profilePayload),
    t("settings.errors.failedToSaveProfile"),
  );
  if (!profileSaveResult.ok) {
    profileSaveState.value = "error";
    showToastError(profileSaveResult.error, t("settings.errors.failedToSaveProfile"));
    return;
  }

  profileSaveState.value = "success";
  $toast.success(t("settings.toasts.profileSaved"));
}

function buildBrandPayload(): BrandSettingsPatch | null {
  const lightTheme = parseJson(brandForm.lightThemeJson, brandThemePaletteSchema);
  if (!lightTheme) {
    $toast.error(t("settings.brand.errors.invalidLightTheme"));
    return null;
  }

  const darkTheme = parseJson(brandForm.darkThemeJson, brandThemePaletteSchema);
  if (!darkTheme) {
    $toast.error(t("settings.brand.errors.invalidDarkTheme"));
    return null;
  }

  const contentCandidate = parseJson(
    JSON.stringify({
      tagline: brandForm.tagline.trim() || BRAND_DEFAULTS.content.tagline,
      defaultTitle: brandForm.defaultTitle.trim() || BRAND_DEFAULTS.content.defaultTitle,
      defaultDescription:
        brandForm.defaultDescription.trim() || BRAND_DEFAULTS.content.defaultDescription,
      contentOverrides: parseBrandContentOverrides(),
    }),
    brandContentSettingsSchema,
  );
  if (!contentCandidate) {
    $toast.error(t("settings.brand.errors.invalidContentOverrides"));
    return null;
  }

  return {
    name: brandForm.name.trim() || BRAND_DEFAULTS.name,
    assistantName: brandForm.assistantName.trim() || BRAND_DEFAULTS.assistantName,
    apiName: brandForm.apiName.trim() || BRAND_DEFAULTS.apiName,
    logoPath: brandForm.logoPath.trim() || BRAND_DEFAULTS.logoPath,
    faviconPath: brandForm.faviconPath.trim() || BRAND_DEFAULTS.faviconPath,
    typography: {
      fontStylesheetUrl: brandForm.fontStylesheetUrl.trim(),
      displayFontFamily:
        brandForm.displayFontFamily.trim() || BRAND_DEFAULTS.typography.displayFontFamily,
      bodyFontFamily: brandForm.bodyFontFamily.trim() || BRAND_DEFAULTS.typography.bodyFontFamily,
      monoFontFamily: brandForm.monoFontFamily.trim() || BRAND_DEFAULTS.typography.monoFontFamily,
    },
    lightTheme,
    darkTheme,
    content: contentCandidate,
  };
}

async function handleSaveBrand() {
  const brandPayload = buildBrandPayload();
  if (!brandPayload) {
    brandSaveState.value = "error";
    return;
  }

  brandSaveState.value = "saving";
  const brandSaveResult = await settlePromise(
    updateSettings({ brandSettings: brandPayload }),
    t("settings.brand.errors.failedToSave"),
  );

  if (!brandSaveResult.ok) {
    brandSaveState.value = "error";
    showToastError(brandSaveResult.error, t("settings.brand.errors.failedToSave"));
    return;
  }

  brandSaveState.value = "success";
  $toast.success(t("settings.toasts.brandSaved"));
}

async function handleSaveAutomation() {
  const automationSaveResult = await settlePromise(
    updateSettings({ automationSettings: { ...automationForm } }),
    t("settings.errors.failedToSaveAutomation"),
  );
  if (!automationSaveResult.ok) {
    showToastError(automationSaveResult.error, t("settings.errors.failedToSaveAutomation"));
    return;
  }
  $toast.success(t("settings.toasts.automationSaved"));
}

async function handleSaveEmailDeliverySettings() {
  const senderEmail = emailTransportForm.fromEmail.trim();
  if (senderEmail.length > 0 && !isValidEmail(senderEmail)) {
    $toast.error(t("settings.errors.invalidEmailDeliverySender"));
    return;
  }

  const emailDeliverySaveResult = await settlePromise(
    updateSettings({
      emailTransportSettings: {
        ...emailTransportForm,
        host: emailTransportForm.host.trim(),
        username: emailTransportForm.username.trim(),
        fromEmail: senderEmail,
        fromName: emailTransportForm.fromName.trim(),
      },
    }),
    t("settings.errors.failedToSaveEmailDelivery"),
  );
  if (!emailDeliverySaveResult.ok) {
    showToastError(emailDeliverySaveResult.error, t("settings.errors.failedToSaveEmailDelivery"));
    return;
  }

  $toast.success(t("settings.toasts.emailDeliverySaved"));
}

async function handleSaveEmailDeliveryPassword() {
  const passwordSaveResult = await settlePromise(
    updateApiKeys({
      emailTransportPassword: emailTransportPasswordDraft.value,
    }),
    t("settings.errors.failedToSaveEmailDeliveryPassword"),
  );
  if (!passwordSaveResult.ok) {
    showToastError(
      passwordSaveResult.error,
      t("settings.errors.failedToSaveEmailDeliveryPassword"),
    );
    return;
  }

  emailTransportPasswordDraft.value = "";
  $toast.success(t("settings.toasts.emailDeliveryPasswordSaved"));
}

async function handleClearEmailDeliveryPassword() {
  const passwordClearResult = await settlePromise(
    updateApiKeys({ emailTransportPassword: "" }),
    t("settings.errors.failedToSaveEmailDeliveryPassword"),
  );
  if (!passwordClearResult.ok) {
    showToastError(
      passwordClearResult.error,
      t("settings.errors.failedToSaveEmailDeliveryPassword"),
    );
    return;
  }

  emailTransportPasswordDraft.value = "";
  $toast.success(t("settings.toasts.emailDeliveryPasswordCleared"));
}
</script>

<template>
  <PageScaffold labelled-by="settings-page-title">
    <section class="hero rounded-box bg-base-200 border border-base-300">
      <div
        class="hero-content w-full flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <PageHeaderBlock
          title-id="settings-page-title"
          :title="t('settings.title')"
          :description="t('settings.subtitle')"
          description-class="text-base-content/70 mt-2"
        />
      </div>
    </section>

    <div
      v-if="settingsBootstrapError"
      class="alert alert-error sm:alert-horizontal"
      role="alert"
    >
      <svg class="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ getErrorMessage(settingsBootstrapError, t("settings.bootstrapError")) }}</span>
      <button
        type="button"
        class="btn btn-sm btn-ghost shrink-0"
        :aria-label="t('settings.bootstrapRetryAria')"
        @click="() => refreshSettingsBootstrap()"
      >
        {{ t("settings.bootstrapRetry") }}
      </button>
    </div>

    <LoadingSkeleton
      v-else-if="
        settingsBootstrapStatus === 'pending' ||
          (settingsLoading && profileLoading && !settings && !profile)
      "
      :lines="8"
    />

    <div v-else class="space-y-6">
      <div class="card card-border bg-base-100">
        <div class="card-body">
          <div class="flex items-center justify-between gap-3">
            <h2 class="card-title">{{ t("settings.profile.title") }}</h2>
            <span
              class="badge"
              :class="
                profileSaveState === 'success'
                  ? 'badge-success'
                  : profileSaveState === 'error'
                    ? 'badge-error'
                    : 'badge-ghost'
              "
            >
              {{ saveStateLabel(profileSaveState) }}
            </span>
          </div>

          <SectionGrid grid-token="twoColumn">
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
              <p class="validator-hint">
                {{ t("settings.profile.emailHint") }}
              </p>
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
              <legend class="fieldset-legend">
                {{ t("settings.profile.locationLegend") }}
              </legend>
              <input
                v-model="profileForm.location"
                class="input w-full"
                :aria-label="t('settings.profile.locationAria')"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.profile.yearsExperienceLegend") }}
              </legend>
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
              <legend class="fieldset-legend">
                {{ t("settings.profile.githubLegend") }}
              </legend>
              <input
                v-model="profileForm.github"
                class="input w-full"
                :aria-label="t('settings.profile.githubAria')"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.profile.linkedinLegend") }}
              </legend>
              <input
                v-model="profileForm.linkedin"
                class="input w-full"
                :aria-label="t('settings.profile.linkedinAria')"
              />
            </fieldset>

            <fieldset class="fieldset md:col-span-2">
              <legend class="fieldset-legend">
                {{ t("settings.profile.summaryLegend") }}
              </legend>
              <textarea
                v-model="profileForm.summary"
                class="textarea w-full"
                rows="4"
                :aria-label="t('settings.profile.summaryAria')"
              ></textarea>
            </fieldset>

            <fieldset class="fieldset md:col-span-2">
              <legend class="fieldset-legend">
                {{ t("settings.profile.technicalSkillsLegend") }}
              </legend>
              <input
                v-model="profileForm.technicalSkillsText"
                class="input w-full"
                :placeholder="t('settings.profile.technicalSkillsPlaceholder')"
                :aria-label="t('settings.profile.technicalSkillsAria')"
              />
            </fieldset>

            <fieldset class="fieldset md:col-span-2">
              <legend class="fieldset-legend">
                {{ t("settings.profile.softSkillsLegend") }}
              </legend>
              <input
                v-model="profileForm.softSkillsText"
                class="input w-full"
                :placeholder="t('settings.profile.softSkillsPlaceholder')"
                :aria-label="t('settings.profile.softSkillsAria')"
              />
            </fieldset>
          </SectionGrid>

          <div class="card-actions justify-end">
            <button
              class="btn btn-primary"
              :aria-label="t('settings.profile.saveAria')"
              :disabled="profileSaveState === 'saving'"
              @click="handleSaveProfile"
            >
              <span
                v-if="profileSaveState === 'saving'"
                class="loading loading-spinner loading-xs"
              ></span>
              {{ t("settings.profile.saveButton") }}
            </button>
          </div>
        </div>
      </div>

      <div class="card card-border bg-base-100 shadow-sm">
        <div class="card-body gap-6">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="card-title">{{ t("settings.brand.title") }}</h2>
              <p class="text-sm text-base-content/70">
                {{ t("settings.brand.subtitle") }}
              </p>
            </div>
            <span
              class="badge"
              :class="
                brandSaveState === 'success'
                  ? 'badge-success'
                  : brandSaveState === 'error'
                    ? 'badge-error'
                    : 'badge-ghost'
              "
              role="status"
              aria-live="polite"
            >
              {{ saveStateLabel(brandSaveState) }}
            </span>
          </div>

          <div role="alert" class="alert alert-info alert-soft">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 class="font-semibold">{{ t("settings.brand.infoTitle") }}</h3>
              <p class="text-sm">{{ t("settings.brand.infoDescription") }}</p>
            </div>
          </div>

          <SectionGrid
            grid-token="twoColumnWide"
            extra-class="items-start gap-6"
          >
            <div class="space-y-4 xl:sticky xl:top-24">
              <div class="card card-border bg-base-200/30 shadow-sm">
                <div class="card-body gap-4">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p
                        class="text-xs font-semibold uppercase tracking-[0.24em] text-base-content/45"
                      >
                        {{ t("settings.brand.previewEyebrow") }}
                      </p>
                      <h3 class="card-title mt-2">
                        {{ t("settings.brand.previewTitle") }}
                      </h3>
                      <p class="text-sm text-base-content/70">
                        {{ t("settings.brand.previewSubtitle") }}
                      </p>
                    </div>
                    <span class="badge badge-outline">{{
                      brandDraft.assistantName
                    }}</span>
                  </div>

                  <div
                    class="rounded-box border border-base-300/60 p-5 shadow-sm"
                    :style="brandPreviewShellStyle"
                  >
                    <div class="flex items-center gap-3">
                      <img
                        v-if="brandDraft.logoPath.length > 0"
                        :src="brandDraft.logoPath"
                        :alt="
                          t('settings.brand.previewLogoAlt', {
                            brand: brandDraft.name,
                          })
                        "
                        class="h-10 w-10 rounded-box border border-white/20 bg-white/80 object-contain p-1 shadow-sm"
                      />
                      <div
                        v-else
                        class="flex h-10 w-10 items-center justify-center rounded-box border border-white/20 bg-white/80 text-sm font-semibold shadow-sm"
                      >
                        {{ brandPreviewInitial }}
                      </div>
                      <div class="min-w-0">
                        <p
                          class="text-xs uppercase tracking-[0.2em] opacity-60"
                        >
                          {{ t("settings.brand.previewEyebrow") }}
                        </p>
                        <p class="truncate text-sm font-medium opacity-80">
                          {{ brandDraft.apiName }}
                        </p>
                      </div>
                    </div>

                    <div class="mt-5 space-y-2">
                      <h4
                        class="text-2xl font-semibold"
                        :style="brandPreviewHeadingStyle"
                      >
                        {{ brandDraft.name }}
                      </h4>
                      <p class="max-w-md text-sm opacity-80">
                        {{ brandDraft.content.tagline }}
                      </p>
                      <p class="max-w-md text-xs text-base-content/60">
                        {{ brandDraft.content.defaultDescription }}
                      </p>
                    </div>

                    <div class="mt-5 flex flex-wrap gap-2">
                      <span
                        class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                        :style="brandPreviewPrimaryBadgeStyle"
                      >
                        {{ brandDraft.assistantName }}
                      </span>
                      <span
                        class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                        :style="brandPreviewSecondaryBadgeStyle"
                      >
                        {{ brandDraft.apiName }}
                      </span>
                    </div>

                    <div class="mt-6 flex flex-wrap gap-3">
                      <span
                        class="inline-flex items-center rounded-field px-4 py-2 text-sm font-medium shadow-sm"
                        :style="brandPreviewPrimaryActionStyle"
                      >
                        {{ t("settings.brand.previewPrimaryAction") }}
                      </span>
                      <span
                        class="inline-flex items-center rounded-field border px-4 py-2 text-sm font-medium"
                        :style="brandPreviewSecondaryActionStyle"
                      >
                        {{ t("settings.brand.previewSecondaryAction") }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="stats stats-vertical border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal xl:stats-vertical"
              >
                <div class="stat">
                  <div class="stat-title">
                    {{ t("settings.brand.stats.product") }}
                  </div>
                  <div class="stat-value text-lg">{{ brandDraft.name }}</div>
                  <div class="stat-desc">
                    {{ t("settings.brand.stats.productDescription") }}
                  </div>
                </div>
                <div class="stat">
                  <div class="stat-title">
                    {{ t("settings.brand.stats.assistant") }}
                  </div>
                  <div class="stat-value text-lg">
                    {{ brandDraft.assistantName }}
                  </div>
                  <div class="stat-desc">
                    {{ t("settings.brand.stats.assistantDescription") }}
                  </div>
                </div>
                <div class="stat">
                  <div class="stat-title">
                    {{ t("settings.brand.stats.locales") }}
                  </div>
                  <div class="stat-value text-lg">
                    {{ languageOptions.length }}
                  </div>
                  <div class="stat-desc">
                    {{ t("settings.brand.stats.localesDescription") }}
                  </div>
                </div>
                <div class="stat">
                  <div class="stat-title">
                    {{ t("settings.brand.stats.overrides") }}
                  </div>
                  <div class="stat-value text-lg">{{ brandOverrideCount }}</div>
                  <div class="stat-desc">
                    {{ t("settings.brand.stats.overridesDescription") }}
                  </div>
                </div>
              </div>

              <SectionGrid grid-token="twoColumn" extra-class="gap-3">
                <div
                  class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm"
                >
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <h4 class="font-medium">
                      {{ t("settings.brand.lightThemeLegend") }}
                    </h4>
                    <span class="badge badge-ghost">{{
                      THEME_NAMES.light
                    }}</span>
                  </div>
                  <div
                    class="h-20 rounded-box border border-base-300/70 shadow-inner"
                    :style="brandLightSwatchStyle"
                  ></div>
                </div>
                <div
                  class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm"
                >
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <h4 class="font-medium">
                      {{ t("settings.brand.darkThemeLegend") }}
                    </h4>
                    <span class="badge badge-ghost">{{
                      THEME_NAMES.dark
                    }}</span>
                  </div>
                  <div
                    class="h-20 rounded-box border border-base-300/70 shadow-inner"
                    :style="brandDarkSwatchStyle"
                  ></div>
                </div>
              </SectionGrid>
            </div>

            <div class="space-y-4">
              <div
                role="tablist"
                class="tabs tabs-border tabs-sm gap-2 overflow-x-auto whitespace-nowrap md:tabs-md"
                :aria-label="t('settings.brand.editorTabsAria')"
              >
                <button
                  v-for="panel in BRAND_EDITOR_PANELS"
                  :id="`brand-tab-${panel.id}`"
                  :key="panel.id"
                  type="button"
                  role="tab"
                  class="tab"
                  :class="{ 'tab-active': brandEditorPanel === panel.id }"
                  :aria-label="t(panel.labelKey)"
                  :aria-selected="brandEditorPanel === panel.id"
                  :aria-controls="`brand-panel-${panel.id}`"
                  :tabindex="brandEditorPanel === panel.id ? 0 : -1"
                  @click="setBrandEditorPanel(panel.id)"
                  @keydown="handleBrandTabKeydown($event, panel.id)"
                >
                  {{ t(panel.labelKey) }}
                </button>
              </div>

              <div
                v-show="brandEditorPanel === 'identity'"
                id="brand-panel-identity"
                role="tabpanel"
                aria-labelledby="brand-tab-identity"
                :aria-hidden="brandEditorPanel !== 'identity'"
                class="card card-border bg-base-100 shadow-sm"
              >
                <div class="card-body gap-4 p-4 md:p-6">
                  <p class="text-sm text-base-content/70">
                    {{ t("settings.brand.tabs.identityDescription") }}
                  </p>
                  <SectionGrid grid-token="twoColumn" extra-class="gap-4">
                    <fieldset :class="brandFieldsetClass">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.nameLegend") }}
                      </legend>
                      <input
                        v-model="brandForm.name"
                        class="input min-w-0 w-full"
                        :aria-label="t('settings.brand.nameAria')"
                      />
                    </fieldset>

                    <fieldset :class="brandFieldsetClass">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.assistantNameLegend") }}
                      </legend>
                      <input
                        v-model="brandForm.assistantName"
                        class="input min-w-0 w-full"
                        :aria-label="t('settings.brand.assistantNameAria')"
                      />
                    </fieldset>

                    <fieldset :class="brandFieldsetClass">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.apiNameLegend") }}
                      </legend>
                      <input
                        v-model="brandForm.apiName"
                        class="input min-w-0 w-full"
                        :aria-label="t('settings.brand.apiNameAria')"
                      />
                    </fieldset>

                    <fieldset :class="brandFieldsetClass">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.taglineLegend") }}
                      </legend>
                      <input
                        v-model="brandForm.tagline"
                        class="input min-w-0 w-full"
                        :aria-label="t('settings.brand.taglineAria')"
                      />
                    </fieldset>

                    <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.logoPathLegend") }}
                      </legend>
                      <input
                        v-model="brandForm.logoPath"
                        class="input min-w-0 w-full"
                        :placeholder="t('settings.brand.assetPathPlaceholder')"
                        :aria-describedby="BRAND_HINT_IDS.logoPath"
                        :aria-label="t('settings.brand.logoPathAria')"
                      />
                      <p :id="BRAND_HINT_IDS.logoPath" class="label whitespace-normal">
                        {{ t("settings.brand.assetPathHint") }}
                      </p>
                    </fieldset>

                    <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.faviconPathLegend") }}
                      </legend>
                      <input
                        v-model="brandForm.faviconPath"
                        class="input min-w-0 w-full"
                        :placeholder="t('settings.brand.assetPathPlaceholder')"
                        :aria-describedby="BRAND_HINT_IDS.faviconPath"
                        :aria-label="t('settings.brand.faviconPathAria')"
                      />
                      <p :id="BRAND_HINT_IDS.faviconPath" class="label whitespace-normal">
                        {{ t("settings.brand.assetPathHint") }}
                      </p>
                    </fieldset>
                  </SectionGrid>
                </div>
              </div>

              <div
                v-show="brandEditorPanel === 'typography'"
                id="brand-panel-typography"
                role="tabpanel"
                aria-labelledby="brand-tab-typography"
                :aria-hidden="brandEditorPanel !== 'typography'"
                class="card card-border bg-base-100 shadow-sm"
              >
                <div class="card-body gap-4 p-4 md:p-6">
                  <p class="text-sm text-base-content/70">
                    {{ t("settings.brand.tabs.typographyDescription") }}
                  </p>
                  <SectionGrid grid-token="twoColumn" extra-class="gap-4">
                    <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.fontStylesheetLegend") }}
                      </legend>
                      <input
                        v-model="brandForm.fontStylesheetUrl"
                        class="input min-w-0 w-full"
                        :aria-describedby="BRAND_HINT_IDS.fontStylesheet"
                        :placeholder="
                          t('settings.brand.fontStylesheetPlaceholder')
                        "
                        :aria-label="t('settings.brand.fontStylesheetAria')"
                      />
                      <p :id="BRAND_HINT_IDS.fontStylesheet" class="label whitespace-normal">
                        {{ t("settings.brand.fontStylesheetHint") }}
                      </p>
                    </fieldset>

                    <fieldset :class="brandFieldsetClass">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.displayFontLegend") }}
                      </legend>
                      <input
                        v-model="brandForm.displayFontFamily"
                        class="input min-w-0 w-full"
                        :aria-label="t('settings.brand.displayFontAria')"
                      />
                    </fieldset>

                    <fieldset :class="brandFieldsetClass">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.bodyFontLegend") }}
                      </legend>
                      <input
                        v-model="brandForm.bodyFontFamily"
                        class="input min-w-0 w-full"
                        :aria-label="t('settings.brand.bodyFontAria')"
                      />
                    </fieldset>

                    <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.monoFontLegend") }}
                      </legend>
                      <input
                        v-model="brandForm.monoFontFamily"
                        class="input min-w-0 w-full"
                        :aria-label="t('settings.brand.monoFontAria')"
                      />
                    </fieldset>
                  </SectionGrid>
                </div>
              </div>

              <div
                v-show="brandEditorPanel === 'themes'"
                id="brand-panel-themes"
                role="tabpanel"
                aria-labelledby="brand-tab-themes"
                :aria-hidden="brandEditorPanel !== 'themes'"
                class="card card-border bg-base-100 shadow-sm"
              >
                <div class="card-body gap-4 p-4 md:p-6">
                  <p class="text-sm text-base-content/70">
                    {{ t("settings.brand.tabs.themesDescription") }}
                  </p>
                  <SectionGrid grid-token="twoColumn" extra-class="gap-4">
                    <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.lightThemeLegend") }}
                      </legend>
                      <textarea
                        v-model="brandForm.lightThemeJson"
                        class="textarea font-mono min-w-0 w-full"
                        rows="12"
                        :aria-describedby="BRAND_HINT_IDS.lightTheme"
                        :aria-label="t('settings.brand.lightThemeAria')"
                      ></textarea>
                      <p :id="BRAND_HINT_IDS.lightTheme" class="label whitespace-normal">
                        {{ t("settings.brand.themeJsonHint") }}
                      </p>
                    </fieldset>

                    <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.darkThemeLegend") }}
                      </legend>
                      <textarea
                        v-model="brandForm.darkThemeJson"
                        class="textarea font-mono min-w-0 w-full"
                        rows="12"
                        :aria-describedby="BRAND_HINT_IDS.darkTheme"
                        :aria-label="t('settings.brand.darkThemeAria')"
                      ></textarea>
                      <p :id="BRAND_HINT_IDS.darkTheme" class="label whitespace-normal">
                        {{ t("settings.brand.themeJsonHint") }}
                      </p>
                    </fieldset>
                  </SectionGrid>
                </div>
              </div>

              <div
                v-show="brandEditorPanel === 'content'"
                id="brand-panel-content"
                role="tabpanel"
                aria-labelledby="brand-tab-content"
                :aria-hidden="brandEditorPanel !== 'content'"
                class="card card-border bg-base-100 shadow-sm"
              >
                <div class="card-body gap-4 p-4 md:p-6">
                  <p class="text-sm text-base-content/70">
                    {{ t("settings.brand.tabs.contentDescription") }}
                  </p>
                  <SectionGrid grid-token="twoColumn" extra-class="gap-4">
                    <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.defaultTitleLegend") }}
                      </legend>
                      <input
                        v-model="brandForm.defaultTitle"
                        class="input min-w-0 w-full"
                        :aria-label="t('settings.brand.defaultTitleAria')"
                      />
                    </fieldset>

                    <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.defaultDescriptionLegend") }}
                      </legend>
                      <textarea
                        v-model="brandForm.defaultDescription"
                        class="textarea min-w-0 w-full"
                        rows="4"
                        :aria-label="t('settings.brand.defaultDescriptionAria')"
                      ></textarea>
                    </fieldset>

                    <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
                      <legend class="fieldset-legend text-sm font-semibold">
                        {{ t("settings.brand.contentOverridesLegend") }}
                      </legend>
                      <textarea
                        v-model="brandForm.contentOverridesJson"
                        class="textarea font-mono min-w-0 w-full"
                        rows="10"
                        :aria-describedby="BRAND_HINT_IDS.contentOverrides"
                        :aria-label="t('settings.brand.contentOverridesAria')"
                      ></textarea>
                      <p :id="BRAND_HINT_IDS.contentOverrides" class="label whitespace-normal">
                        {{ t("settings.brand.contentOverridesHint") }}
                      </p>
                    </fieldset>
                  </SectionGrid>
                </div>
              </div>

              <div class="card-actions justify-end pt-2">
                <button
                  class="btn btn-primary"
                  :aria-label="t('settings.brand.saveAria')"
                  :disabled="brandSaveState === 'saving'"
                  @click="handleSaveBrand"
                >
                  <span
                    v-if="brandSaveState === 'saving'"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  {{ t("settings.brand.saveButton") }}
                </button>
              </div>
            </div>
          </SectionGrid>
        </div>
      </div>

      <div class="divider divider-primary">
        {{ t("settings.preferences.title") }}
      </div>

      <SectionGrid grid-token="twoColumnXl">
        <div class="card card-border bg-base-100">
          <div class="card-body">
            <h2 class="card-title">{{ t("settings.preferences.title") }}</h2>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span>{{ t("settings.preferences.themeLabel") }}</span>
                <label class="flex items-center gap-3 cursor-pointer">
                  <span class="text-sm">{{
                    t("settings.preferences.lightTheme")
                  }}</span>
                  <input
                    type="checkbox"
                    class="toggle toggle-primary theme-controller"
                    :value="THEME_NAMES.dark"
                    :checked="theme === THEME_NAMES.dark"
                    :aria-label="t('settings.preferences.toggleThemeAria')"
                    @change="handleToggleTheme"
                  />
                  <span class="text-sm">{{
                    t("settings.preferences.darkTheme")
                  }}</span>
                </label>
              </div>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  {{ t("settings.preferences.languageLegend") }}
                </legend>
                <select
                  v-model="preferencesLanguage"
                  class="select w-full"
                  :aria-label="t('settings.preferences.languageAria')"
                >
                  <option
                    v-for="option in languageOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  {{ t("settings.preferences.notificationsLegend") }}
                </legend>
                <label class="label cursor-pointer justify-start gap-3">
                  <input
                    v-model="notificationForm.achievements"
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :aria-label="
                      t('settings.preferences.notifications.achievementsAria')
                    "
                  />
                  <span class="label">{{
                    t("settings.preferences.notifications.achievements")
                  }}</span>
                </label>
                <label class="label cursor-pointer justify-start gap-3">
                  <input
                    v-model="notificationForm.dailyChallenges"
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :aria-label="
                      t(
                        'settings.preferences.notifications.dailyChallengesAria',
                      )
                    "
                  />
                  <span class="label">{{
                    t("settings.preferences.notifications.dailyChallenges")
                  }}</span>
                </label>
                <label class="label cursor-pointer justify-start gap-3">
                  <input
                    v-model="notificationForm.levelUp"
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :aria-label="
                      t('settings.preferences.notifications.levelUpAria')
                    "
                  />
                  <span class="label">{{
                    t("settings.preferences.notifications.levelUp")
                  }}</span>
                </label>
                <label class="label cursor-pointer justify-start gap-3">
                  <input
                    v-model="notificationForm.jobAlerts"
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :aria-label="
                      t('settings.preferences.notifications.jobAlertsAria')
                    "
                  />
                  <span class="label">{{
                    t("settings.preferences.notifications.jobAlerts")
                  }}</span>
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
                <span
                  v-if="preferencesSaveState === 'saving'"
                  class="loading loading-spinner loading-xs"
                ></span>
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
                  <span class="font-medium">{{
                    t("settings.automation.headlessTitle")
                  }}</span>
                  <p class="text-sm text-base-content/60">
                    {{ t("settings.automation.headlessDescription") }}
                  </p>
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
                  <span class="font-medium">{{
                    t("settings.automation.smartSelectorsTitle")
                  }}</span>
                  <p class="text-sm text-base-content/60">
                    {{ t("settings.automation.smartSelectorsDescription") }}
                  </p>
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
                  <span class="font-medium">{{
                    t("settings.automation.autoScreenshotsTitle")
                  }}</span>
                  <p class="text-sm text-base-content/60">
                    {{ t("settings.automation.autoScreenshotsDescription") }}
                  </p>
                </div>
                <input
                  v-model="automationForm.autoSaveScreenshots"
                  type="checkbox"
                  class="toggle toggle-primary"
                  :aria-label="t('settings.automation.autoScreenshotsAria')"
                />
              </div>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  {{ t("settings.automation.timeoutLegend") }}
                </legend>
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
                <legend class="fieldset-legend">
                  {{ t("settings.automation.retentionLegend") }}
                </legend>
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
                <legend class="fieldset-legend">
                  {{ t("settings.automation.concurrentRunsLegend") }}
                </legend>
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
                <legend class="fieldset-legend">
                  {{ t("settings.automation.defaultBrowserLegend") }}
                </legend>
                <select
                  v-model="automationForm.defaultBrowser"
                  class="select w-full"
                  :aria-label="t('settings.automation.defaultBrowserAria')"
                >
                  <option
                    v-for="browser in automationBrowserOptions"
                    :key="browser"
                    :value="browser"
                  >
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

        <div class="card card-border bg-base-100">
          <div class="card-body">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="card-title">
                  {{ t("settings.emailDelivery.title") }}
                </h2>
                <p class="text-sm text-base-content/70">
                  {{ t("settings.emailDelivery.subtitle") }}
                </p>
              </div>
              <span
                class="badge"
                :class="
                  emailDeliveryConfigured ? 'badge-success' : 'badge-warning'
                "
              >
                {{
                  emailDeliveryConfigured
                    ? t("settings.emailDelivery.configuredBadge")
                    : t("settings.emailDelivery.incompleteBadge")
                }}
              </span>
            </div>

            <div class="space-y-4">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  {{ t("settings.emailDelivery.hostLegend") }}
                </legend>
                <input
                  v-model="emailTransportForm.host"
                  class="input w-full"
                  type="text"
                  :placeholder="t('settings.emailDelivery.hostPlaceholder')"
                  :aria-label="t('settings.emailDelivery.hostAria')"
                />
              </fieldset>

              <SectionGrid grid-token="twoColumn">
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">
                    {{ t("settings.emailDelivery.portLegend") }}
                  </legend>
                  <input
                    v-model.number="emailTransportForm.port"
                    class="input w-full"
                    type="number"
                    min="1"
                    max="65535"
                    :aria-label="t('settings.emailDelivery.portAria')"
                  />
                </fieldset>

                <fieldset class="fieldset">
                  <legend class="fieldset-legend">
                    {{ t("settings.emailDelivery.timeoutLegend") }}
                  </legend>
                  <input
                    v-model.number="emailTransportForm.connectionTimeoutSeconds"
                    class="input w-full"
                    type="number"
                    min="1"
                    max="120"
                    :aria-label="t('settings.emailDelivery.timeoutAria')"
                  />
                </fieldset>
              </SectionGrid>

              <SectionGrid grid-token="twoColumn">
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">
                    {{ t("settings.emailDelivery.securityLegend") }}
                  </legend>
                  <select
                    v-model="emailTransportForm.security"
                    class="select w-full"
                    :aria-label="t('settings.emailDelivery.securityAria')"
                  >
                    <option
                      v-for="security in emailTransportSecurityOptions"
                      :key="security"
                      :value="security"
                    >
                      {{ emailTransportSecurityLabel(security) }}
                    </option>
                  </select>
                </fieldset>

                <fieldset class="fieldset">
                  <legend class="fieldset-legend">
                    {{ t("settings.emailDelivery.authLegend") }}
                  </legend>
                  <select
                    v-model="emailTransportForm.authMethod"
                    class="select w-full"
                    :aria-label="t('settings.emailDelivery.authAria')"
                  >
                    <option
                      v-for="authMode in emailTransportAuthModeOptions"
                      :key="authMode"
                      :value="authMode"
                    >
                      {{ emailTransportAuthModeLabel(authMode) }}
                    </option>
                  </select>
                </fieldset>
              </SectionGrid>

              <SectionGrid grid-token="twoColumn">
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">
                    {{ t("settings.emailDelivery.usernameLegend") }}
                  </legend>
                  <input
                    v-model="emailTransportForm.username"
                    class="input w-full"
                    type="text"
                    :placeholder="
                      t('settings.emailDelivery.usernamePlaceholder')
                    "
                    :aria-label="t('settings.emailDelivery.usernameAria')"
                  />
                </fieldset>

                <fieldset class="fieldset">
                  <legend class="fieldset-legend">
                    {{ t("settings.emailDelivery.fromNameLegend") }}
                  </legend>
                  <input
                    v-model="emailTransportForm.fromName"
                    class="input w-full"
                    type="text"
                    :placeholder="
                      t('settings.emailDelivery.fromNamePlaceholder', {
                        brand: resolvedBrand.name,
                      })
                    "
                    :aria-label="t('settings.emailDelivery.fromNameAria')"
                  />
                </fieldset>
              </SectionGrid>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  {{ t("settings.emailDelivery.fromEmailLegend") }}
                </legend>
                <input
                  v-model="emailTransportForm.fromEmail"
                  class="input w-full"
                  type="email"
                  :placeholder="
                    t('settings.emailDelivery.fromEmailPlaceholder')
                  "
                  :aria-label="t('settings.emailDelivery.fromEmailAria')"
                />
                <p class="label">
                  {{ t("settings.emailDelivery.fromEmailHint") }}
                </p>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  {{ t("settings.emailDelivery.passwordLegend") }}
                </legend>
                <input
                  v-model="emailTransportPasswordDraft"
                  class="input w-full"
                  type="password"
                  :placeholder="t('settings.emailDelivery.passwordPlaceholder')"
                  :aria-label="t('settings.emailDelivery.passwordAria')"
                />
                <p class="label">
                  {{
                    settings?.hasEmailTransportPassword
                      ? t("settings.emailDelivery.passwordStoredHint")
                      : t("settings.emailDelivery.passwordHint")
                  }}
                </p>
              </fieldset>
            </div>

            <div class="card-actions justify-end gap-2 mt-2">
              <button
                class="btn btn-outline"
                :disabled="!settings?.hasEmailTransportPassword"
                :aria-label="t('settings.emailDelivery.clearPasswordAria')"
                @click="handleClearEmailDeliveryPassword"
              >
                {{ t("settings.emailDelivery.clearPasswordButton") }}
              </button>
              <button
                class="btn btn-secondary"
                :aria-label="t('settings.emailDelivery.savePasswordAria')"
                @click="handleSaveEmailDeliveryPassword"
              >
                {{ t("settings.emailDelivery.savePasswordButton") }}
              </button>
              <button
                class="btn btn-primary"
                :aria-label="t('settings.emailDelivery.saveAria')"
                @click="handleSaveEmailDeliverySettings"
              >
                {{ t("settings.emailDelivery.saveButton") }}
              </button>
            </div>
          </div>
        </div>
      </SectionGrid>

      <div class="divider divider-primary">
        {{ t("settings.aiProviders.title") }}
      </div>

      <div class="card card-border bg-base-100">
        <div class="card-body">
          <h2 class="card-title">{{ t("settings.aiProviders.title") }}</h2>
          <p class="text-sm text-base-content/70 mb-3">
            {{ t("settings.aiProviders.subtitle") }}
          </p>

          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">
              {{ t("settings.aiProviders.preferredProviderLegend") }}
            </legend>
            <select
              v-model="preferredProviderSelection"
              class="select w-full"
              :aria-label="t('settings.aiProviders.preferredProviderAria')"
              @change="handleSavePreferredProvider"
            >
              <option
                v-for="provider in providerInputs"
                :key="provider.id"
                :value="provider.id"
              >
                {{ provider.label }}
              </option>
            </select>
            <p class="text-xs text-base-content/50 mt-1">
              {{ t("settings.aiProviders.preferredProviderHint") }}
            </p>
          </fieldset>

          <div
            v-if="showOllamaHotTip"
            role="alert"
            class="alert alert-info alert-soft alert-vertical mb-4 sm:alert-horizontal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 class="font-semibold">
                {{ t("settings.aiProviders.ollamaTipTitle") }}
              </h3>
              <p class="text-sm">
                {{ t("settings.aiProviders.ollamaTipDescription") }}
                <NuxtLink
                  :to="OLLAMA_WEBSITE_URL"
                  target="_blank"
                  class="link link-primary"
                  :aria-label="t('settings.aiProviders.ollamaTipLinkAria')"
                >
                  {{ t("settings.aiProviders.ollamaTipLinkLabel") }}
                </NuxtLink>
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div
              v-for="provider in providerInputs"
              :key="provider.id"
              class="collapse collapse-arrow border border-base-300 bg-base-100"
            >
              <input
                type="radio"
                name="provider-accordion"
                :aria-label="
                  t('settings.aiProviders.expandAria', {
                    provider: provider.label,
                  })
                "
              />
              <div class="collapse-title font-medium flex items-center gap-2">
                <AIProviderIcon
                  :provider-id="provider.id"
                  class="h-5 w-5 text-primary"
                />
                {{ provider.label }}
                <span
                  v-if="isProviderConfigured(provider.id)"
                  class="badge badge-success badge-xs"
                >
                  {{ t("settings.aiProviders.configuredBadge") }}
                </span>
              </div>
              <div class="collapse-content space-y-3">
                <p class="text-sm text-base-content/60">
                  {{ provider.description }}
                </p>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">
                    {{ providerKeyLabel(provider.id) }}
                  </legend>
                  <div class="join w-full">
                    <input
                      v-model="apiKeys[provider.field]"
                      :type="provider.id === 'local' ? 'text' : 'password'"
                      :placeholder="
                        providerPlaceholder(provider.id, provider.label)
                      "
                      class="input join-item w-full"
                      :aria-label="providerKeyLabel(provider.id)"
                    />
                    <button
                      type="button"
                      class="btn btn-outline join-item"
                      :aria-label="t('settings.aiProviders.testAria')"
                      @click="handleTest(provider.id)"
                    >
                      <span
                        v-if="testingProvider === provider.id"
                        class="loading loading-spinner loading-xs"
                      ></span>
                      {{ t("settings.aiProviders.testButton") }}
                    </button>
                  </div>
                </fieldset>

                <fieldset v-if="provider.id === 'local'" class="fieldset">
                  <legend class="fieldset-legend">
                    {{ t("settings.aiProviders.localModelLegend") }}
                  </legend>
                  <input
                    v-model="apiKeys.localModelName"
                    type="text"
                    class="input w-full"
                    :placeholder="
                      t('settings.aiProviders.localModelPlaceholder')
                    "
                    :aria-label="t('settings.aiProviders.localModelAria')"
                  />
                </fieldset>

                <span
                  v-if="testResults[provider.id]"
                  class="badge"
                  :class="
                    testResults[provider.id]?.valid
                      ? 'badge-success'
                      : 'badge-error'
                  "
                >
                  {{
                    testResults[provider.id]?.valid
                      ? t("settings.aiProviders.connectedBadge")
                      : t("settings.aiProviders.failedBadge")
                  }}
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
  </PageScaffold>
</template>
