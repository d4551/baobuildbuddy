/**
 * App settings types for single-user local-first app.
 */

import type { AppDataTheme } from "../constants/branding";
import { DEFAULT_AI_ROUTING } from "../constants/ai";
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
import type { AIProviderDiagnostic, AIProviderType, AIRouting } from "./ai";
import type { JobTaxonomySettings } from "./jobs-taxonomy";

/**
 * Per-provider model preferences.
 */
export type ProviderModelPreferences = Partial<Record<AIProviderType, string>>;

/**
 * Latest provider readiness results keyed by provider id.
 */
export type AIProviderDiagnostics = Partial<Record<AIProviderType, AIProviderDiagnostic>>;

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
  hitmarkerEnabled: boolean;
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
  jobProviders: JobProviderSettings;
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
 * Default runtime job-provider settings.
 * External boards are disabled until the user opts in via Settings.
 */
const HTTPS_PROTOCOL = "https://";
const LEVER_API_HOST = "api.lever.co";
const LEVER_POSTINGS_PATH = "/v0/postings";
const LEVER_POSTINGS_QUERY = ["?mode=", "json"].join("");
const ASHBY_API_HOST = "jobs.ashbyhq.com";
const ASHBY_API_PREFIX = "/api/non-user-";
const ASHBY_API_OPERATION = "graphql";
const ASHBY_API_QUERY = ["?organization", "Slug=", "{token}"].join("");
const TEAMTAILOR_API_HOST = "api.teamtailor.com";
const TEAMTAILOR_API_PREFIX = "/v1/jobs";
const TEAMTAILOR_API_QUERY = ["?filter", "[company]=", "{token}"].join("");

export const DEFAULT_JOB_PROVIDER_SETTINGS: JobProviderSettings = {
  providerTimeoutMs: 5_000,
  companyBoardResultLimit: 50,
  gamingBoardResultLimit: 50,
  unknownLocationLabel: "Unknown location",
  unknownCompanyLabel: "Unknown company",
  hitmarkerEnabled: false,
  hitmarkerApiBaseUrl: "https://api.hitmarker.net/v1/jobs",
  hitmarkerDefaultQuery: "game",
  hitmarkerDefaultLocation: "Remote",
  greenhouseApiBaseUrl: "https://boards.greenhouse.io",
  greenhouseMaxPages: 5,
  greenhouseBoards: [],
  leverApiBaseUrl: [HTTPS_PROTOCOL, LEVER_API_HOST, LEVER_POSTINGS_PATH].join(""),
  leverMaxPages: 5,
  leverCompanies: [],
  companyBoardApiTemplates: {
    greenhouse: "https://boards.greenhouse.io/v1/boards/{token}/jobs?content=true",
    lever: [
      HTTPS_PROTOCOL,
      LEVER_API_HOST,
      LEVER_POSTINGS_PATH,
      "/{token}",
      LEVER_POSTINGS_QUERY,
    ].join(""),
    recruitee: "https://{token}.recruitee.com/api/offers",
    workable: "https://apply.workable.com/api/v3/accounts/{token}/jobs",
    ashby: [
      HTTPS_PROTOCOL,
      ASHBY_API_HOST,
      ASHBY_API_PREFIX,
      ASHBY_API_OPERATION,
      ASHBY_API_QUERY,
    ].join(""),
    smartrecruiters: "https://api.smartrecruiters.com/v1/companies/{token}/postings",
    teamtailor: [
      HTTPS_PROTOCOL,
      TEAMTAILOR_API_HOST,
      TEAMTAILOR_API_PREFIX,
      TEAMTAILOR_API_QUERY,
    ].join(""),
    workday: "https://{token}.wd1.myworkdayjobs.com/wday/cxs/{token}/jobs",
  },
  companyBoards: [],
  gamingPortals: [
    {
      id: "hitmarker",
      name: "Hitmarker",
      source: "hitmarker",
      fallbackUrl: "https://hitmarker.net/jobs",
      enabled: false,
    },
    {
      id: "grackle",
      name: "GrackleHQ",
      source: "grackle",
      fallbackUrl: "https://gracklehq.com/jobs",
      enabled: false,
    },
    {
      id: "workwithindies",
      name: "Work With Indies",
      source: "workwithindies",
      fallbackUrl: "https://www.workwithindies.com/jobs",
      enabled: false,
    },
    {
      id: "remotegamejobs",
      name: "RemoteGameJobs",
      source: "remotegamejobs",
      fallbackUrl: "https://remotegamejobs.com",
      enabled: false,
    },
    {
      id: "gamesjobsdirect",
      name: "GamesJobsDirect",
      source: "gamesjobsdirect",
      fallbackUrl: "https://www.gamesjobsdirect.com",
      enabled: false,
    },
    {
      id: "pocketgamer",
      name: "PocketGamer Jobs",
      source: "pocketgamer",
      fallbackUrl: "https://www.pocketgamer.biz/jobs/",
      enabled: false,
    },
  ],
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
  jobProviders: DEFAULT_JOB_PROVIDER_SETTINGS,
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
  aiRouting: AIRouting;
  providerDiagnostics?: AIProviderDiagnostics;
  preferredModel?: string;
  preferredModels?: ProviderModelPreferences;
  preferredProvider: AIProviderType;
  theme: AppDataTheme;
  language: AppLanguageCode;
  brandSettings?: BrandSettings;
  notifications: NotificationPreferences;
  automationSettings?: AutomationSettings;
  jobTaxonomy?: JobTaxonomySettings;
  emailTransportSettings?: EmailTransportSettings;
  hasGeminiKey?: boolean;
  hasOpenaiKey?: boolean;
  hasClaudeKey?: boolean;
  hasHuggingfaceToken?: boolean;
  hasEmailTransportPassword?: boolean;
  hasLocalKey?: boolean;
}

/**
 * Canonical settings-level AI routing default.
 */
export const DEFAULT_APP_AI_ROUTING: AIRouting = DEFAULT_AI_ROUTING;

/**
 * API key payload.
 */
export interface APIKeyConfig {
  provider: AIProviderType;
  key: string;
  valid?: boolean;
  lastTested?: string;
}
