import { DEFAULT_AI_ROUTING } from "../constants/ai";
import {
  DEFAULT_EMAIL_TRANSPORT_CONNECTION_TIMEOUT_SECONDS,
  DEFAULT_SPEECH_SETTINGS,
} from "../constants/settings";
import type { AIRouting } from "./ai";
import type {
  AutomationSettings,
  EmailTransportSettings,
  JobProviderSettings,
  NotificationPreferences,
} from "./settings-contracts";

/**
 * Global settings row identifier.
 */
export const DEFAULT_SETTINGS_ID = "default";

/**
 * Default profile/entity ID for single-user mode (user profile, gamification, auth).
 */
export const DEFAULT_PROFILE_ID = "default";

/**
 * Default notification preferences.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  achievements: true,
  dailyChallenges: true,
  levelUp: true,
  jobAlerts: true,
};

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

/**
 * Default runtime job-provider settings.
 * External boards are disabled until the user opts in via Settings.
 */
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
 * Canonical settings-level AI routing default.
 */
export const DEFAULT_APP_AI_ROUTING: AIRouting = DEFAULT_AI_ROUTING;
