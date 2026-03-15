/**
 * App settings types for single-user local-first app.
 */

import type {
  AppLanguageCode,
  AutomationBrowserOption,
  EmailTransportAuthModeOption,
  EmailTransportSecurityOption,
  SpeechProviderOption,
} from "../constants/settings";
import {
  DEFAULT_EMAIL_TRANSPORT_CONNECTION_TIMEOUT_SECONDS,
  DEFAULT_SPEECH_SETTINGS,
} from "../constants/settings";
import type { AIProviderType } from "./ai";

/**
 * Per-provider model preferences.
 */
export type ProviderModelPreferences = Partial<Record<AIProviderType, string>>;

/**
 * Supported ATS types for company-board integrations.
 */
export type CompanyBoardATSType =
  | "greenhouse"
  | "lever"
  | "recruitee"
  | "workable"
  | "ashby"
  | "smartrecruiters"
  | "teamtailor"
  | "workday";

/**
 * Supported portal identifiers for gaming-board scraper providers.
 */
export type GamingPortalId =
  | "hitmarker"
  | "grackle"
  | "workwithindies"
  | "remotegamejobs"
  | "gamesjobsdirect"
  | "pocketgamer";

/**
 * Company-board source configuration.
 */
export interface CompanyBoardConfig {
  name: string;
  token: string;
  type: CompanyBoardATSType;
  enabled: boolean;
  priority: number;
}

/**
 * Greenhouse board source configuration.
 */
export interface GreenhouseBoardConfig {
  board: string;
  company: string;
  enabled: boolean;
}

/**
 * Lever company source configuration.
 */
export interface LeverCompanyConfig {
  slug: string;
  company: string;
  enabled: boolean;
}

/**
 * RPA gaming-portal source configuration.
 */
export interface GamingPortalConfig {
  id: GamingPortalId;
  name: string;
  source: string;
  fallbackUrl: string;
  enabled: boolean;
}

/**
 * Runtime job-provider settings persisted in `settings.automationSettings.jobProviders`.
 */
export interface JobProviderSettings {
  providerTimeoutMs: number;
  companyBoardResultLimit: number;
  gamingBoardResultLimit: number;
  unknownLocationLabel: string;
  unknownCompanyLabel: string;
  hitmarkerApiBaseUrl: string;
  hitmarkerDefaultQuery: string;
  hitmarkerDefaultLocation: string;
  greenhouseApiBaseUrl: string;
  greenhouseMaxPages: number;
  greenhouseBoards: GreenhouseBoardConfig[];
  leverApiBaseUrl: string;
  leverMaxPages: number;
  leverCompanies: LeverCompanyConfig[];
  companyBoardApiTemplates: Record<CompanyBoardATSType, string>;
  companyBoards: CompanyBoardConfig[];
  gamingPortals: GamingPortalConfig[];
}

/**
 * STT engine configuration.
 */
export interface SpeechToTextSettings {
  provider: SpeechProviderOption;
  model: string;
  endpoint: string;
}

/**
 * TTS engine configuration.
 */
export interface TextToSpeechSettings {
  provider: SpeechProviderOption;
  model: string;
  endpoint: string;
  voice: string;
  format: "mp3" | "wav";
}

/**
 * Runtime voice settings used by chat/interview speech features.
 */
export interface SpeechSettings {
  locale: string;
  stt: SpeechToTextSettings;
  tts: TextToSpeechSettings;
}

/**
 * Automation and browser runner settings.
 */
export interface AutomationSettings {
  headless: boolean;
  defaultTimeout: number;
  screenshotRetention: number;
  maxConcurrentRuns: number;
  defaultBrowser: AutomationBrowserOption;
  enableSmartSelectors: boolean;
  autoSaveScreenshots: boolean;
  speech: SpeechSettings;
  jobProviders?: JobProviderSettings;
}

/**
 * Outbound SMTP delivery settings.
 */
export interface EmailTransportSettings {
  host: string;
  port: number;
  security: EmailTransportSecurityOption;
  username: string;
  fromEmail: string;
  fromName: string;
  authMethod: EmailTransportAuthModeOption;
  connectionTimeoutSeconds: number;
}

/**
 * Complete daisyUI palette tokens for one brand theme variant.
 */
export interface BrandThemePalette {
  base100: string;
  base200: string;
  base300: string;
  baseContent: string;
  primary: string;
  primaryContent: string;
  secondary: string;
  secondaryContent: string;
  accent: string;
  accentContent: string;
  neutral: string;
  neutralContent: string;
  info: string;
  infoContent: string;
  success: string;
  successContent: string;
  warning: string;
  warningContent: string;
  error: string;
  errorContent: string;
  radiusSelector: string;
  radiusField: string;
  radiusBox: string;
  sizeSelector: string;
  sizeField: string;
  border: string;
  depth: string;
  noise: string;
}

/**
 * Typography controls for the app shell and component surfaces.
 */
export interface BrandTypographySettings {
  fontStylesheetUrl: string;
  displayFontFamily: string;
  bodyFontFamily: string;
  monoFontFamily: string;
}

/**
 * Copy and metadata controls for white-label brand customization.
 */
export interface BrandContentSettings {
  tagline: string;
  defaultTitle: string;
  defaultDescription: string;
  contentOverrides: Record<string, string>;
}

/**
 * Persisted brand control-plane settings.
 */
export interface BrandSettings {
  name: string;
  assistantName: string;
  apiName: string;
  logoPath: string;
  faviconPath: string;
  typography: BrandTypographySettings;
  lightTheme: BrandThemePalette;
  darkTheme: BrandThemePalette;
  content: BrandContentSettings;
}

/**
 * Partial theme-token override payload for a white-label brand.
 */
export type BrandThemePalettePatch = Partial<BrandThemePalette>;

/**
 * Partial typography override payload for a white-label brand.
 */
export type BrandTypographySettingsPatch = Partial<BrandTypographySettings>;

/**
 * Partial content override payload for a white-label brand.
 */
export type BrandContentSettingsPatch = Partial<BrandContentSettings>;

/**
 * Patch payload used by the brand control plane.
 */
export type BrandSettingsPatch = Partial<
  Pick<BrandSettings, "name" | "assistantName" | "apiName" | "logoPath" | "faviconPath">
> & {
  typography?: BrandTypographySettingsPatch;
  lightTheme?: BrandThemePalettePatch;
  darkTheme?: BrandThemePalettePatch;
  content?: BrandContentSettingsPatch;
};

/**
 * Global settings row identifier.
 */
export const DEFAULT_SETTINGS_ID = "default";

/**
 * Default profile/entity ID for single-user mode (user profile, gamification, auth).
 */
export const DEFAULT_PROFILE_ID = "default";

/**
 * Notification preference settings.
 */
export interface NotificationPreferences {
  achievements: boolean;
  dailyChallenges: boolean;
  levelUp: boolean;
  jobAlerts: boolean;
}

/**
 * Default notification preferences.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  achievements: true,
  dailyChallenges: true,
  levelUp: true,
  jobAlerts: true,
};

/**
 * Default automation settings.
 */
export const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
  headless: true,
  defaultTimeout: 30,
  screenshotRetention: 7,
  maxConcurrentRuns: 1,
  defaultBrowser: "chrome",
  enableSmartSelectors: true,
  autoSaveScreenshots: true,
  speech: {
    locale: DEFAULT_SPEECH_SETTINGS.locale,
    stt: {
      provider: DEFAULT_SPEECH_SETTINGS.stt.provider,
      model: DEFAULT_SPEECH_SETTINGS.stt.model,
      endpoint: DEFAULT_SPEECH_SETTINGS.stt.endpoint,
    },
    tts: {
      provider: DEFAULT_SPEECH_SETTINGS.tts.provider,
      model: DEFAULT_SPEECH_SETTINGS.tts.model,
      endpoint: DEFAULT_SPEECH_SETTINGS.tts.endpoint,
      voice: DEFAULT_SPEECH_SETTINGS.tts.voice,
      format: DEFAULT_SPEECH_SETTINGS.tts.format,
    },
  },
};

/**
 * Default outbound email delivery settings.
 */
export const DEFAULT_EMAIL_TRANSPORT_SETTINGS: EmailTransportSettings = {
  host: "",
  port: 587,
  security: "starttls",
  username: "",
  fromEmail: "",
  fromName: "",
  authMethod: "plain",
  connectionTimeoutSeconds: DEFAULT_EMAIL_TRANSPORT_CONNECTION_TIMEOUT_SECONDS,
};

/**
 * Persisted application settings.
 */
export interface AppSettings {
  id: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
  huggingfaceToken?: string;
  localModelEndpoint?: string;
  localModelName?: string;
  preferredModel?: string;
  preferredModels?: ProviderModelPreferences;
  preferredProvider: AIProviderType;
  theme: "bao-light" | "bao-dark";
  language: AppLanguageCode;
  brandSettings?: BrandSettings;
  notifications: NotificationPreferences;
  automationSettings?: AutomationSettings;
  emailTransportSettings?: EmailTransportSettings;
  hasGeminiKey?: boolean;
  hasOpenaiKey?: boolean;
  hasClaudeKey?: boolean;
  hasHuggingfaceToken?: boolean;
  hasEmailTransportPassword?: boolean;
  hasLocalKey?: boolean;
}

/**
 * API key payload.
 */
export interface APIKeyConfig {
  provider: AIProviderType;
  key: string;
  valid?: boolean;
  lastTested?: string;
}
