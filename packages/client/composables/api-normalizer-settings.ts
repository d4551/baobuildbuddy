import {
  APP_LANGUAGE_CODES,
  type AppSettings,
  type AutomationSettings,
  type EmailTransportSettings,
  DEFAULT_APP_AI_ROUTING,
  DEFAULT_APP_LANGUAGE,
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  DEFAULT_SPEECH_SETTINGS,
  asBoolean,
  asNumber,
  asRecord,
  asString,
  asStringArray,
  isRecord,
  normalizeAIRouting,
  normalizeAppDataTheme,
  resolveBrandSettings,
  SPEECH_PROVIDER_OPTIONS,
} from "@bao/shared";
import {
  asEnum,
  isProviderId,
  normalizeAIProvider,
  normalizeProviderDiagnosticCode,
} from "~/composables/api-normalizer-shared";

const SPEECH_AUDIO_FORMATS: readonly AutomationSettings["speech"]["tts"]["format"][] = [
  "mp3",
  "wav",
];

const COMPANY_BOARD_ATS_TYPES: readonly AutomationSettings["jobProviders"]["companyBoards"][number]["type"][] =
  [
    "greenhouse",
    "lever",
    "recruitee",
    "workable",
    "ashby",
    "smartrecruiters",
    "teamtailor",
    "workday",
  ];

const GAMING_PORTAL_IDS: readonly AutomationSettings["jobProviders"]["gamingPortals"][number]["id"][] =
  ["hitmarker", "grackle", "workwithindies", "remotegamejobs", "gamesjobsdirect", "pocketgamer"];

const normalizeAIRoutingValue = (
  value: unknown,
  preferredProvider: ReturnType<typeof normalizeAIProvider>,
) => {
  if (!isRecord(value)) {
    return normalizeAIRouting(DEFAULT_APP_AI_ROUTING, preferredProvider);
  }

  return normalizeAIRouting(
    Object.fromEntries(
      Object.entries(value).flatMap(([purpose, target]) => {
        if (!isRecord(target)) {
          return [];
        }
        return [
          [
            purpose,
            {
              provider: normalizeAIProvider(target.provider),
              model: asString(target.model),
            },
          ],
        ];
      }),
    ),
    preferredProvider,
  );
};

const normalizeProviderDiagnostics = (value: unknown) => {
  if (!isRecord(value)) {
    return;
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([providerId, entry]) => {
      if (!(isProviderId(providerId) && isRecord(entry))) {
        return [];
      }
      return [
        [
          providerId,
          {
            provider: normalizeAIProvider(entry.provider ?? providerId),
            code: normalizeProviderDiagnosticCode(entry.code),
            checkedAt: asString(entry.checkedAt) ?? new Date(0).toISOString(),
            endpoint: asString(entry.endpoint),
            selectedModel: asString(entry.selectedModel),
            availableModels: asStringArray(entry.availableModels),
            message: asString(entry.message),
          },
        ],
      ];
    }),
  );
};

const normalizeGreenhouseBoards = (
  value: unknown,
): AutomationSettings["jobProviders"]["greenhouseBoards"] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((board) => ({
        board: asString(board.board) ?? "",
        company: asString(board.company) ?? "",
        enabled: asBoolean(board.enabled) ?? false,
      }))
    : DEFAULT_AUTOMATION_SETTINGS.jobProviders.greenhouseBoards;

const normalizeLeverCompanies = (
  value: unknown,
): AutomationSettings["jobProviders"]["leverCompanies"] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((company) => ({
        slug: asString(company.slug) ?? "",
        company: asString(company.company) ?? "",
        enabled: asBoolean(company.enabled) ?? false,
      }))
    : DEFAULT_AUTOMATION_SETTINGS.jobProviders.leverCompanies;

const normalizeCompanyBoardTemplates = (
  value: unknown,
): AutomationSettings["jobProviders"]["companyBoardApiTemplates"] => {
  if (!isRecord(value)) {
    return DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates;
  }

  return {
    greenhouse:
      asString(value.greenhouse) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.greenhouse,
    lever:
      asString(value.lever) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.lever,
    recruitee:
      asString(value.recruitee) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.recruitee,
    workable:
      asString(value.workable) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.workable,
    ashby:
      asString(value.ashby) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.ashby,
    smartrecruiters:
      asString(value.smartrecruiters) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.smartrecruiters,
    teamtailor:
      asString(value.teamtailor) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.teamtailor,
    workday:
      asString(value.workday) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.workday,
  };
};

const normalizeCompanyBoards = (
  value: unknown,
): AutomationSettings["jobProviders"]["companyBoards"] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((board) => ({
        name: asString(board.name) ?? "",
        token: asString(board.token) ?? "",
        type: asEnum(board.type, COMPANY_BOARD_ATS_TYPES) ?? "greenhouse",
        enabled: asBoolean(board.enabled) ?? false,
        priority: asNumber(board.priority) ?? 0,
      }))
    : DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoards;

const normalizeGamingPortals = (
  value: unknown,
): AutomationSettings["jobProviders"]["gamingPortals"] => {
  if (!Array.isArray(value)) {
    return DEFAULT_AUTOMATION_SETTINGS.jobProviders.gamingPortals;
  }

  const configuredPortals = value.filter(isRecord);
  return DEFAULT_AUTOMATION_SETTINGS.jobProviders.gamingPortals.map((defaultPortal, index) => {
    const matchedPortal =
      configuredPortals.find(
        (portal) => asEnum(portal.id, GAMING_PORTAL_IDS) === defaultPortal.id,
      ) ?? configuredPortals[index];

    return {
      id: defaultPortal.id,
      name: asString(matchedPortal?.name) ?? defaultPortal.name,
      source: asString(matchedPortal?.source) ?? defaultPortal.source,
      fallbackUrl: asString(matchedPortal?.fallbackUrl) ?? defaultPortal.fallbackUrl,
      enabled: asBoolean(matchedPortal?.enabled) ?? defaultPortal.enabled,
    };
  });
};

const normalizeJobProviderSettings = (value: unknown): AutomationSettings["jobProviders"] => {
  if (!isRecord(value)) {
    return DEFAULT_AUTOMATION_SETTINGS.jobProviders;
  }

  return {
    ...DEFAULT_AUTOMATION_SETTINGS.jobProviders,
    providerTimeoutMs:
      asNumber(value.providerTimeoutMs) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.providerTimeoutMs,
    companyBoardResultLimit:
      asNumber(value.companyBoardResultLimit) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardResultLimit,
    gamingBoardResultLimit:
      asNumber(value.gamingBoardResultLimit) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.gamingBoardResultLimit,
    unknownLocationLabel:
      asString(value.unknownLocationLabel) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.unknownLocationLabel,
    unknownCompanyLabel:
      asString(value.unknownCompanyLabel) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.unknownCompanyLabel,
    hitmarkerEnabled:
      asBoolean(value.hitmarkerEnabled) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerEnabled,
    hitmarkerApiBaseUrl:
      asString(value.hitmarkerApiBaseUrl) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerApiBaseUrl,
    hitmarkerDefaultQuery:
      asString(value.hitmarkerDefaultQuery) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerDefaultQuery,
    hitmarkerDefaultLocation:
      asString(value.hitmarkerDefaultLocation) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerDefaultLocation,
    greenhouseApiBaseUrl:
      asString(value.greenhouseApiBaseUrl) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.greenhouseApiBaseUrl,
    greenhouseMaxPages:
      asNumber(value.greenhouseMaxPages) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.greenhouseMaxPages,
    greenhouseBoards: normalizeGreenhouseBoards(value.greenhouseBoards),
    leverApiBaseUrl:
      asString(value.leverApiBaseUrl) ?? DEFAULT_AUTOMATION_SETTINGS.jobProviders.leverApiBaseUrl,
    leverMaxPages:
      asNumber(value.leverMaxPages) ?? DEFAULT_AUTOMATION_SETTINGS.jobProviders.leverMaxPages,
    leverCompanies: normalizeLeverCompanies(value.leverCompanies),
    companyBoardApiTemplates: normalizeCompanyBoardTemplates(value.companyBoardApiTemplates),
    companyBoards: normalizeCompanyBoards(value.companyBoards),
    gamingPortals: normalizeGamingPortals(value.gamingPortals),
  };
};

const normalizeSpeechSettings = (value: unknown): AutomationSettings["speech"] => {
  if (!isRecord(value)) {
    return {
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
    };
  }

  const stt = isRecord(value.stt) ? value.stt : {};
  const tts = isRecord(value.tts) ? value.tts : {};
  const sttProvider =
    asEnum(stt.provider, SPEECH_PROVIDER_OPTIONS) ?? DEFAULT_SPEECH_SETTINGS.stt.provider;
  const ttsProvider =
    asEnum(tts.provider, SPEECH_PROVIDER_OPTIONS) ?? DEFAULT_SPEECH_SETTINGS.tts.provider;

  return {
    locale: asString(value.locale) ?? DEFAULT_SPEECH_SETTINGS.locale,
    stt: {
      provider: sttProvider,
      model: asString(stt.model) ?? DEFAULT_SPEECH_SETTINGS.stt.model,
      endpoint: asString(stt.endpoint) ?? DEFAULT_SPEECH_SETTINGS.stt.endpoint,
    },
    tts: {
      provider: ttsProvider,
      model: asString(tts.model) ?? DEFAULT_SPEECH_SETTINGS.tts.model,
      endpoint: asString(tts.endpoint) ?? DEFAULT_SPEECH_SETTINGS.tts.endpoint,
      voice: asString(tts.voice) ?? DEFAULT_SPEECH_SETTINGS.tts.voice,
      format: asEnum(tts.format, SPEECH_AUDIO_FORMATS) ?? DEFAULT_SPEECH_SETTINGS.tts.format,
    },
  };
};

const normalizeAutomationSettings = (value: unknown): AutomationSettings | undefined => {
  if (!isRecord(value)) return;

  return {
    headless: asBoolean(value.headless) ?? DEFAULT_AUTOMATION_SETTINGS.headless,
    defaultTimeout: asNumber(value.defaultTimeout) ?? DEFAULT_AUTOMATION_SETTINGS.defaultTimeout,
    screenshotRetention:
      asNumber(value.screenshotRetention) ?? DEFAULT_AUTOMATION_SETTINGS.screenshotRetention,
    maxConcurrentRuns:
      asNumber(value.maxConcurrentRuns) ?? DEFAULT_AUTOMATION_SETTINGS.maxConcurrentRuns,
    defaultBrowser:
      value.defaultBrowser === "chromium" || value.defaultBrowser === "edge"
        ? value.defaultBrowser
        : DEFAULT_AUTOMATION_SETTINGS.defaultBrowser,
    enableSmartSelectors:
      asBoolean(value.enableSmartSelectors) ?? DEFAULT_AUTOMATION_SETTINGS.enableSmartSelectors,
    autoSaveScreenshots:
      asBoolean(value.autoSaveScreenshots) ?? DEFAULT_AUTOMATION_SETTINGS.autoSaveScreenshots,
    speech: normalizeSpeechSettings(value.speech),
    jobProviders: normalizeJobProviderSettings(value.jobProviders),
  };
};

const normalizeEmailTransportSettings = (value: unknown): EmailTransportSettings | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const security =
    value.security === "tls" || value.security === "plain" ? value.security : "starttls";
  const authMethod = value.authMethod === "login" ? "login" : "plain";

  return {
    host: asString(value.host) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.host,
    port: asNumber(value.port) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.port,
    security,
    username: asString(value.username) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.username,
    fromEmail: asString(value.fromEmail) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.fromEmail,
    fromName: asString(value.fromName) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.fromName,
    authMethod,
    connectionTimeoutSeconds:
      asNumber(value.connectionTimeoutSeconds) ??
      DEFAULT_EMAIL_TRANSPORT_SETTINGS.connectionTimeoutSeconds,
  };
};

export const toAppSettings = (value: unknown): AppSettings | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  if (!id) return null;

  const notificationsRecord = asRecord(value.notifications) ?? {};
  const preferredProvider = normalizeAIProvider(value.preferredProvider);
  return {
    id,
    geminiApiKey: asString(value.geminiApiKey),
    openaiApiKey: asString(value.openaiApiKey),
    claudeApiKey: asString(value.claudeApiKey),
    huggingfaceToken: asString(value.huggingfaceToken),
    localModelEndpoint: asString(value.localModelEndpoint),
    localModelName: asString(value.localModelName),
    aiRouting: normalizeAIRoutingValue(value.aiRouting, preferredProvider),
    providerDiagnostics: normalizeProviderDiagnostics(value.providerDiagnostics),
    preferredModel: asString(value.preferredModel),
    preferredProvider,
    theme: normalizeAppDataTheme(asString(value.theme)),
    language: asEnum(value.language, APP_LANGUAGE_CODES) ?? DEFAULT_APP_LANGUAGE,
    brandSettings: resolveBrandSettings(isRecord(value.brandSettings) ? value.brandSettings : null),
    notifications: {
      achievements: asBoolean(notificationsRecord.achievements) ?? true,
      dailyChallenges: asBoolean(notificationsRecord.dailyChallenges) ?? true,
      levelUp: asBoolean(notificationsRecord.levelUp) ?? true,
      jobAlerts: asBoolean(notificationsRecord.jobAlerts) ?? true,
    },
    automationSettings: normalizeAutomationSettings(value.automationSettings),
    emailTransportSettings: normalizeEmailTransportSettings(value.emailTransportSettings),
    hasGeminiKey: asBoolean(value.hasGeminiKey),
    hasOpenaiKey: asBoolean(value.hasOpenaiKey),
    hasClaudeKey: asBoolean(value.hasClaudeKey),
    hasHuggingfaceToken: asBoolean(value.hasHuggingfaceToken),
    hasEmailTransportPassword: asBoolean(value.hasEmailTransportPassword),
    hasLocalKey: asBoolean(value.hasLocalKey),
  };
};
