/**
 * App settings types for single-user local-first app.
 */

import type { AppDataTheme } from "../constants/branding";
import type {
  AppLanguageCode,
  AutomationBrowserOption,
  EmailTransportAuthModeOption,
  EmailTransportSecurityOption,
  SpeechProviderOption,
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

export interface CompanyBoardConfig {
  name: string;
  token: string;
  type: CompanyBoardATSType;
  enabled: boolean;
  priority: number;
}

export interface GreenhouseBoardConfig {
  board: string;
  company: string;
  enabled: boolean;
}

export interface LeverCompanyConfig {
  slug: string;
  company: string;
  enabled: boolean;
}

export interface GamingPortalConfig {
  id: GamingPortalId;
  name: string;
  source: string;
  fallbackUrl: string;
  enabled: boolean;
}

export interface JobProviderSettings {
  providerTimeoutMs: number;
  companyBoardResultLimit: number;
  gamingBoardResultLimit: number;
  unknownLocationLabel: string;
  unknownCompanyLabel: string;
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

export interface SpeechToTextSettings {
  provider: SpeechProviderOption;
  model: string;
  endpoint: string;
}

export interface TextToSpeechSettings {
  provider: SpeechProviderOption;
  model: string;
  endpoint: string;
  voice: string;
  format: "mp3" | "wav";
}

export interface SpeechSettings {
  locale: string;
  stt: SpeechToTextSettings;
  tts: TextToSpeechSettings;
}

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

export interface BrandTypographySettings {
  fontStylesheetUrl: string;
  displayFontFamily: string;
  bodyFontFamily: string;
  monoFontFamily: string;
}

export interface BrandContentSettings {
  tagline: string;
  defaultTitle: string;
  defaultDescription: string;
  contentOverrides: Record<string, string>;
}

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

export type BrandThemePalettePatch = Partial<BrandThemePalette>;
export type BrandTypographySettingsPatch = Partial<BrandTypographySettings>;
export type BrandContentSettingsPatch = Partial<BrandContentSettings>;

export type BrandSettingsPatch = Partial<
  Pick<BrandSettings, "name" | "assistantName" | "apiName" | "logoPath" | "faviconPath">
> & {
  typography?: BrandTypographySettingsPatch;
  lightTheme?: BrandThemePalettePatch;
  darkTheme?: BrandThemePalettePatch;
  content?: BrandContentSettingsPatch;
};

export interface NotificationPreferences {
  achievements: boolean;
  dailyChallenges: boolean;
  levelUp: boolean;
  jobAlerts: boolean;
}

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

export interface APIKeyConfig {
  provider: AIProviderType;
  key: string;
  valid?: boolean;
  lastTested?: string;
}
